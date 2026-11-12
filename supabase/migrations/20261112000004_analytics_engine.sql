-- SHARKVISION Database Schema Migration 004
-- Analytics Snapshot Persistence & Question Benchmark Target Times

-- 1. Add benchmark_seconds to questions and examination_questions
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS benchmark_seconds INTEGER DEFAULT NULL CHECK (benchmark_seconds IS NULL OR benchmark_seconds > 0);

ALTER TABLE public.examination_questions 
  ADD COLUMN IF NOT EXISTS snapshot_benchmark_seconds INTEGER DEFAULT NULL CHECK (snapshot_benchmark_seconds IS NULL OR snapshot_benchmark_seconds > 0);

-- 2. Attempt Analytics Snapshots (Cache of reproducible analytics)
CREATE TABLE public.attempt_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL DEFAULT 1,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  measurement_quality TEXT NOT NULL DEFAULT 'COMPLETE', -- 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE'
  
  -- Core metrics summary JSON
  performance_overview JSONB NOT NULL,
  
  -- Detailed metrics
  time_intelligence JSONB NOT NULL,
  answer_change_intelligence JSONB NOT NULL,
  speed_accuracy_matrix JSONB NOT NULL,
  subject_analytics JSONB NOT NULL,
  topic_analytics JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  parent_summary JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_analytics_snapshots_attempt ON public.attempt_analytics_snapshots(attempt_id);
CREATE INDEX idx_analytics_snapshots_exam ON public.attempt_analytics_snapshots(examination_id);
CREATE INDEX idx_analytics_snapshots_student ON public.attempt_analytics_snapshots(student_id);

-- Enable RLS on attempt_analytics_snapshots
ALTER TABLE public.attempt_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics snapshots
CREATE POLICY "Super admins full access to analytics snapshots"
  ON public.attempt_analytics_snapshots FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students view own analytics when exam results released"
  ON public.attempt_analytics_snapshots FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.examinations e
      WHERE e.id = examination_id AND (
        e.result_release_policy = 'IMMEDIATE' OR
        (e.result_release_policy = 'AFTER_DEADLINE' AND NOW() >= e.end_window)
      )
    )
  );

CREATE POLICY "Parents view linked child analytics when exam results released"
  ON public.attempt_analytics_snapshots FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'PARENT' AND
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = auth.uid() AND psl.student_id = attempt_analytics_snapshots.student_id AND psl.is_verified = TRUE
    ) AND
    EXISTS (
      SELECT 1 FROM public.examinations e
      WHERE e.id = examination_id AND (
        e.result_release_policy = 'IMMEDIATE' OR
        (e.result_release_policy = 'AFTER_DEADLINE' AND NOW() >= e.end_window)
      )
    )
  );

CREATE POLICY "Teachers view analytics for students in assigned batches"
  ON public.attempt_analytics_snapshots FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'TEACHER' AND
    public.teacher_teaches_student(auth.uid(), student_id)
  );
