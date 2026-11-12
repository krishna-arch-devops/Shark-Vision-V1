-- SHARKVISION Database Schema Migration 002
-- Examination Engine, Question Bank, Attempt Lifecycle, Timing Intervals & Behavioral Event Log

-- 1. Enums
CREATE TYPE question_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE question_type AS ENUM ('SINGLE_CORRECT_MCQ', 'NUMERICAL', 'MULTIPLE_CORRECT');
CREATE TYPE exam_result_policy AS ENUM ('IMMEDIATE', 'AFTER_DEADLINE', 'MANUAL');
CREATE TYPE attempt_status AS ENUM ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED');

CREATE TYPE exam_event_type AS ENUM (
  'EXAM_STARTED',
  'QUESTION_OPENED',
  'QUESTION_LEFT',
  'ANSWER_SELECTED',
  'ANSWER_CHANGED',
  'ANSWER_CLEARED',
  'QUESTION_MARKED_FOR_REVIEW',
  'QUESTION_UNMARKED_FOR_REVIEW',
  'QUESTION_REVISITED',
  'TAB_HIDDEN',
  'TAB_VISIBLE',
  'EXAM_PAUSED_BY_SYSTEM',
  'EXAM_RESUMED',
  'EXAM_SUBMITTED',
  'EXAM_AUTO_SUBMITTED'
);

-- 2. Questions Master Table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category exam_target NOT NULL DEFAULT 'JEE_MAIN',
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  topic TEXT NOT NULL,
  difficulty question_difficulty NOT NULL DEFAULT 'MEDIUM',
  q_type question_type NOT NULL DEFAULT 'SINGLE_CORRECT_MCQ',
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL, -- Array of { id: "A"|"B"|"C"|"D", text: string }
  correct_answer TEXT NOT NULL, -- "A" | "B" | "C" | "D" (or string for future types)
  explanation TEXT,
  default_marks NUMERIC(5,2) NOT NULL DEFAULT 4.00,
  default_negative_marks NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_questions_subject ON public.questions(subject_id);
CREATE INDEX idx_questions_category ON public.questions(category);
CREATE INDEX idx_questions_created_by ON public.questions(created_by);

-- 3. Examinations Table
CREATE TABLE public.examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category exam_target NOT NULL DEFAULT 'JEE_MAIN',
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  total_marks NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  start_window TIMESTAMPTZ NOT NULL,
  end_window TIMESTAMPTZ NOT NULL,
  max_attempts INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
  result_release_policy exam_result_policy NOT NULL DEFAULT 'AFTER_DEADLINE',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_exam_window CHECK (end_window > start_window)
);

CREATE INDEX idx_examinations_category ON public.examinations(category);
CREATE INDEX idx_examinations_created_by ON public.examinations(created_by);

-- 4. Examination Questions Mapping (With immutable snapshot of content, options, and marks)
CREATE TABLE public.examination_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order INTEGER NOT NULL,
  marks NUMERIC(5,2) NOT NULL DEFAULT 4.00,
  negative_marks NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  -- Immutable snapshot copies so later edits to question bank do not alter completed examinations:
  snapshot_text TEXT NOT NULL,
  snapshot_options JSONB NOT NULL,
  snapshot_image_url TEXT,
  snapshot_correct_answer TEXT NOT NULL,
  snapshot_explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(examination_id, question_id),
  UNIQUE(examination_id, question_order)
);

CREATE INDEX idx_exam_questions_exam ON public.examination_questions(examination_id);

-- 5. Examination Batch Assignments
CREATE TABLE public.examination_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(examination_id, batch_id)
);

CREATE INDEX idx_exam_assignments_batch ON public.examination_assignments(batch_id);

-- 6. Student Examination Attempts
CREATE TABLE public.examination_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status attempt_status NOT NULL DEFAULT 'CREATED',
  started_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  server_deadline TIMESTAMPTZ NOT NULL, -- Authoritative server deadline
  submitted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(examination_id, student_id, attempt_number)
);

CREATE INDEX idx_exam_attempts_student ON public.examination_attempts(student_id);
CREATE INDEX idx_exam_attempts_exam ON public.examination_attempts(examination_id);

-- 7. Student Attempt Current Responses
CREATE TABLE public.attempt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option TEXT, -- 'A', 'B', 'C', 'D' or NULL
  is_marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  is_visited BOOLEAN NOT NULL DEFAULT TRUE,
  active_time_ms BIGINT NOT NULL DEFAULT 0, -- Cumulative active monotonic dwell time in ms
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_attempt_responses_attempt ON public.attempt_responses(attempt_id);

-- 8. Behavioral Event Log (Append-Only)
CREATE TABLE public.attempt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  event_type exam_event_type NOT NULL,
  client_sequence_num INTEGER NOT NULL,
  idempotency_key TEXT, -- Prevents duplicate event ingestion on network retry
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(attempt_id, idempotency_key)
);

