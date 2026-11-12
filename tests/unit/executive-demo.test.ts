import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import {
  examinations,
  examinationQuestions,
  questions,
  subjects,
  profiles,
  batchStudents,
  examinationAssignments,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { startOrResumeExam } from "@/lib/exam/engine";

describe("SharkVision Executive Demo Assessment Verification", () => {
  let demoExamId: string;
  let demoStudentId: string;

  beforeAll(async () => {
    // 1. Locate Demo Exam
    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.title, "SHARKVISION — EXECUTIVE DEMO"))
      .limit(1);

    expect(exam).toBeDefined();
    expect(exam.category).toBe("DEMO");
    expect(exam.durationMinutes).toBe(15);
    expect(exam.resultReleasePolicy).toBe("IMMEDIATE");
    expect(exam.isPublished).toBe(true);
    demoExamId = exam.id;

    // 2. Locate Demo CEO profile
    const [demoStudent] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, "demo.ceo@sharkvision.com"))
      .limit(1);

    expect(demoStudent).toBeDefined();
    demoStudentId = demoStudent.id;
  });

  it("verifies exactly 20 questions exist with correct format and single correct answers", async () => {
    const examQuestionsList = await db
      .select({
        questionId: examinationQuestions.questionId,
        questionOrder: examinationQuestions.questionOrder,
        marks: examinationQuestions.marks,
        negativeMarks: examinationQuestions.negativeMarks,
        snapshotText: examinationQuestions.snapshotText,
        snapshotOptions: examinationQuestions.snapshotOptions,
        snapshotCorrectAnswer: examinationQuestions.snapshotCorrectAnswer,
        topic: questions.topic,
        subjectId: questions.subjectId,
      })
      .from(examinationQuestions)
      .innerJoin(questions, eq(examinationQuestions.questionId, questions.id))
      .where(eq(examinationQuestions.examinationId, demoExamId))
      .orderBy(examinationQuestions.questionOrder);

    expect(examQuestionsList.length).toBe(20);

    for (const q of examQuestionsList) {
      expect(Number(q.marks)).toBe(4);
      expect(Number(q.negativeMarks)).toBe(1);
      expect(q.snapshotText).toBeTruthy();

      const options = q.snapshotOptions as Array<{ id: string; text: string }>;
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(4);

      // Verify all 4 options are distinct and labeled A, B, C, D
      const optionKeys = options.map((opt) => opt.id);
      expect(optionKeys).toEqual(["A", "B", "C", "D"]);

      // Verify exactly one correct answer in ["A", "B", "C", "D"]
      expect(["A", "B", "C", "D"]).toContain(q.snapshotCorrectAnswer);
    }
  });

  it("verifies demo CEO can initialize the exam attempt session", async () => {
    const session = await startOrResumeExam(demoExamId, demoStudentId);
    expect(session).toBeDefined();
    expect(session.attempt.id).toBeDefined();
    expect(session.attempt.student_id).toBe(demoStudentId);
    expect(session.examination.id).toBe(demoExamId);
    expect(session.examination.title).toBe("SHARKVISION — EXECUTIVE DEMO");
    expect(session.examination.duration_minutes).toBe(15);
    expect(session.questions.length).toBe(20);
    expect(session.serverCurrentTime).toBeDefined();
  });
});
