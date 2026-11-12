import { describe, it, expect } from "vitest";
import {
  CreateQuestionSchema,
  CreateExaminationSchema,
  ExamEventSchema,
  SaveResponseSchema,
} from "@/lib/validation/exam";

describe("Iteration 2: Examination & Question Validation Schemas", () => {
  describe("CreateQuestionSchema", () => {
    it("should accept valid single-correct MCQ question", () => {
      const res = CreateQuestionSchema.safeParse({
        category: "JEE_MAIN",
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        topic: "Kinematics",
        difficulty: "MEDIUM",
        questionText: "A particle travels with constant acceleration. What is its displacement in the nth second?",
        optionA: "u + a/2(2n - 1)",
        optionB: "u + an",
        optionC: "u + 1/2 a n^2",
        optionD: "u + 2an",
        correctAnswer: "A",
        explanation: "Standard kinematic derivation for distance in nth second.",
        defaultMarks: 4,
        defaultNegativeMarks: 1,
        isPublished: true,
      });
      expect(res.success).toBe(true);
    });

    it("should reject invalid correctAnswer option ID", () => {
      const res = CreateQuestionSchema.safeParse({
        category: "JEE_MAIN",
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        topic: "Kinematics",
        difficulty: "MEDIUM",
        questionText: "What is velocity?",
        optionA: "Rate of change of position",
        optionB: "Speed with direction",
        optionC: "Both A and B",
        optionD: "None",
        correctAnswer: "E", // Invalid
        defaultMarks: 4,
        defaultNegativeMarks: 1,
      });
      expect(res.success).toBe(false);
    });
  });

  describe("CreateExaminationSchema", () => {
    it("should validate endWindow is strictly after startWindow", () => {
      const invalidWindow = CreateExaminationSchema.safeParse({
        title: "JEE Mock 1",
        category: "JEE_MAIN",
        durationMinutes: 180,
        startWindow: "2026-11-20T10:00:00Z",
        endWindow: "2026-11-19T10:00:00Z", // Past!
        maxAttempts: 1,
        resultReleasePolicy: "AFTER_DEADLINE",
        questionIds: ["123e4567-e89b-12d3-a456-426614174001"],
        batchIds: ["123e4567-e89b-12d3-a456-426614174002"],
      });
      expect(invalidWindow.success).toBe(false);
    });

    it("should require at least one question and batch", () => {
      const noQuestions = CreateExaminationSchema.safeParse({
        title: "Empty Exam",
        durationMinutes: 60,
        startWindow: "2026-11-20T10:00:00Z",
        endWindow: "2026-11-21T10:00:00Z",
        questionIds: [], // Empty!
        batchIds: ["123e4567-e89b-12d3-a456-426614174002"],
      });
      expect(noQuestions.success).toBe(false);
    });
  });

  describe("ExamEventSchema & Behavioral Log Protection", () => {
    it("should strictly validate allowed ExamEventTypes", () => {
      const validEvent = ExamEventSchema.safeParse({
        attemptId: "123e4567-e89b-12d3-a456-426614174000",
        eventType: "ANSWER_CHANGED",
        clientSequenceNum: 4,
        idempotencyKey: "attempt_4_123456",
        clientTimestamp: new Date().toISOString(),
        payload: { fromOption: "A", toOption: "C" },
        clientSessionId: "session_xyz",
      });
      expect(validEvent.success).toBe(true);

      const invalidEvent = ExamEventSchema.safeParse({
        attemptId: "123e4567-e89b-12d3-a456-426614174000",
        eventType: "MALICIOUS_CUSTOM_EVENT", // Rejected!
        clientSequenceNum: 5,
        idempotencyKey: "attempt_5_123456",
        clientTimestamp: new Date().toISOString(),
        clientSessionId: "session_xyz",
      });
      expect(invalidEvent.success).toBe(false);
    });
  });

  describe("SaveResponseSchema", () => {
    it("should accept valid student response with activeTimeMs", () => {
      const res = SaveResponseSchema.safeParse({
        attemptId: "123e4567-e89b-12d3-a456-426614174000",
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        selectedOption: "B",
        isMarkedForReview: true,
        activeTimeMs: 72000,
      });
      expect(res.success).toBe(true);
    });

    it("should reject negative active time", () => {
      const res = SaveResponseSchema.safeParse({
        attemptId: "123e4567-e89b-12d3-a456-426614174000",
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        selectedOption: "B",
        isMarkedForReview: false,
        activeTimeMs: -500, // Invalid!
      });
      expect(res.success).toBe(false);
    });
  });
});
