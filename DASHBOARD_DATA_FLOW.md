# SHARKVISION Dashboard Data Flow & Authorization

## 1. Student Results Hub Data Flow
```
Student Submits Test
       ↓
Server Finalizes & Grades Attempt
       ↓
Student Navigates to /student/exams/[attemptId]/results
       ↓
Server verifies attempt belongs to authenticated student
       ↓
Server verifies result_release_policy (IMMEDIATE, AFTER_DEADLINE, MANUAL)
       ↓
AnalyticsService fetches or computes CompleteAttemptAnalytics
       ↓
StudentExamResultsHub renders MetricCards, Insights, & Tabbed Views
```

## 2. Parent Progress Dashboard Data Flow
```
Parent accesses /parent
       ↓
Server verifies parent profile
       ↓
Server queries verified linked children (parent_student_links.is_verified = true)
       ↓
Server retrieves latest submitted attempt for active child
       ↓
AnalyticsService computes parentSummary & recommendations
       ↓
ParentDashboard renders plain-English summary cards & next steps
```

## 3. Teacher Cohort Overview Data Flow
```
Teacher accesses /teacher
       ↓
Server queries assigned batches via batch_teachers
       ↓
Server retrieves latest submissions for students enrolled in those batches
       ↓
Teacher reviews batch rosters and clicks into student diagnostic reports
```
