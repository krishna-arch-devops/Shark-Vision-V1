# SHARKVISION Analytics Rule Engine Specification

## 1. Speed vs Accuracy Matrix Classification Rules

| Condition | Classification | Actionable Meaning |
|---|---|---|
| Unattempted | `UNANSWERED` | Question skipped without recorded answer |
| Benchmark = null | `UNKNOWN` | Cannot determine speed benchmark |
| ActiveTime $\le$ Benchmark AND Answer = Correct | `FAST_CORRECT` | Ideal mastery: rapid, precise execution |
| ActiveTime $>$ Benchmark AND Answer = Correct | `SLOW_CORRECT` | Conceptual understanding present, needs calculation speed drills |
| ActiveTime $\le$ Benchmark AND Answer = Incorrect | `FAST_INCORRECT` | Careless error / rushed question comprehension |
| ActiveTime $>$ Benchmark AND Answer = Incorrect | `SLOW_INCORRECT` | Critical time trap: high seconds spent resulting in negative mark |

---

## 2. Topic Proficiency Classification Rules

| Criteria | Classification | Rationale |
|---|---|---|
| Attempted $< 3$ | `INSUFFICIENT_DATA` | Sample size too small to conclude mastery or weakness |
| Attempted $\ge 3$ AND Accuracy $\ge 75\%$ | `STRONG` | Proven chapter mastery |
| Attempted $\ge 3$ AND Accuracy $\le 40\%$ | `NEEDS_ATTENTION` | Chapter conceptual gap requiring targeted remediation |
| Attempted $\ge 3$ AND $40\% < \text{Accuracy} < 75\%$ | `IMPROVING` | Moderate consistency, ongoing practice advised |

---

## 3. Recommendation Priorities & Data Quality
Recommendations are capped at the top 3 highest priority items to avoid cognitive overload on student and parent summary dashboards. Every recommendation item references concrete metric keys and question IDs.
