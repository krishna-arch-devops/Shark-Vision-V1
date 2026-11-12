# SHARKVISION Smart Skipping Intelligence — Iteration 5

## 1. Overview
High-stakes entrance examinations require strategic question selection. The **Skipping Intelligence** module measures how effectively a candidate recognizes time-traps and avoids investing excessive dwell seconds into unattempted problems.

## 2. Calculated Telemetry
- **Unanswered Dwell Time**: Total seconds spent reviewing questions that were ultimately left blank.
- **Abandoned Questions**: Questions revisited $\ge 2$ times with active dwell $> 30$s but left blank.
- **Target Duration Overruns**: Questions exceeding configured teacher benchmarks.
- **Skipping Efficiency Index**: Pacing discipline score (0 - 100) that penalizes lingering on problems without scoring.
