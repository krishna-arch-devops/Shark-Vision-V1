# SHARKVISION Examination Engine Documentation — Iteration 2

## 1. Examination Engine Overview
The SHARKVISION Examination Engine powers high-stakes JEE Main, JEE Advanced, and NEET mock examinations with sub-second precision question dwell-time tracking, option change history, and authoritative server-side grading.

---

## 2. Examination Lifecycle
The state machine strictly enforces the following sequence:

```
[CREATED] ──(Student starts test)──> [IN_PROGRESS] ──(Deadline reached / submitted)──> [SUBMITTED] or [AUTO_SUBMITTED]
```

1. **Deployment**: Teachers author questions and compile them into an Examination, assigning the test to authorized Batches with defined start/end windows and durations.
2. **Snapshot Creation**: On exam creation, immutable snapshots of question text, options, marks, and correct answers are copied to `examination_questions`. Later modifications in the question bank will never alter active or completed exams.
3. **Start / Resume**: When a student accesses `/student/examinations/[id]/take`, `startOrResumeExam()` checks batch assignment, verifies the availability window, and checks for an active attempt.
   - If an active attempt exists, it resumes gracefully without creating duplicates.
   - If the server deadline has already passed, it automatically triggers `finalizeAttempt(id, 'AUTO_SUBMITTED')`.
4. **Sanitized Question Delivery**: Correct answers and solution explanations are stripped out server-side. Students only receive question IDs, orders, text, options, and mark schemes.
5. **Autosave & Behavioral Logging**: Option selections, option changes, and review flags are sent to `/api/exam/response` and `/api/exam/events`.
6. **Submission & Grading**: When the student submits or the server countdown finishes, `finalizeAttempt()` computes marks, negative marking, accuracy, and records the result in `examination_results`.

---

## 3. Timing Methodology & Question Dwell-Time Engine
- **Monotonic Clock**: Uses `performance.now()` in the browser rather than the wall-clock (`Date.now()`) to calculate question elapsed time. This prevents client clock manipulation or NTP adjustments from distorting active solving seconds.
- **Cumulative Revisit Accumulation**:
  - `Visit 1`: Student opens Question 5, spends 30,000ms.
  - `Visit 2`: Student revisits Question 5, spends 42,000ms.
  - `Total Active Time`: Accurately accumulated as 72,000ms (72 seconds).
- **Tab Visibility Guard**: When the browser tab switches or minimizes (`document.hidden = true`), the current question interval is stopped immediately and a `TAB_HIDDEN` event is dispatched. When the student returns, the monotonic clock restarts and a `TAB_VISIBLE` event is dispatched. Background time is never counted as active question time.
- **Authoritative Server Deadline**: The countdown timer displays remaining seconds based on the server-calculated deadline (`started_at + duration_minutes`). Even if a client alters their computer clock, the server rejects responses submitted past the deadline.

---

## 4. Behavioral Event Schema
All student actions are recorded in an append-only table `attempt_events`:
- `EXAM_STARTED`
- `QUESTION_OPENED`
- `QUESTION_LEFT`
- `ANSWER_SELECTED`
- `ANSWER_CHANGED`
- `ANSWER_CLEARED`
- `QUESTION_MARKED_FOR_REVIEW`
- `QUESTION_UNMARKED_FOR_REVIEW`
- `QUESTION_REVISITED`
- `TAB_HIDDEN`
- `TAB_VISIBLE`
- `EXAM_SUBMITTED`
- `EXAM_AUTO_SUBMITTED`

Each event captures:
- `attempt_id`, `student_id`, `question_id`
- `client_sequence_num`: Strictly ordered sequence
- `idempotency_key`: Combines attempt, sequence, and timestamp to prevent duplicate ingestion upon network retries
- `client_timestamp` & `server_timestamp`
- `payload`: Records previous answer, new answer, dwell milliseconds, etc.
- `client_session_id`: Unique browser tab session identifier

---

## 5. Offline Recovery & Conflict Resolution
- **Offline Event Queue**: In `useExamTimerAndEvents`, events and response updates are queued locally. If the network drops, `syncStatus` indicates `OFFLINE`.
- **Automatic Reconciliation**: As soon as the network returns (`window.addEventListener('online')`), pending events are flushed sequentially using their unique `idempotency_key`. The server gracefully deduplicates any already-ingested requests (`code 23505`).
- **Conflict Resolution**: The authoritative server database holds the ground truth. In case of concurrent tabs, the latest valid `updated_at` timestamp before the server deadline wins.

---

## 6. Server-Side Grading & Result Release Policy
- **Scoring Logic**:
  - Correct Answer: `+default_marks` (e.g., +4)
  - Incorrect Answer: `-default_negative_marks` (e.g., -1)
  - Unanswered: `0`
- **Policies**:
  - `IMMEDIATE`: Student can review score immediately following submission.
  - `AFTER_DEADLINE`: Results become visible to student and parents only after `end_window` passes.
  - `MANUAL`: Results remain hidden until teacher or administrator publishes.

---

## 7. Known Limitations
- Rich LaTeX rendering and equation editors will be enhanced in Iteration 3.
- Numerical question types and multiple-correct options will be activated in future iterations (schema already supports enum extension).
