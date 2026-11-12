import { z } from "zod";

export const QuestionOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1, "Option text cannot be empty"),
});

export const CreateQuestionSchema = z.object({
  category: z.enum(["JEE_MAIN", "JEE_ADVANCED", "NEET", "FOUNDATION"]).default("JEE_MAIN"),
  subjectId: z.string().uuid("Invalid subject ID"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionText: z.string().min(5, "Question text must be at least 5 characters"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().optional().or(z.literal("")),
  defaultMarks: z.coerce.number().min(1, "Marks must be positive").default(4),
  defaultNegativeMarks: z.coerce.number().min(0, "Negative marks cannot be negative").default(1),
  isPublished: z.boolean().default(true),
});

export const CreateExaminationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().optional().or(z.literal("")),
  category: z.enum(["JEE_MAIN", "JEE_ADVANCED", "NEET", "FOUNDATION"]).default("JEE_MAIN"),
  durationMinutes: z.coerce.number().int().min(5, "Duration must be at least 5 minutes").max(360),
  startWindow: z.string().min(1, "Start window is required"),
  endWindow: z.string().min(1, "End window is required"),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  resultReleasePolicy: z.enum(["IMMEDIATE", "AFTER_DEADLINE", "MANUAL"]).default("AFTER_DEADLINE"),
  questionIds: z.array(z.string().uuid()).min(1, "Examination must have at least one question"),
  batchIds: z.array(z.string().uuid()).min(1, "Examination must be assigned to at least one batch"),
  isPublished: z.boolean().default(false),
}).refine((data) => new Date(data.endWindow) > new Date(data.startWindow), {
  message: "End window must be after start window",
  path: ["endWindow"],
});

export const ExamEventSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid().optional().nullable(),
  eventType: z.enum([
    "EXAM_STARTED",
    "QUESTION_OPENED",
    "QUESTION_LEFT",
    "ANSWER_SELECTED",
    "ANSWER_CHANGED",
    "ANSWER_CLEARED",
    "QUESTION_MARKED_FOR_REVIEW",
    "QUESTION_UNMARKED_FOR_REVIEW",
    "QUESTION_REVISITED",
    "TAB_HIDDEN",
    "TAB_VISIBLE",
    "EXAM_PAUSED_BY_SYSTEM",
    "EXAM_RESUMED",
    "EXAM_SUBMITTED",
    "EXAM_AUTO_SUBMITTED",
  ]),
  clientSequenceNum: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(1),
  clientTimestamp: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  clientSessionId: z.string().min(1),
});

export const SaveResponseSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  isMarkedForReview: z.boolean().default(false),
  activeTimeMs: z.number().int().nonnegative(),
});

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type CreateExaminationInput = z.infer<typeof CreateExaminationSchema>;
export type ExamEventInput = z.infer<typeof ExamEventSchema>;
export type SaveResponseInput = z.infer<typeof SaveResponseSchema>;
