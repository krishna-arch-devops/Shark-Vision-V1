# SHARKVISION Architecture Document

## 1. Overview
SHARKVISION is a commercial SaaS performance intelligence platform built for high-stakes Indian entrance examinations (JEE Main, JEE Advanced, and NEET). The platform analyzes question dwell times, candidate answer revisions, difficulty performance curves, and examination strategy.

## 2. Architecture Principles
- **Modular Monolith**: Single Next.js (App Router) application.
- **Strict Role-Based & Resource-Based Authorization**: Both route level (middleware & SSR guards) and database level (Row Level Security).
- **Public Self-Registration Guard**: Public self-registration only ever provisions `STUDENT` profiles. Elevated roles (`SUPER_ADMIN`, `TEACHER`, `PARENT`) must be provisioned via admin workflows, invitations, or explicit database bootstrap scripts.
- **Zero Fabricated Metrics**: No hardcoded mock charts with arbitrary data; empty states guide the user until real test submissions are logged.

## 3. Core Database Entities (Iterations 1 & 2)
- `profiles`: Identity profiles extending `auth.users` with `user_role` (`SUPER_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`).
- `institutions`: Multi-tenant schools, junior colleges, and coaching centers.
- `institution_memberships`: Role-based membership inside an institution.
- `batches`: Exam target cohorts (e.g. JEE Advanced 2027 Rankers).
- `batch_teachers`: Maps teachers to specific batches and subjects.
- `batch_students`: Maps students to specific batches.
- `parent_student_links`: Guardian-to-candidate verification model.
- `subjects`: Physics, Chemistry, Mathematics, Biology.
- `audit_logs`: Immutable security log tracking all administrative modifications.
- `platform_settings`: Key-value configuration parameters.
- `questions`: Central question bank master with difficulty, topic, marks, options, and solution explanations.
- `examinations`: Scheduled tests with category, duration, windows, and result release policies.
- `examination_questions`: Immutable snapshots of questions attached to tests.
- `examination_assignments`: Batch assignment mapping.
- `examination_attempts`: Student test attempt lifecycle (`CREATED`, `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `EXPIRED`).
- `attempt_responses`: Student answers, review marks, and cumulative active dwell-times.
- `attempt_events`: Append-only audit log of student behavioral events.
- `attempt_timing_intervals`: Dwell-time interval records.
- `examination_results`: Authoritative server-graded performance records.

## 4. Security & Data Isolation
1. **Row Level Security (RLS)**: Enforced on all tables in PostgreSQL.
2. **Answer Key Protection**: Student question delivery projections strictly omit `snapshot_correct_answer` and `snapshot_explanation`.
3. **Teacher Isolation**: Teachers can only select student profiles that are enrolled in their assigned batches.
4. **Parent Isolation**: Parents can only access records of children explicitly linked and verified.
5. **Monotonic Timing & Server Deadlines**: Prevents client clock tampering.