CREATE INDEX idx_attempt_events_attempt_seq ON public.attempt_events(attempt_id, client_sequence_num);
CREATE INDEX idx_attempt_events_type ON public.attempt_events(event_type);

-- 9. Question Active Timing Intervals
CREATE TABLE public.attempt_timing_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  start_mono_ms BIGINT NOT NULL,
  end_mono_ms BIGINT NOT NULL,
  duration_ms BIGINT NOT NULL,
  client_session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_timing_intervals_attempt ON public.attempt_timing_intervals(attempt_id, question_id);

-- 10. Examination Results (Authoritative Graded Summaries)
CREATE TABLE public.examination_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  attempted_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  unanswered_questions INTEGER NOT NULL,
  marks_obtained NUMERIC(6,2) NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL,
  accuracy_percentage NUMERIC(5,2) NOT NULL,
  graded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  regraded_at TIMESTAMPTZ,
  grading_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_results_student ON public.examination_results(student_id);
CREATE INDEX idx_results_exam ON public.examination_results(examination_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examination_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examination_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examination_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_timing_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examination_results ENABLE ROW LEVEL SECURITY;

-- Questions RLS
CREATE POLICY "Super admins full access to questions"
  ON public.questions FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Teachers can create and manage their own questions"
  ON public.questions FOR ALL TO authenticated
  USING (public.get_auth_role() = 'TEACHER' AND created_by = auth.uid())
  WITH CHECK (public.get_auth_role() = 'TEACHER' AND created_by = auth.uid());

CREATE POLICY "Teachers can view all questions for test authoring"
  ON public.questions FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'TEACHER');

-- Students NEVER read the raw questions table directly to protect correct_answer and explanations!
-- (Students query examinations and sanitized delivery projection APIs)

-- Examinations RLS
CREATE POLICY "Super admins full access to examinations"
  ON public.examinations FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Teachers manage their created examinations"
  ON public.examinations FOR ALL TO authenticated
  USING (public.get_auth_role() = 'TEACHER' AND created_by = auth.uid())
  WITH CHECK (public.get_auth_role() = 'TEACHER' AND created_by = auth.uid());

CREATE POLICY "Teachers view all examinations"
  ON public.examinations FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'TEACHER');

CREATE POLICY "Students can view examinations assigned to their batches"
  ON public.examinations FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'STUDENT' AND
    is_published = TRUE AND
    EXISTS (
      SELECT 1 FROM public.examination_assignments ea
      JOIN public.batch_students bs ON ea.batch_id = bs.batch_id
      WHERE ea.examination_id = id AND bs.student_id = auth.uid()
    )
  );

-- Examination Questions RLS
CREATE POLICY "Super admins and teachers manage exam questions"
  ON public.examination_questions FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.get_auth_role() = 'TEACHER');

-- Attempts RLS
CREATE POLICY "Super admins full access to attempts"
  ON public.examination_attempts FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students view and insert own attempts"
  ON public.examination_attempts FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view attempts of students in their batches"
  ON public.examination_attempts FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'TEACHER' AND
    public.teacher_teaches_student(auth.uid(), student_id)
  );

-- Attempt Responses RLS
CREATE POLICY "Super admins full access to responses"
  ON public.attempt_responses FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students manage own responses"
  ON public.attempt_responses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.examination_attempts ea
      WHERE ea.id = attempt_id AND ea.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.examination_attempts ea
      WHERE ea.id = attempt_id AND ea.student_id = auth.uid()
    )
  );

-- Attempt Events RLS (Append-only by student for own attempts)
CREATE POLICY "Super admins full access to attempt events"
  ON public.attempt_events FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students can insert events to own attempts"
  ON public.attempt_events FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.examination_attempts ea
      WHERE ea.id = attempt_id AND ea.student_id = auth.uid() AND ea.status = 'IN_PROGRESS'
    )
  );

CREATE POLICY "Students can view own attempt events"
  ON public.attempt_events FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Examination Results RLS
CREATE POLICY "Super admins full access to results"
  ON public.examination_results FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Students view own results when released"
  ON public.examination_results FOR SELECT TO authenticated
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

CREATE POLICY "Parents view linked children results when released"
  ON public.examination_results FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'PARENT' AND
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = auth.uid() AND psl.student_id = examination_results.student_id AND psl.is_verified = TRUE
    ) AND
    EXISTS (
      SELECT 1 FROM public.examinations e
      WHERE e.id = examination_id AND (
        e.result_release_policy = 'IMMEDIATE' OR
        (e.result_release_policy = 'AFTER_DEADLINE' AND NOW() >= e.end_window)
      )
    )
  );

CREATE POLICY "Teachers view student results in assigned batches"
  ON public.examination_results FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'TEACHER' AND
    public.teacher_teaches_student(auth.uid(), student_id)
  );
