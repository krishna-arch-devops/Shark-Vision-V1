# SHARKVISION Dashboard Design System — Iteration 4

## 1. Visual Hierarchy & Philosophy
The SHARKVISION analytical dashboard delivers on the product promise: **"Know Where Every Second Goes."**

### Core Design Rules:
1. **Evidence-Based Insights**: Every insight answers:
   - *What happened?*
   - *Why does it matter?*
   - *What should the student do next?*
2. **Accessible Contrast & Semantic Colors**:
   - Primary Accent: Deep Sky / Teal (`#0284c7`)
   - Success: Forest Green (`#047857`)
   - Warning: Warm Amber (`#b45309`)
   - Danger: Muted Coral/Rose (`#be123c`)
   - Color is never the sole indicator of status: supplemented with badges, labels, and icons.
3. **Restraint & Readability**: Zero gratuitous glassmorphism, heavy neon glows, or arbitrary decorative widgets. Built with clean cards, generous padding, and high-contrast typography.

---

## 2. Component Architecture
- **`MetricCard`**: High-impact key performance indicators with contextual subtext (e.g. attempted, dwell time, accuracy, score).
- **`InsightCard`**: Priority-badged recommendation cards presenting actionable advice directly tied to student mistakes or dwell time leaks.
- **`SpeedAccuracyMatrixView`**: Interactive 2x2 grid sorting questions into `FAST_CORRECT`, `SLOW_CORRECT`, `FAST_INCORRECT`, and `SLOW_INCORRECT`.
- **`AnswerChangeDashboardView`**: Counterfactual marks simulator and question-level choice modification inspector.
- **`TimeIntelligenceDashboardView`**: Sub-second monotonic dwell duration table separating correct, incorrect, and revisit seconds.
- **`SubjectsTopicsDashboardView`**: Granular subject accuracy meters and topic diagnostic cards with `INSUFFICIENT_DATA` guards.
- **`QuestionExplorerView`**: Filterable question list (`ALL`, `CORRECT`, `INCORRECT`, `UNANSWERED`, `CHANGED`).
