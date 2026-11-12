-- SHARKVISION Database Schema Migration 001
-- Foundational Schema with Row Level Security (RLS) and Audit Logging

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT');
CREATE TYPE exam_target AS ENUM ('JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'FOUNDATION');
CREATE TYPE relationship_kind AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');
CREATE TYPE institution_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'STUDENT',
  full_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 3. Institutions Table
CREATE TABLE public.institutions (
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

CREATE INDEX idx_institutions_code ON public.institutions(code);

-- 4. Institution Memberships Table
CREATE TABLE public.institution_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role institution_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(institution_id, user_id)
);

CREATE INDEX idx_institution_memberships_user ON public.institution_memberships(user_id);
CREATE INDEX idx_institution_memberships_inst ON public.institution_memberships(institution_id);

-- 5. Subjects Table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Seed core subjects for JEE and NEET
INSERT INTO public.subjects (name, code) VALUES
  ('Physics', 'PHY'),
  ('Chemistry', 'CHE'),
  ('Mathematics', 'MAT'),
  ('Biology', 'BIO')
ON CONFLICT (code) DO NOTHING;

-- 6. Batches Table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_exam exam_target NOT NULL DEFAULT 'JEE_MAIN',
  academic_year TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_batches_inst ON public.batches(institution_id);

-- 7. Batch Teachers Table
CREATE TABLE public.batch_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(batch_id, teacher_id, subject_id)
);

CREATE INDEX idx_batch_teachers_teacher ON public.batch_teachers(teacher_id);
CREATE INDEX idx_batch_teachers_batch ON public.batch_teachers(batch_id);

-- 8. Batch Students Table
CREATE TABLE public.batch_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(batch_id, student_id)
);

CREATE INDEX idx_batch_students_student ON public.batch_students(student_id);
CREATE INDEX idx_batch_students_batch ON public.batch_students(batch_id);

-- 9. Parent-Student Links Table
CREATE TABLE public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type relationship_kind NOT NULL DEFAULT 'GUARDIAN',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(parent_id, student_id)
);

CREATE INDEX idx_parent_student_parent ON public.parent_student_links(parent_id);
CREATE INDEX idx_parent_student_student ON public.parent_student_links(student_id);

-- 10. Audit Logs Table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 11. Platform Settings Table
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 12. Row Level Security (RLS) Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role without recursive RLS trigger
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$;

-- Helper function to check if user teaches student
CREATE OR REPLACE FUNCTION public.teacher_teaches_student(p_teacher_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.batch_teachers bt
    JOIN public.batch_students bs ON bt.batch_id = bs.batch_id
    WHERE bt.teacher_id = p_teacher_id AND bs.student_id = p_student_id
  );
$$;

-- RLS Policies: Profiles
CREATE POLICY "Super Admins have full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own non-sensitive profile info"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Teachers can view assigned students profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'TEACHER' AND
    public.teacher_teaches_student(auth.uid(), id)
  );

CREATE POLICY "Parents can view verified linked children profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'PARENT' AND
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = auth.uid() AND psl.student_id = id AND psl.is_verified = TRUE
    )
  );

-- RLS Policies: Institutions
CREATE POLICY "Super Admins can manage institutions"
  ON public.institutions FOR ALL
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Members can view institutions"
  ON public.institutions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.institution_memberships im
      WHERE im.institution_id = id AND im.user_id = auth.uid()
    )
  );

-- RLS Policies: Batches
CREATE POLICY "Super Admins have full batch access"
  ON public.batches FOR ALL
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Teachers can view assigned batches"
  ON public.batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.batch_teachers bt
      WHERE bt.batch_id = id AND bt.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view enrolled batches"
  ON public.batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.batch_students bs
      WHERE bs.batch_id = id AND bs.student_id = auth.uid()
    )
  );

-- RLS Policies: Parent-Student Links
CREATE POLICY "Super Admins can manage parent student links"
  ON public.parent_student_links FOR ALL
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Parents can view own links"
  ON public.parent_student_links FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Students can view own links"
  ON public.parent_student_links FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- RLS Policies: Subjects
CREATE POLICY "Everyone authenticated can read subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Super Admins manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- RLS Policies: Audit Logs
CREATE POLICY "Super Admins view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Trigger to automatically create profile on auth.users sign up (only as STUDENT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
    'STUDENT', -- Enforces strict Student role default; never allows public registration to elevate
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
