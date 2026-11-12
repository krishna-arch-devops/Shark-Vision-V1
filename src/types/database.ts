export type UserRole = "SUPER_ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

export interface Profile {
  id: string; // references auth.users.id
  email: string;
  role: UserRole;
  full_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionMembership {
  id: string;
  institution_id: string;
  user_id: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  created_at: string;
}

export interface Batch {
  id: string;
  institution_id: string;
  name: string; // e.g. "JEE Advanced 2027 Rankers"
  target_exam: "JEE_MAIN" | "JEE_ADVANCED" | "NEET" | "FOUNDATION";
  academic_year: string; // e.g. "2026-2027"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatchTeacher {
  id: string;
  batch_id: string;
  teacher_id: string; // profile id
  subject_id?: string | null;
  created_at: string;
}

export interface BatchStudent {
  id: string;
  batch_id: string;
  student_id: string; // profile id
  roll_number?: string | null;
  enrolled_at: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string; // profile id
  student_id: string; // profile id
  relationship_type: "FATHER" | "MOTHER" | "GUARDIAN";
  is_verified: boolean;
  verified_at?: string | null;
  verified_by?: string | null; // admin profile id
  created_at: string;
}

export interface Subject {
  id: string;
  name: string; // "Physics", "Chemistry", "Mathematics", "Biology"
  code: string; // "PHY", "CHE", "MAT", "BIO"
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown> | string | number | boolean;
  description?: string | null;
  updated_by?: string | null;
  updated_at: string;
}
