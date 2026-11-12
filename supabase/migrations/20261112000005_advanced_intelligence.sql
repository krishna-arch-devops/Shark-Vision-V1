-- SHARKVISION Database Schema Migration 005
-- Revision Planner, Tasks & Parent Weekly Digests

-- 1. Revision Task Types & Status
CREATE TYPE revision_task_type AS ENUM (
  'REVIEW_TOPIC',
  'RETRY_QUESTION',
  'PRACTICE_TOPIC',
  'REVIEW_ANSWER_CHANGE',
  'REVIEW_SLOW_QUESTION'
);

CREATE TYPE revision_task_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE revision_task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- 2. Revision Plans Master Table
CREATE TABLE public.revision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  generated_from_attempt_id UUID REFERENCES public.examination_attempts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_revision_plans_student ON public.revision_plans(student_id);

-- 3. Revision Tasks Table
CREATE TABLE public.revision_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.revision_plans(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type revision_task_type NOT NULL,
  priority revision_task_priority NOT NULL DEFAULT 'MEDIUM',
  status revision_task_status NOT NULL DEFAULT 'PENDING',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  topic TEXT,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_revision_tasks_plan ON public.revision_tasks(plan_id);
CREATE INDEX idx_revision_tasks_student_status ON public.revision_tasks(student_id, status);

-- 4. Parent Weekly Digests
CREATE TABLE public.parent_weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  examinations_completed INTEGER NOT NULL DEFAULT 0,
  average_accuracy NUMERIC(5,2),
  average_score_percentage NUMERIC(5,2),
  strongest_subject TEXT,
  attention_subject TEXT,
  revision_tasks_completed INTEGER NOT NULL DEFAULT 0,
  digest_narrative JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(parent_id, student_id, week_start_date)
);

CREATE INDEX idx_parent_digests_parent ON public.parent_weekly_digests(parent_id);
CREATE INDEX idx_parent_digests_student ON public.parent_weekly_digests(student_id);

-- Enable Row Level Security
ALTER TABLE public.revision_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_weekly_digests ENABLE ROW LEVEL SECURITY;

-- Revision Plans RLS
CREATE POLICY "Super admins full access to revision plans"
  ON public.revision_plans FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students manage own revision plans"
  ON public.revision_plans FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view revision plans of assigned students"
  ON public.revision_plans FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'TEACHER' AND
    public.teacher_teaches_student(auth.uid(), student_id)
  );

CREATE POLICY "Parents view revision plans of verified children"
  ON public.revision_plans FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'PARENT' AND
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = auth.uid() AND psl.student_id = revision_plans.student_id AND psl.is_verified = TRUE
    )
  );

-- Revision Tasks RLS
CREATE POLICY "Super admins full access to revision tasks"
  ON public.revision_tasks FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students manage own revision tasks"
  ON public.revision_tasks FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view revision tasks of assigned students"
  ON public.revision_tasks FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'TEACHER' AND
    public.teacher_teaches_student(auth.uid(), student_id)
  );

CREATE POLICY "Parents view revision tasks of verified children"
  ON public.revision_tasks FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'PARENT' AND
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = auth.uid() AND psl.student_id = revision_tasks.student_id AND psl.is_verified = TRUE
    )
  );

-- Parent Weekly Digests RLS
CREATE POLICY "Super admins full access to digests"
  ON public.parent_weekly_digests FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Parents view own weekly digests"
  ON public.parent_weekly_digests FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
