import { createClient } from "@/lib/supabase/server";
import { StudentExamQuestion, ExaminationAttempt, ExaminationResult } from "@/types/database";

export interface StudentExamSession {
  attempt: ExaminationAttempt;
  examination: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    duration_minutes: number;
    total_marks: number;
    server_deadline: string;
  };
  questions: StudentExamQuestion[];
  savedResponses: Record<string, {
    selected_option: string | null;
    is_marked_for_review: boolean;
    active_time_ms: number;
  }>;
  serverCurrentTime: string;
}

/**
 * Start or resume an examination attempt for an authorized student.
 * Sanitizes questions to ensure correct_answer and explanations are completely excluded.
 */
export async function startOrResumeExam(
  examinationId: string,
  studentId: string
): Promise<StudentExamSession> {
  const supabase = await createClient();

  // 1. Verify examination exists and is published
  const { data: exam, error: examErr } = await supabase
    .from("examinations")
    .select("*")
    .eq("id", examinationId)
    .single();

  if (examErr || !exam || !exam.is_published) {
    throw new Error("Examination not found or is currently unpublished.");
  }

  // 2. Verify student is enrolled in a batch assigned to this exam
  const { data: assignment, error: assignErr } = await supabase
    .from("examination_assignments")
    .select("batch_id, batches!inner(batch_students!inner(student_id))")
    .eq("examination_id", examinationId)
    .eq("batches.batch_students.student_id", studentId)
    .limit(1);

  if (assignErr || !assignment || assignment.length === 0) {
    throw new Error("You are not assigned to this examination.");
  }

  // 3. Verify availability window
  const now = new Date();
  if (now < new Date(exam.start_window)) {
    throw new Error("This examination has not started yet.");
  }
  if (now > new Date(exam.end_window)) {
    throw new Error("This examination availability window has closed.");
  }

  // 4. Check for existing active attempt (idempotent resume)
  const { data: existingAttempts } = await supabase
    .from("examination_attempts")
    .select("*")
    .eq("examination_id", examinationId)
    .eq("student_id", studentId)
    .order("attempt_number", { ascending: false });

  let activeAttempt: ExaminationAttempt | null = null;

  if (existingAttempts && existingAttempts.length > 0) {
    const latest = existingAttempts[0] as ExaminationAttempt;
    if (latest.status === "IN_PROGRESS" || latest.status === "CREATED") {
      // Check if server deadline has expired
      if (now > new Date(latest.server_deadline)) {
        // Auto-finalize expired attempt
        await finalizeAttempt(latest.id, "AUTO_SUBMITTED");
        throw new Error("Your examination session has expired.");
      }
      activeAttempt = latest;
    } else {
      // Already submitted/expired
      if (existingAttempts.length >= exam.max_attempts) {
        throw new Error("You have reached the maximum allowed attempts for this examination.");
      }
    }
  }

  // If no active attempt exists, create one
  if (!activeAttempt) {
    const attemptNumber = (existingAttempts?.length || 0) + 1;
    const deadline = new Date(now.getTime() + exam.duration_minutes * 60 * 1000);

    // If exam end_window is sooner than duration, clamp to end_window
    const examEndWindow = new Date(exam.end_window);
    const serverDeadline = deadline < examEndWindow ? deadline : examEndWindow;

    const { data: newAttempt, error: createErr } = await supabase
      .from("examination_attempts")
      .insert({
        examination_id: examinationId,
        student_id: studentId,
        attempt_number: attemptNumber,
        status: "IN_PROGRESS",
        started_at: now.toISOString(),
        server_deadline: serverDeadline.toISOString(),
        last_activity_at: now.toISOString(),
      })
      .select()
      .single();

    if (createErr || !newAttempt) {
      throw new Error(`Failed to initialize examination attempt: ${createErr?.message}`);
    }

    activeAttempt = newAttempt as ExaminationAttempt;
  }

  // 5. Fetch questions SANITIZED (DO NOT EXPOSE snapshot_correct_answer or snapshot_explanation)
  const { data: examQuestions, error: eqErr } = await supabase
    .from("examination_questions")
    .select("question_id, question_order, marks, negative_marks, snapshot_text, snapshot_options, snapshot_image_url")
    .eq("examination_id", examinationId)
    .order("question_order", { ascending: true });

  if (eqErr || !examQuestions) {
    throw new Error("Failed to load examination question set.");
  }

  const sanitizedQuestions: StudentExamQuestion[] = examQuestions.map((q) => ({
    question_id: q.question_id,
    question_order: q.question_order,
    marks: Number(q.marks),
    negative_marks: Number(q.negative_marks),
    question_text: q.snapshot_text,
    image_url: q.snapshot_image_url,
    options: q.snapshot_options,
  }));

  // 6. Fetch any previously saved responses for recovery
  const { data: responses } = await supabase
    .from("attempt_responses")
    .select("question_id, selected_option, is_marked_for_review, active_time_ms")
    .eq("attempt_id", activeAttempt.id);

  const savedResponses: Record<string, {
    selected_option: string | null;
    is_marked_for_review: boolean;
    active_time_ms: number;
  }> = {};

  if (responses) {
    for (const r of responses) {
      savedResponses[r.question_id] = {
        selected_option: r.selected_option,
        is_marked_for_review: r.is_marked_for_review,
        active_time_ms: Number(r.active_time_ms || 0),
      };
    }
  }

  return {
    attempt: activeAttempt,
    examination: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      category: exam.category,
      duration_minutes: exam.duration_minutes,
      total_marks: Number(exam.total_marks),
      server_deadline: activeAttempt.server_deadline,
    },
    questions: sanitizedQuestions,
    savedResponses,
    serverCurrentTime: new Date().toISOString(),
  };
}

