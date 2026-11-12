# SHARKVISION Personalized Revision Planner — Iteration 5

## 1. Overview
The **Revision Planner** transforms post-exam diagnostics into an actionable, prioritized remedial agenda.

## 2. Deterministic Task Generation Rules
- **Weak Topics (`PRACTICE_TOPIC`)**: Generated for topics classified as `NEEDS_ATTENTION` ($\ge 3$ attempts with low accuracy). Directs candidate to foundational chapter practice.
- **Second-Guessing Penalties (`REVIEW_ANSWER_CHANGE`)**: Generated when answers were changed from initially correct choices to incorrect options (`CORRECT_TO_INCORRECT`).
- **Speed Traps (`REVIEW_SLOW_QUESTION`)**: Generated when questions exceeded target benchmark solving seconds and concluded in negative marks.

## 3. Student Workflow
- Route: `/student/revision`
- Capabilities:
  - View plan title and completion percentage.
  - Review task priorities (`HIGH`, `MEDIUM`, `LOW`).
  - Toggle tasks as completed (`toggleRevisionTaskStatusAction`).
  - Ownership strictly enforced via RLS.
