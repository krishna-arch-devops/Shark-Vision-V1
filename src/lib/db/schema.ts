import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  bigint,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "SUPER_ADMIN",
  "TEACHER",
  "PARENT",
  "STUDENT",
]);

export const examTargetEnum = pgEnum("exam_target", [
  "JEE_MAIN",
  "JEE_ADVANCED",
  "NEET",
  "FOUNDATION",
]);

export const relationshipKindEnum = pgEnum("relationship_kind", [
  "FATHER",
  "MOTHER",
  "GUARDIAN",
]);

export const institutionRoleEnum = pgEnum("institution_role", [
  "ADMIN",
  "TEACHER",
  "STUDENT",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "SINGLE_CORRECT_MCQ",
  "NUMERICAL",
]);

export const questionDifficultyEnum = pgEnum("question_difficulty", [
  "EASY",
  "MEDIUM",
  "HARD",
]);

export const resultReleasePolicyEnum = pgEnum("result_release_policy", [
  "IMMEDIATE",
  "AFTER_DEADLINE",
  "MANUAL",
]);

export const attemptStatusEnum = pgEnum("attempt_status", [
  "CREATED",
  "IN_PROGRESS",
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "TIMED_OUT",
  "CANCELLED",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "QUESTION_VIEWED",
  "OPTION_SELECTED",
  "OPTION_CLEARED",
  "OPTION_CHANGED",
  "MARKED_FOR_REVIEW",
  "UNMARKED_FOR_REVIEW",
  "SECTION_SWITCHED",
  "WINDOW_BLURRED",
  "WINDOW_FOCUSED",
  "NETWORK_DISCONNECTED",
  "NETWORK_RECONNECTED",
  "DEVICE_STATE_CHANGE",
]);

// 1. Profiles Table
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("STUDENT"),
    fullName: text("full_name").notNull(),
    phoneNumber: text("phone_number"),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_profiles_role").on(table.role),
    index("idx_profiles_email").on(table.email),
  ]
);

// 2. Institutions Table
export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 3. Institution Memberships
export const institutionMemberships = pgTable(
  "institution_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: institutionRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_inst_user").on(table.institutionId, table.userId),
  ]
);

// 4. Subjects Table
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. Batches Table
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetExam: examTargetEnum("target_exam").notNull().default("JEE_MAIN"),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 6. Batch Teachers Table
export const batchTeachers = pgTable(
  "batch_teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_batch_teacher_subject").on(table.batchId, table.teacherId, table.subjectId),
  ]
);

// 7. Batch Students Table
export const batchStudents = pgTable(
  "batch_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    unique("uq_batch_student").on(table.batchId, table.studentId),
  ]
);

// 8. Parent-Student Links Table
export const parentStudentLinks = pgTable(
  "parent_student_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    relationship: relationshipKindEnum("relationship").notNull().default("GUARDIAN"),
    isVerified: boolean("is_verified").notNull().default(false),
    verificationToken: text("verification_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_parent_student").on(table.parentId, table.studentId),
  ]
);

