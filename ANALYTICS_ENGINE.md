# SHARKVISION Behavioral Analytics Engine — Iteration 3

## 1. Engine Overview
The SHARKVISION Behavioral Analytics Engine computes reproducible, deterministic metrics from raw examination submissions and append-only behavioral telemetry.

**Key Architectures**:
- Pure deterministic calculators in TypeScript.
- Separation of concerns:
  `Data Access` ──> `Normalization` ──> `Calculations` ──> `Recommendations/Summaries` ──> `Authorized API & Snapshot Cache`.
- Zero AI / LLM usage: All classifications, speed matrices, and recommendations are derived from explicit transparent rules.

---

## 2. Core Calculators & Methodologies

### 2.1 Performance Overview
- **Attempted Questions**: Questions with a final accepted, non-empty response.
- **Accuracy**: $\frac{\text{Correct Answers}}{\text{Attempted Questions}} \times 100$. Explicit `null` when 0 questions are attempted (no divide-by-zero).
- **Percentage Score**: $\frac{\text{Marks Obtained}}{\text{Maximum Possible Marks}} \times 100$. Can be negative when penalties exceed positive marks.
- **Dwell Time vs Elapsed Time**: Separates total recorded active question dwell time from wall-clock exam duration.

### 2.2 Time Intelligence
- **Cumulative Active Dwell Time**: Aggregated monotonically across revisits.
- **Timing per Question**: Tracks visit counts, longest visit, first visit duration, time before first answer selection, and revisit durations.
- **Time by Outcome**: Separates time invested in correct answers, incorrect answers, and unanswered questions.
- **Quality Indicator**: Classified as `COMPLETE`, `PARTIAL`, or `UNAVAILABLE`.

### 2.3 Answer Change Intelligence & Marks Simulator
- **Sequence Reconstruction**: Reconstructs candidate decision path from `attempt_events` (`ANSWER_SELECTED`, `ANSWER_CHANGED`, `ANSWER_CLEARED`).
- **Classification Categories**:
  - `NO_CHANGE`
  - `CORRECT_TO_INCORRECT`
  - `INCORRECT_TO_CORRECT`
  - `CORRECT_TO_CORRECT`
  - `INCORRECT_TO_INCORRECT`
  - `CHANGED_TO_UNANSWERED`
  - `UNANSWERED_TO_ANSWERED`
- **First-Answer Scenario Simulation**: Calculates deterministic counterfactual score if every initially chosen option had been retained:
  $$\text{RetainedFirstAnswerDelta} = \text{HypotheticalScore} - \text{ActualScore}$$

### 2.4 Speed-versus-Accuracy Matrix
Classifies questions using teacher-configured benchmarks (`snapshot_benchmark_seconds`):
- `FAST_CORRECT`: $\text{ActiveTime} \le \text{Benchmark}$ and answer is correct.
- `SLOW_CORRECT`: $\text{ActiveTime} > \text{Benchmark}$ and answer is correct.
- `FAST_INCORRECT`: $\text{ActiveTime} \le \text{Benchmark}$ and answer is incorrect.
- `SLOW_INCORRECT`: $\text{ActiveTime} > \text{Benchmark}$ and answer is incorrect.
- `UNANSWERED`: Question unattempted.
- `UNKNOWN`: No benchmark configured on question snapshot.

---

## 3. Evidence-Based Recommendations (Rule Engine)
- **RULE 1 (`RULE_SLOW_INCORRECT_ATTENTION`)**: Triggers when $\ge 2$ questions are categorized as `SLOW_INCORRECT`. Directs candidate to review conceptual time-leaks.
- **RULE 2 (`RULE_ANSWER_CHANGE_PENALTY`)**: Triggers when answers were changed from correct to incorrect, resulting in lost marks. Recommends sticking to first instincts unless explicit calculation flaws are found.
- **RULE 3 (`RULE_TOPIC_PRACTICE_PRIORITY`)**: Identifies topics with low accuracy and $\ge 3$ attempts. Recommends foundational revision.
- **RULE 4 (`RULE_NEGATIVE_MARKING_DISCIPLINE`)**: Triggers when accuracy is $< 50\%$ across $\ge 5$ questions. Advises elimination of blind guesses.

---

## 4. Parent-Friendly Summaries
Plain-English statements for parents:
- Communicates attempted count, correct count, and accuracy without technical jargon.
- Notes strongest subject and areas needing attention.
- Observes time management efficiency without subjective labels.
- Includes data sufficiency notice.

---

## 5. Security & Authorization
- Route `/api/analytics/attempt/[attemptId]`:
  - **Students**: Authorized only for their own attempts, subject to `result_release_policy` (`IMMEDIATE`, `AFTER_DEADLINE`, `MANUAL`).
  - **Parents**: Authorized only for verified linked children (`parent_student_links.is_verified = true`).
  - **Teachers**: Authorized only for students in their assigned batches (`teacher_teaches_student()`).