/**
 * Authoritative server-side grading and attempt finalization.
 */
export async function finalizeAttempt(
  attemptId: string,
  finalStatus: "SUBMITTED" | "AUTO_SUBMITTED" = "SUBMITTED"
): Promise<ExaminationResult> {
  const supabase = await createClient();
  const now = new Date();

  // 1. Fetch attempt and exam
  const { data: attempt, error: aErr } = await supabase
    .from("examination_attempts")
    .select("*, examinations!inner(*)")
    .eq("id", attemptId)
    .single();

  if (aErr || !attempt) {
    throw new Error("Attempt not found.");
  }

  // Idempotency: If already graded, return existing result
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    const { data: existingResult } = await supabase
      .from("examination_results")
      .select("*")
      .eq("attempt_id", attemptId)
      .single();

    if (existingResult) {
      return existingResult as ExaminationResult;
    }
  }

  // 2. Fetch authoritative snapshot questions with correct answers
  const { data: examQuestions, error: eqErr } = await supabase
    .from("examination_questions")
    .select("question_id, marks, negative_marks, snapshot_correct_answer")
    .eq("examination_id", attempt.examination_id);

  if (eqErr || !examQuestions) {
    throw new Error("Unable to retrieve examination grading keys.");
  }

  // 3. Fetch candidate's accepted responses
  const { data: responses } = await supabase
    .from("attempt_responses")
    .select("question_id, selected_option")
    .eq("attempt_id", attemptId);

  const responseMap = new Map<string, string | null>();
  if (responses) {
    for (const r of responses) {
      responseMap.set(r.question_id, r.selected_option);
    }
  }

  // 4. Perform authoritative scoring
  let correctCount = 0;
  let incorrectCount = 0;
  let attemptedCount = 0;
  let marksObtained = 0;
  let maxMarks = 0;

  for (const q of examQuestions) {
    const qMarks = Number(q.marks || 4);
    const qNeg = Number(q.negative_marks || 1);
    maxMarks += qMarks;

    const studentAnswer = responseMap.get(q.question_id);
    if (studentAnswer) {
      attemptedCount++;
      if (studentAnswer.trim().toUpperCase() === q.snapshot_correct_answer.trim().toUpperCase()) {
        correctCount++;
        marksObtained += qMarks;
      } else {
        incorrectCount++;
        marksObtained -= qNeg;
      }
    }
  }

  const unansweredCount = examQuestions.length - attemptedCount;
  const accuracyPercentage = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  // 5. Update attempt status
  await supabase
    .from("examination_attempts")
    .update({
      status: finalStatus,
      submitted_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", attemptId);

  // 6. Persist result
  const { data: result, error: resErr } = await supabase
    .from("examination_results")
    .upsert({
      attempt_id: attemptId,
      examination_id: attempt.examination_id,
      student_id: attempt.student_id,
      total_questions: examQuestions.length,
      attempted_questions: attemptedCount,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unanswered_questions: unansweredCount,
      marks_obtained: marksObtained,
      max_marks: maxMarks,
      accuracy_percentage: Number(accuracyPercentage.toFixed(2)),
      graded_at: now.toISOString(),
      grading_version: 1,
    })
    .select()
    .single();

  if (resErr || !result) {
    throw new Error(`Failed to record examination result: ${resErr?.message}`);
  }

  return result as ExaminationResult;
}
