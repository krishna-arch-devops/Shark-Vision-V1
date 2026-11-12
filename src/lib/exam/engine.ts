import { db } from "@/lib/db";
import {
  examinations,
  examinationQuestions,
  examinationAttempts,
  attemptResponses,
  attemptEvents,
  examinationResults,
  questions,
  batches,
  batchStudents,
  examinationAssignments,
  profiles,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  StudentExamQuestion,
  ExaminationResult,
  ExaminationAttempt,
  Examination,
} from "@/types/database";

export interface StudentExamSession {
  attempt: ExaminationAttempt;
  examination: Examination;
  questions: StudentExamQuestion[];
  savedResponses: Record<
    string,
    {
      selected_option: string | null;
      is_marked_for_review: boolean;
      active_time_ms: number;
    }
  >;
  serverCurrentTime: string;
}

/**
 * Start or resume an examination attempt for an authorized student using native PostgreSQL/Drizzle.
 * Sanitizes questions to ensure correct_answer and explanations are completely excluded from student payloads.
 */
export async function startOrResumeExam(
  examinationId: string,
  studentId: string
): Promise<StudentExamSession> {
  const now = new Date();

  // 1. Verify examination exists & is published
  const [exam] = await db
    .select()
    .from(examinations)
    .where(eq(examinations.id, examinationId))
    .limit(1);

  if (!exam || !exam.isPublished) {
    throw new Error("Examination not found or is currently unpublished.");
  }

  // 2. Verify student is enrolled in a batch assigned to this exam
  const assigned = await db
    .select({ examId: examinationAssignments.examinationId })
    .from(examinationAssignments)
    .innerJoin(batches, eq(examinationAssignments.batchId, batches.id))
    .innerJoin(batchStudents, eq(batches.id, batchStudents.batchId))
    .where(
      and(
        eq(examinationAssignments.examinationId, examinationId),
        eq(batchStudents.studentId, studentId)
      )
    )
    .limit(1);

  if (assigned.length === 0) {
    throw new Error("You are not assigned to this examination.");
  }

  // 3. Verify availability window
  if (now < new Date(exam.startWindow)) {
    throw new Error("This examination has not started yet.");
  }
  if (now > new Date(exam.endWindow)) {
    throw new Error("This examination availability window has closed.");
  }

  // 4. Check for existing active attempt (idempotent resume)
  const existingAttempts = await db
    .select()
    .from(examinationAttempts)
    .where(
      and(
        eq(examinationAttempts.examinationId, examinationId),
        eq(examinationAttempts.studentId, studentId)
      )
    )
    .orderBy(desc(examinationAttempts.attemptNumber));

  let activeAttempt = existingAttempts.find((a) => a.status === "IN_PROGRESS" || a.status === "CREATED");

  if (!activeAttempt) {
    // Check attempt limits
    if (existingAttempts.length >= exam.maxAttempts) {
      throw new Error(`Maximum attempts (${exam.maxAttempts}) reached for this examination.`);
    }

    const nextAttemptNumber = existingAttempts.length + 1;
    const deadline = new Date(now.getTime() + exam.durationMinutes * 60000);

    const [newAttempt] = await db
      .insert(examinationAttempts)
      .values({
        examinationId,
        studentId,
        attemptNumber: nextAttemptNumber,
        status: "IN_PROGRESS",
        startedAt: now,
        serverDeadline: deadline,
      })
      .returning();

    activeAttempt = newAttempt;
  }

  // 5. Fetch questions WITHOUT answers or explanations
  const examQuestionsList = await db
    .select({
      id: examinationQuestions.id,
      questionId: examinationQuestions.questionId,
      questionOrder: examinationQuestions.questionOrder,
      marks: examinationQuestions.marks,
      negativeMarks: examinationQuestions.negativeMarks,
      snapshotText: examinationQuestions.snapshotText,
      snapshotOptions: examinationQuestions.snapshotOptions,
      snapshotImageUrl: examinationQuestions.snapshotImageUrl,
    })
    .from(examinationQuestions)
    .where(eq(examinationQuestions.examinationId, examinationId))
    .orderBy(examinationQuestions.questionOrder);

  // 6. Fetch existing responses for this attempt
  const responses = await db
    .select()
    .from(attemptResponses)
    .where(eq(attemptResponses.attemptId, activeAttempt.id));

  const savedMap: Record<
    string,
    {
      selected_option: string | null;
      is_marked_for_review: boolean;
      active_time_ms: number;
    }
  > = {};

  for (const r of responses) {
    savedMap[r.questionId] = {
      selected_option: r.selectedOption,
      is_marked_for_review: r.isMarkedForReview,
      active_time_ms: Number(r.activeTimeMs),
    };
  }

  return {
    attempt: {
      id: activeAttempt.id,
      examination_id: activeAttempt.examinationId,
      student_id: activeAttempt.studentId,
      attempt_number: activeAttempt.attemptNumber,
      status: activeAttempt.status as any,
      started_at: activeAttempt.startedAt ? activeAttempt.startedAt.toISOString() : now.toISOString(),
      submitted_at: activeAttempt.submittedAt ? activeAttempt.submittedAt.toISOString() : null,
      server_deadline: activeAttempt.serverDeadline.toISOString(),
      total_active_time_ms: Number(activeAttempt.totalActiveTimeMs),
      last_activity_at: activeAttempt.updatedAt.toISOString(),
      client_metadata: (activeAttempt.clientMetadata as Record<string, unknown>) || null,
      created_at: activeAttempt.createdAt.toISOString(),
      updated_at: activeAttempt.updatedAt.toISOString(),
    },
    examination: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      category: exam.category,
      duration_minutes: exam.durationMinutes,
      total_marks: Number(exam.totalMarks),
      start_window: exam.startWindow.toISOString(),
      end_window: exam.endWindow.toISOString(),
      max_attempts: exam.maxAttempts,
      result_release_policy: exam.resultReleasePolicy as any,
      is_published: exam.isPublished,
      server_deadline: activeAttempt.serverDeadline.toISOString(),
      created_by: exam.createdBy,
      created_at: exam.createdAt.toISOString(),
      updated_at: exam.updatedAt.toISOString(),
    },
    questions: examQuestionsList.map((q) => ({
      id: q.id,
      question_id: q.questionId,
      question_order: q.questionOrder,
      marks: Number(q.marks),
      negative_marks: Number(q.negativeMarks),
      question_text: q.snapshotText,
      options: q.snapshotOptions as any,
      image_url: q.snapshotImageUrl,
    })),
    savedResponses: savedMap,
    serverCurrentTime: now.toISOString(),
  };
}

