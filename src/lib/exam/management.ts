"use server";

import { db } from "@/lib/db";
import { questions, questionBenchmarks, examinations, examinationQuestions, examinationAssignments } from "@/lib/db/schema";
import { CreateQuestionInput, CreateExaminationInput } from "@/lib/validation/exam";
import { requireRole } from "@/lib/auth/session";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createQuestionAction(input: CreateQuestionInput & { benchmarkSeconds?: number }) {
  const profile = await requireRole(["TEACHER", "SUPER_ADMIN"]);

  const options = [
    { id: "A", text: input.optionA },
    { id: "B", text: input.optionB },
    { id: "C", text: input.optionC },
    { id: "D", text: input.optionD },
  ];

  const [newQuestion] = await db
    .insert(questions)
    .values({
      category: input.category,
      subjectId: input.subjectId,
      topic: input.topic,
      difficulty: input.difficulty,
      qType: "SINGLE_CORRECT_MCQ",
      questionText: input.questionText,
      imageUrl: input.imageUrl || null,
      options,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation || null,
      defaultMarks: input.defaultMarks.toString(),
      defaultNegativeMarks: input.defaultNegativeMarks.toString(),
      isPublished: input.isPublished ?? true,
      createdBy: profile.id,
    })
    .returning();

  // Create benchmark duration if provided
  const benchmarkSec = input.benchmarkSeconds || (input.difficulty === "HARD" ? 180 : input.difficulty === "MEDIUM" ? 120 : 60);
  await db
    .insert(questionBenchmarks)
    .values({
      questionId: newQuestion.id,
      expectedTimeSeconds: benchmarkSec,
      topperTimeSeconds: Math.round(benchmarkSec / 2),
      difficultyRating: input.difficulty,
    })
    .onConflictDoNothing();

  revalidatePath("/teacher/questions");
  revalidatePath("/admin/question-bank");

  return newQuestion;
}

export async function updateQuestionAction(
  questionId: string,
  input: {
    category: any;
    subjectId: string;
    topic: string;
    difficulty: any;
    questionText: string;
    imageUrl?: string | null;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: any;
    explanation?: string | null;
    defaultMarks: number;
    defaultNegativeMarks: number;
    benchmarkSeconds?: number;
    isPublished?: boolean;
  }
) {
  const profile = await requireRole(["TEACHER", "SUPER_ADMIN"]);

  // Teacher can update question if they created it or if they are SUPER_ADMIN
  const [existing] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (!existing) {
    throw new Error("Question not found.");
  }

  if (profile.role === "TEACHER" && existing.createdBy !== profile.id) {
    throw new Error("You are not authorized to edit this question.");
  }

  const options = [
    { id: "A", text: input.optionA },
    { id: "B", text: input.optionB },
    { id: "C", text: input.optionC },
    { id: "D", text: input.optionD },
  ];

  await db
    .update(questions)
    .set({
      category: input.category,
      subjectId: input.subjectId,
      topic: input.topic,
      difficulty: input.difficulty,
      questionText: input.questionText,
      imageUrl: input.imageUrl || null,
      options,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation || null,
      defaultMarks: input.defaultMarks.toString(),
      defaultNegativeMarks: input.defaultNegativeMarks.toString(),
      isPublished: input.isPublished ?? existing.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId));

  // Also update benchmark if present
  if (input.benchmarkSeconds) {
    await db
      .insert(questionBenchmarks)
      .values({
        questionId,
        expectedTimeSeconds: input.benchmarkSeconds,
        topperTimeSeconds: Math.round(input.benchmarkSeconds / 2),
        difficultyRating: input.difficulty,
      })
      .onConflictDoUpdate({
        target: questionBenchmarks.questionId,
        set: {
          expectedTimeSeconds: input.benchmarkSeconds,
          difficultyRating: input.difficulty,
          updatedAt: new Date(),
        },
      });
  }

  revalidatePath("/teacher/questions");
  revalidatePath("/admin/question-bank");

  return { success: true };
}

export async function createExaminationAction(input: CreateExaminationInput) {
  const profile = await requireRole(["TEACHER", "SUPER_ADMIN"]);

  // 1. Fetch questions to calculate total marks and create immutable snapshots
  const questionsList = await db
    .select()
    .from(questions)
    .where(inArray(questions.id, input.questionIds));

  if (!questionsList || questionsList.length !== input.questionIds.length) {
    throw new Error("One or more selected questions could not be found.");
  }

  const totalMarks = questionsList.reduce(
    (sum, q) => sum + Number(q.defaultMarks || 4),
    0
  );

  // 2. Insert examination master
  const [exam] = await db
    .insert(examinations)
    .values({
      title: input.title,
      description: input.description || null,
      category: input.category,
      durationMinutes: input.durationMinutes,
      totalMarks: totalMarks.toString(),
      startWindow: new Date(input.startWindow),
      endWindow: new Date(input.endWindow),
      maxAttempts: input.maxAttempts,
      resultReleasePolicy: input.resultReleasePolicy,
      isPublished: input.isPublished,
      createdBy: profile.id,
    })
    .returning();

  // 3. Create immutable snapshots in examination_questions
  for (let idx = 0; idx < questionsList.length; idx++) {
    const q = questionsList[idx];
    await db.insert(examinationQuestions).values({
      examinationId: exam.id,
      questionId: q.id,
      questionOrder: idx + 1,
      marks: q.defaultMarks,
      negativeMarks: q.defaultNegativeMarks,
      snapshotText: q.questionText,
      snapshotOptions: q.options,
      snapshotImageUrl: q.imageUrl,
      snapshotCorrectAnswer: q.correctAnswer,
      snapshotExplanation: q.explanation,
      snapshotBenchmarkSeconds: 60,
    });
  }

  // 4. Assign examination to selected batches
  for (const batchId of input.batchIds) {
    await db.insert(examinationAssignments).values({
      examinationId: exam.id,
      batchId,
      assignedBy: profile.id,
    });
  }

  revalidatePath("/teacher/examinations");
  revalidatePath("/admin/examinations");

  return exam;
}