// 9. Questions Table
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: examTargetEnum("category").notNull().default("JEE_MAIN"),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "restrict" }),
  topic: text("topic").notNull(),
  subtopic: text("subtopic"),
  difficulty: questionDifficultyEnum("difficulty").notNull().default("MEDIUM"),
  qType: questionTypeEnum("q_type").notNull().default("SINGLE_CORRECT_MCQ"),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  options: jsonb("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  defaultMarks: numeric("default_marks", { precision: 5, scale: 2 }).notNull().default("4.00"),
  defaultNegativeMarks: numeric("default_negative_marks", { precision: 5, scale: 2 })
    .notNull()
    .default("1.00"),
  isPublished: boolean("is_published").notNull().default(false),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 10. Question Benchmarks
export const questionBenchmarks = pgTable("question_benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .unique()
    .references(() => questions.id, { onDelete: "cascade" }),
  expectedTimeSeconds: integer("expected_time_seconds").notNull().default(120),
  topperTimeSeconds: integer("topper_time_seconds").notNull().default(45),
  difficultyRating: questionDifficultyEnum("difficulty_rating").notNull().default("MEDIUM"),
  idealAttemptStrategy: text("ideal_attempt_strategy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 11. Examinations Table
export const examinations = pgTable("examinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: examTargetEnum("category").notNull().default("JEE_MAIN"),
  durationMinutes: integer("duration_minutes").notNull().default(180),
  totalMarks: numeric("total_marks", { precision: 6, scale: 2 }).notNull().default("300.00"),
  startWindow: timestamp("start_window", { withTimezone: true }).notNull(),
  endWindow: timestamp("end_window", { withTimezone: true }).notNull(),
  maxAttempts: integer("max_attempts").notNull().default(1),
  resultReleasePolicy: resultReleasePolicyEnum("result_release_policy")
    .notNull()
    .default("AFTER_DEADLINE"),
  isPublished: boolean("is_published").notNull().default(false),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 12. Examination Questions
export const examinationQuestions = pgTable(
  "examination_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    examinationId: uuid("examination_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    questionOrder: integer("question_order").notNull(),
    marks: numeric("marks", { precision: 5, scale: 2 }).notNull().default("4.00"),
    negativeMarks: numeric("negative_marks", { precision: 5, scale: 2 }).notNull().default("1.00"),
    snapshotText: text("snapshot_text").notNull(),
    snapshotOptions: jsonb("snapshot_options").notNull(),
    snapshotImageUrl: text("snapshot_image_url"),
    snapshotCorrectAnswer: text("snapshot_correct_answer").notNull(),
    snapshotExplanation: text("snapshot_explanation"),
  },
  (table) => [
    unique("uq_exam_question").on(table.examinationId, table.questionId),
    unique("uq_exam_order").on(table.examinationId, table.questionOrder),
  ]
);

// 13. Examination Assignments
export const examinationAssignments = pgTable(
  "examination_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    examinationId: uuid("examination_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_exam_batch").on(table.examinationId, table.batchId),
  ]
);

// 14. Examination Attempts
export const examinationAttempts = pgTable(
  "examination_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    examinationId: uuid("examination_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: attemptStatusEnum("status").notNull().default("CREATED"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    serverDeadline: timestamp("server_deadline", { withTimezone: true }).notNull(),
    totalActiveTimeMs: bigint("total_active_time_ms", { mode: "number" }).notNull().default(0),
    clientMetadata: jsonb("client_metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_exam_student_attempt").on(table.examinationId, table.studentId, table.attemptNumber),
  ]
);

// 15. Attempt Responses
export const attemptResponses = pgTable(
  "attempt_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examinationAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    selectedOption: text("selected_option"),
    isMarkedForReview: boolean("is_marked_for_review").notNull().default(false),
    isVisited: boolean("is_visited").notNull().default(false),
    activeTimeMs: bigint("active_time_ms", { mode: "number" }).notNull().default(0),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_attempt_question").on(table.attemptId, table.questionId),
  ]
);

// 16. Attempt Events
export const attemptEvents = pgTable(
  "attempt_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examinationAttempts.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").references(() => questions.id, { onDelete: "set null" }),
    eventType: eventTypeEnum("event_type").notNull(),
    clientSequenceNum: integer("client_sequence_num").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    clientTimestamp: timestamp("client_timestamp", { withTimezone: true }).notNull(),
    serverTimestamp: timestamp("server_timestamp", { withTimezone: true }).notNull().defaultNow(),
    payload: jsonb("payload").notNull().default({}),
    clientSessionId: text("client_session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_attempt_events_attempt").on(table.attemptId, table.clientSequenceNum),
  ]
);

// 17. Examination Results
export const examinationResults = pgTable("examination_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .unique()
    .references(() => examinationAttempts.id, { onDelete: "cascade" }),
  examinationId: uuid("examination_id")
    .notNull()
    .references(() => examinations.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  totalQuestions: integer("total_questions").notNull(),
  attemptedQuestions: integer("attempted_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  unansweredQuestions: integer("unanswered_questions").notNull(),
  marksObtained: numeric("marks_obtained", { precision: 6, scale: 2 }).notNull(),
  maxMarks: numeric("max_marks", { precision: 6, scale: 2 }).notNull(),
  accuracyPercentage: numeric("accuracy_percentage", { precision: 5, scale: 2 }).notNull(),
  gradedAt: timestamp("graded_at", { withTimezone: true }).notNull().defaultNow(),
  gradingVersion: integer("grading_version").notNull().default(1),
});

// 18. Attempt Analytics Snapshots
export const attemptAnalyticsSnapshots = pgTable("attempt_analytics_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .unique()
    .references(() => examinationAttempts.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  examinationId: uuid("examination_id")
    .notNull()
    .references(() => examinations.id, { onDelete: "cascade" }),
  schemaVersion: integer("schema_version").notNull().default(1),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
  measurementQuality: jsonb("measurement_quality").notNull(),
  performanceOverview: jsonb("performance_overview").notNull(),
  timeIntelligence: jsonb("time_intelligence").notNull(),
  answerChangeIntelligence: jsonb("answer_change_intelligence").notNull(),
  speedAccuracyMatrix: jsonb("speed_accuracy_matrix").notNull(),
  subjectAnalytics: jsonb("subject_analytics").notNull(),
  topicAnalytics: jsonb("topic_analytics").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  parentSummary: jsonb("parent_summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 19. Revision Plans & Tasks
export const revisionPlans = pgTable("revision_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  generatedFromAttemptId: uuid("generated_from_attempt_id").references(
    () => examinationAttempts.id,
    { onDelete: "set null" }
  ),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const revisionTasks = pgTable("revision_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => revisionPlans.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(),
  priority: text("priority").notNull().default("MEDIUM"),
  status: text("status").notNull().default("PENDING"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  topic: text("topic"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