/**
 * Authoritative server-side scoring & exam finalization on native PostgreSQL.
 */
export async function finalizeAttempt(
  attemptId: string,
  finalStatus: "SUBMITTED" | "AUTO_SUBMITTED" | "TIMED_OUT" = "SUBMITTED"
): Promise<ExaminationResult> {
  const now = new Date();

  // 1. Fetch attempt and exam
  const [attempt] = await db
    .select()
    .from(examinationAttempts)
    .where(eq(examinationAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  // Idempotency: If already graded, return existing result
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    const [existing] = await db
      .select()
      .from(examinationResults)
      .where(eq(examinationResults.attemptId, attemptId))
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        attempt_id: existing.attemptId,
        examination_id: existing.examinationId,
        student_id: existing.studentId,
        total_questions: existing.totalQuestions,
        attempted_questions: existing.attemptedQuestions,
        correct_answers: existing.correctAnswers,
        incorrect_answers: existing.incorrectAnswers,
        unanswered_questions: existing.unansweredQuestions,
        marks_obtained: Number(existing.marksObtained),
        max_marks: Number(existing.maxMarks),
        accuracy_percentage: Number(existing.accuracyPercentage),
        graded_at: existing.gradedAt.toISOString(),
        grading_version: existing.gradingVersion,
      };
    }
  }

  // 2. Fetch snapshot questions with authoritative answers
  const examQuestionsList = await db
    .select()
    .from(examinationQuestions)
    .where(eq(examinationQuestions.examinationId, attempt.examinationId));

  // 3. Fetch candidate's accepted responses
  const responses = await db
    .select()
    .from(attemptResponses)
    .where(eq(attemptResponses.attemptId, attemptId));

  const responseMap = new Map<string, string | null>();
  for (const r of responses) {
    responseMap.set(r.questionId, r.selectedOption);
  }

  // 4. Calculate score
  let correctCount = 0;
  let incorrectCount = 0;
  let attemptedCount = 0;
  let marksObtained = 0;
  let maxMarks = 0;

  for (const q of examQuestionsList) {
    const qMarks = Number(q.marks || 4);
    const qNeg = Number(q.negativeMarks || 1);
    maxMarks += qMarks;

    const studentAns = responseMap.get(q.questionId);
    if (studentAns) {
      attemptedCount++;
      if (studentAns.trim().toUpperCase() === q.snapshotCorrectAnswer.trim().toUpperCase()) {
        correctCount++;
        marksObtained += qMarks;
      } else {
        incorrectCount++;
        marksObtained -= qNeg;
      }
    }
  }

  const unansweredCount = examQuestionsList.length - attemptedCount;
  const accuracyPercentage = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  // 5. Update attempt status
  await db
    .update(examinationAttempts)
    .set({
      status: finalStatus as any,
      submittedAt: now,
      updatedAt: now,
    })
    .where(eq(examinationAttempts.id, attemptId));

  // 6. Record result
  const [result] = await db
    .insert(examinationResults)
    .values({
      attemptId,
      examinationId: attempt.examinationId,
      studentId: attempt.studentId,
      totalQuestions: examQuestionsList.length,
      attemptedQuestions: attemptedCount,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unansweredQuestions: unansweredCount,
      marksObtained: marksObtained.toFixed(2),
      maxMarks: maxMarks.toFixed(2),
      accuracyPercentage: accuracyPercentage.toFixed(2),
      gradedAt: now,
      gradingVersion: 1,
    })
    .onConflictDoUpdate({
      target: examinationResults.attemptId,
      set: {
        marksObtained: marksObtained.toFixed(2),
        accuracyPercentage: accuracyPercentage.toFixed(2),
        gradedAt: now,
      },
    })
    .returning();

  return {
    id: result.id,
    attempt_id: result.attemptId,
    examination_id: result.examinationId,
    student_id: result.studentId,
    total_questions: result.totalQuestions,
    attempted_questions: result.attemptedQuestions,
    correct_answers: result.correctAnswers,
    incorrect_answers: result.incorrectAnswers,
    unanswered_questions: result.unansweredQuestions,
    marks_obtained: Number(result.marksObtained),
    max_marks: Number(result.maxMarks),
    accuracy_percentage: Number(result.accuracyPercentage),
    graded_at: result.gradedAt.toISOString(),
    grading_version: result.gradingVersion,
  };
}
