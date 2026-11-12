-- ====================================================================
-- SHARKVISION Complete Standard PostgreSQL Migration
-- Decoupled from Supabase auth.users for Native PostgreSQL & AWS RDS
-- ====================================================================

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE exam_target AS ENUM ('JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'FOUNDATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE relationship_kind AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE institution_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('SINGLE_CORRECT_MCQ', 'NUMERICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE question_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE result_release_policy AS ENUM ('IMMEDIATE', 'AFTER_DEADLINE', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attempt_status AS ENUM ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'TIMED_OUT', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'QUESTION_VIEWED',
    'OPTION_SELECTED',
    'OPTION_CLEARED',
    'OPTION_CHANGED',
    'MARKED_FOR_REVIEW',
    'UNMARKED_FOR_REVIEW',
    'SECTION_SWITCHED',
    'WINDOW_BLURRED',
    'WINDOW_FOCUSED',
    'NETWORK_DISCONNECTED',
    'NETWORK_RECONNECTED',
    'DEVICE_STATE_CHANGE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Profiles Table (Native Identity with Password Hash for Local Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'STUDENT',
  full_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Institutions Table
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_institutions_code ON public.institutions(code);

-- 4. Institution Memberships Table
CREATE TABLE IF NOT EXISTS public.institution_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role institution_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_institution_memberships_user ON public.institution_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_memberships_inst ON public.institution_memberships(institution_id);

-- 5. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.subjects (name, code) VALUES
  ('Physics', 'PHY'),
  ('Chemistry', 'CHE'),
  ('Mathematics', 'MAT'),
  ('Biology', 'BIO')
ON CONFLICT (code) DO NOTHING;

-- 6. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_exam exam_target NOT NULL DEFAULT 'JEE_MAIN',
  academic_year TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_batches_inst ON public.batches(institution_id);

-- 7. Batch Teachers Table
CREATE TABLE IF NOT EXISTS public.batch_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(batch_id, teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_teachers_teacher ON public.batch_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_batch_teachers_batch ON public.batch_teachers(batch_id);

-- 8. Batch Students Table
CREATE TABLE IF NOT EXISTS public.batch_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_students_student ON public.batch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON public.batch_students(batch_id);

-- 9. Parent-Student Links Table
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship relationship_kind NOT NULL DEFAULT 'GUARDIAN',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON public.parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON public.parent_student_links(student_id);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- 11. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 12. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category exam_target NOT NULL DEFAULT 'JEE_MAIN',
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty question_difficulty NOT NULL DEFAULT 'MEDIUM',
  q_type question_type NOT NULL DEFAULT 'SINGLE_CORRECT_MCQ',
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  default_marks NUMERIC(5,2) NOT NULL DEFAULT 4.00,
  default_negative_marks NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);

-- 13. Question Benchmarks Table
CREATE TABLE IF NOT EXISTS public.question_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  expected_time_seconds INTEGER NOT NULL DEFAULT 120,
  topper_time_seconds INTEGER NOT NULL DEFAULT 45,
  difficulty_rating question_difficulty NOT NULL DEFAULT 'MEDIUM',
  ideal_attempt_strategy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(question_id)
);

-- 14. Examinations Table
CREATE TABLE IF NOT EXISTS public.examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category exam_target NOT NULL DEFAULT 'JEE_MAIN',
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  total_marks NUMERIC(6,2) NOT NULL DEFAULT 300.00,
  start_window TIMESTAMPTZ NOT NULL,
  end_window TIMESTAMPTZ NOT NULL,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  result_release_policy result_release_policy NOT NULL DEFAULT 'AFTER_DEADLINE',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_examinations_category ON public.examinations(category);
CREATE INDEX IF NOT EXISTS idx_examinations_window ON public.examinations(start_window, end_window);

-- 15. Examination Questions (Snapshot Mapping)
CREATE TABLE IF NOT EXISTS public.examination_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order INTEGER NOT NULL,
  marks NUMERIC(5,2) NOT NULL DEFAULT 4.00,
  negative_marks NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  snapshot_text TEXT NOT NULL,
  snapshot_options JSONB NOT NULL,
  snapshot_image_url TEXT,
  snapshot_correct_answer TEXT NOT NULL,
  snapshot_explanation TEXT,
  UNIQUE(examination_id, question_id),
  UNIQUE(examination_id, question_order)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.examination_questions(examination_id);

-- 16. Examination Assignments Table
CREATE TABLE IF NOT EXISTS public.examination_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(examination_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_assignments_batch ON public.examination_assignments(batch_id);

-- 17. Examination Attempts Table
CREATE TABLE IF NOT EXISTS public.examination_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status attempt_status NOT NULL DEFAULT 'CREATED',
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  server_deadline TIMESTAMPTZ NOT NULL,
  total_active_time_ms BIGINT NOT NULL DEFAULT 0,
  client_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(examination_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.examination_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.examination_attempts(examination_id);

-- 18. Attempt Responses Table
CREATE TABLE IF NOT EXISTS public.attempt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option TEXT,
  is_marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  is_visited BOOLEAN NOT NULL DEFAULT FALSE,
  active_time_ms BIGINT NOT NULL DEFAULT 0,
  last_visited_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_responses_attempt ON public.attempt_responses(attempt_id);

-- 19. Attempt Events (Append-Only Event Store)
CREATE TABLE IF NOT EXISTS public.attempt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  client_sequence_num INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_attempt_events_attempt ON public.attempt_events(attempt_id, client_sequence_num ASC);

-- 20. Examination Results Table
CREATE TABLE IF NOT EXISTS public.examination_results (
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
  grading_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_exam_results_student ON public.examination_results(student_id);

-- 21. Attempt Analytics Snapshots Table
CREATE TABLE IF NOT EXISTS public.attempt_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL DEFAULT 1,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  measurement_quality JSONB NOT NULL,
  performance_overview JSONB NOT NULL,
  time_intelligence JSONB NOT NULL,
  answer_change_intelligence JSONB NOT NULL,
  speed_accuracy_matrix JSONB NOT NULL,
  subject_analytics JSONB NOT NULL,
  topic_analytics JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  parent_summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_student ON public.attempt_analytics_snapshots(student_id);

-- 22. Revision Plans & Tasks Tables
CREATE TABLE IF NOT EXISTS public.revision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  generated_from_attempt_id UUID REFERENCES public.examination_attempts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.revision_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.revision_plans(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  topic TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_revision_tasks_student ON public.revision_tasks(student_id, status);
