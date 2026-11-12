"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateQuestionInput, CreateExaminationInput } from "@/lib/validation/exam";
import { requireRole } from "@/lib/auth/session";

export async function createQuestionAction(input: CreateQuestionInput) {
  const profile = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const supabase = await createClient();

  const options = [
    { id: "A", text: input.optionA },
    { id: "B", text: input.optionB },
    { id: "C", text: input.optionC },
    { id: "D", text: input.optionD },
  ];

  const { data, error } = await supabase
    .from("questions")
    .insert({
      category: input.category,
      subject_id: input.subjectId,
      topic: input.topic,
      difficulty: input.difficulty,
      q_type: "SINGLE_CORRECT_MCQ",
      question_text: input.questionText,
      image_url: input.imageUrl || null,
      options,
      correct_answer: input.correctAnswer,
      explanation: input.explanation || null,
      default_marks: input.defaultMarks,
      default_negative_marks: input.defaultNegativeMarks,
      is_published: input.isPublished,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create question: ${error.message}`);
  }

  return data;
}

export async function createExaminationAction(input: CreateExaminationInput) {
  const profile = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const supabase = await createClient();

  // 1. Fetch questions to calculate total marks and create immutable snapshots
  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("*")
    .in("id", input.questionIds);

  if (qError || !questions || questions.length !== input.questionIds.length) {
    throw new Error("One or more selected questions could not be found.");
  }

  const totalMarks = questions.reduce(
    (sum, q) => sum + Number(q.default_marks || 4),
    0
  );

  // 2. Insert examination master
  const { data: exam, error: examError } = await supabase
    .from("examinations")
    .insert({
      title: input.title,
      description: input.description || null,
      category: input.category,
      duration_minutes: input.durationMinutes,
      total_marks: totalMarks,
      start_window: input.startWindow,
      end_window: input.endWindow,
      max_attempts: input.maxAttempts,
      result_release_policy: input.resultReleasePolicy,
      is_published: input.isPublished,
      created_by: profile.id,
    })
    .select()
    .single();

  if (examError || !exam) {
    throw new Error(`Failed to create examination: ${examError?.message}`);
  }

  // 3. Insert immutable question snapshots into examination_questions
  const examQuestionRows = input.questionIds.map((qId, index) => {
    const q = questions.find((item) => item.id === qId)!;
    return {
      examination_id: exam.id,
      question_id: q.id,
      question_order: index + 1,
      marks: q.default_marks,
      negative_marks: q.default_negative_marks,
      snapshot_text: q.question_text,
      snapshot_options: q.options,
      snapshot_image_url: q.image_url,
      snapshot_correct_answer: q.correct_answer,
      snapshot_explanation: q.explanation,
    };
  });

  const { error: mappingError } = await supabase
    .from("examination_questions")
    .insert(examQuestionRows);

  if (mappingError) {
    throw new Error(`Failed to map questions to examination: ${mappingError.message}`);
  }

  // 4. Assign examination to batches
  const assignmentRows = input.batchIds.map((batchId) => ({
    examination_id: exam.id,
    batch_id: batchId,
    assigned_by: profile.id,
  }));

  const { error: assignError } = await supabase
    .from("examination_assignments")
    .insert(assignmentRows);

  if (assignError) {
    throw new Error(`Failed to assign examination to batches: ${assignError.message}`);
  }

  return exam;
}
