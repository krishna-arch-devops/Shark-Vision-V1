export type UserRole = "SUPER_ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
export type ExamTarget = "JEE_MAIN" | "JEE_ADVANCED" | "NEET" | "FOUNDATION" | "DEMO";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionType = "SINGLE_CORRECT_MCQ" | "NUMERICAL" | "MULTIPLE_CORRECT";
export type ExamResultPolicy = "IMMEDIATE" | "AFTER_DEADLINE" | "MANUAL";
export type AttemptStatus = "CREATED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED";

export type ExamEventType =
  | "EXAM_STARTED"
  | "QUESTION_OPENED"
  | "QUESTION_LEFT"
  | "ANSWER_SELECTED"
  | "ANSWER_CHANGED"
  | "ANSWER_CLEARED"
  | "QUESTION_MARKED_FOR_REVIEW"
  | "QUESTION_UNMARKED_FOR_REVIEW"
  | "QUESTION_REVISITED"
  | "TAB_HIDDEN"
  | "TAB_VISIBLE"
  | "EXAM_PAUSED_BY_SYSTEM"
  | "EXAM_RESUMED"
  | "EXAM_SUBMITTED"
  | "EXAM_AUTO_SUBMITTED";

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
  name: string;
  target_exam: ExamTarget;
  academic_year: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatchTeacher {
  id: string;
  batch_id: string;
  teacher_id: string;
  subject_id?: string | null;
  created_at: string;
}

export interface BatchStudent {
  id: string;
  batch_id: string;
  student_id: string;
  roll_number?: string | null;
  enrolled_at: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship_type: "FATHER" | "MOTHER" | "GUARDIAN";
  is_verified: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
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

// Question Option Item
export interface QuestionOptionItem {
  id: "A" | "B" | "C" | "D";
  text: string;
}

// Question Master
export interface Question {
  id: string;
  category: ExamTarget;
  subject_id: string;
  topic: string;
  difficulty: QuestionDifficulty;
  q_type: QuestionType;
  question_text: string;
  image_url?: string | null;
  options: QuestionOptionItem[];
  correct_answer: string; // "A"|"B"|"C"|"D"
  explanation?: string | null;
  default_marks: number;
  default_negative_marks: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Sanitized Question delivered to Student during examination (NO ANSWER KEY)
export interface StudentExamQuestion {
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  question_text: string;
  image_url?: string | null;
  options: QuestionOptionItem[];
  subject_name?: string;
  topic?: string;
}

// Examination Master
export interface Examination {
  id: string;
  title: string;
  description?: string | null;
  category: ExamTarget;
  duration_minutes: number;
  total_marks: number;
  start_window: string;
  end_window: string;
  max_attempts: number;
  result_release_policy: ExamResultPolicy;
  is_published: boolean;
  server_deadline: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Examination Question Link
export interface ExaminationQuestion {
  id: string;
  examination_id: string;
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  snapshot_text: string;
  snapshot_options: QuestionOptionItem[];
  snapshot_image_url?: string | null;
  snapshot_correct_answer: string;
  snapshot_explanation?: string | null;
  created_at: string;
}

// Examination Attempt
export interface ExaminationAttempt {
  id: string;
  examination_id: string;
  student_id: string;
  attempt_number: number;
  status: AttemptStatus;
  started_at: string;
  server_deadline: string;
  submitted_at?: string | null;
  last_activity_at: string;
  total_active_time_ms?: number;
  client_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Attempt Response
export interface AttemptResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_marked_for_review: boolean;
  is_visited: boolean;
  active_time_ms: number;
  last_visited_at: string;
  updated_at: string;
}

// Attempt Event
export interface AttemptEvent {
  id: string;
  attempt_id: string;
  student_id: string;
  question_id?: string | null;
  event_type: ExamEventType;
  client_sequence_num: number;
  idempotency_key?: string | null;
  client_timestamp: string;
  server_timestamp: string;
  payload: Record<string, unknown>;
  client_session_id: string;
  created_at: string;
}

// Examination Result Summary
export interface ExaminationResult {
  id: string;
  attempt_id: string;
  examination_id: string;
  student_id: string;
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
  marks_obtained: number;
  max_marks: number;
  accuracy_percentage: number;
  graded_at: string;
  regraded_at?: string | null;
  grading_version: number;
}
