import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { reconstructExamTimeline } from "@/features/intelligence/services/replay-reconstruction";
import { ExamReplayPlayer } from "@/components/intelligence/exam-replay-player";
import { db } from "@/lib/db";
import {
  examinationAttempts,
  examinations,
  examinationQuestions,
  questions,
  attemptEvents,
  attemptResponses,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

interface ExamReplayPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function ExamReplayPage({ params }: ExamReplayPageProps) {
  const { attemptId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/exams/${attemptId}/replay`);
  }

  // 1. Fetch attempt and exam master from native PostgreSQL
  const [attempt] = await db
    .select({
      id: examinationAttempts.id,
      studentId: examinationAttempts.studentId,
      examinationId: examinationAttempts.examinationId,
      startedAt: examinationAttempts.startedAt,
      submittedAt: examinationAttempts.submittedAt,
      serverDeadline: examinationAttempts.serverDeadline,
      totalActiveTimeMs: examinationAttempts.totalActiveTimeMs,
      examTitle: examinations.title,
      durationMinutes: examinations.durationMinutes,
      resultReleasePolicy: examinations.resultReleasePolicy,
      endWindow: examinations.endWindow,
    })
    .from(examinationAttempts)
    .innerJoin(examinations, eq(examinationAttempts.examinationId, examinations.id))
    .where(eq(examinationAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    redirect("/student/examinations");
  }

  // 2. Validate Student Ownership (or elevated Super Admin / authorized Teacher)
  if (profile.role === "STUDENT" && attempt.studentId !== profile.id) {
    redirect("/student");
  }

  // 3. Check result release policy
  const policy = attempt.resultReleasePolicy;
  const endWindow = new Date(attempt.endWindow);
  const resultsReleased =
    policy === "IMMEDIATE" || (policy === "AFTER_DEADLINE" && new Date() >= endWindow);

  // 4. Fetch examination questions
  const examQuestionsList = await db
    .select({
      questionId: examinationQuestions.questionId,
      questionOrder: examinationQuestions.questionOrder,
      marks: examinationQuestions.marks,
      negativeMarks: examinationQuestions.negativeMarks,
      snapshotText: examinationQuestions.snapshotText,
      snapshotOptions: examinationQuestions.snapshotOptions,
      snapshotCorrectAnswer: examinationQuestions.snapshotCorrectAnswer,
      category: questions.category,
      topic: questions.topic,
    })
    .from(examinationQuestions)
    .innerJoin(questions, eq(examinationQuestions.questionId, questions.id))
    .where(eq(examinationQuestions.examinationId, attempt.examinationId))
    .orderBy(examinationQuestions.questionOrder);

  // 5. Fetch attempt events
  const events = await db
    .select()
    .from(attemptEvents)
    .where(eq(attemptEvents.attemptId, attemptId))
    .orderBy(asc(attemptEvents.clientSequenceNum));

  // 6. Fetch attempt responses
  const responses = await db
    .select()
    .from(attemptResponses)
    .where(eq(attemptResponses.attemptId, attemptId));

  const questionsMap = examQuestionsList.map((eqRow) => ({
    question_id: eqRow.questionId,
    question_order: eqRow.questionOrder,
    marks: Number(eqRow.marks),
    negative_marks: Number(eqRow.negativeMarks),
    snapshot_text: eqRow.snapshotText,
    snapshot_options: eqRow.snapshotOptions as any,
    snapshot_correct_answer: resultsReleased ? eqRow.snapshotCorrectAnswer : "",
    subject_name: eqRow.category,
    topic: eqRow.topic,
  }));

  const timeline = reconstructExamTimeline({
    attemptId,
    examTitle: attempt.examTitle,
    examCategory: "JEE_MAIN",
    startedAt: attempt.startedAt ? attempt.startedAt.toISOString() : new Date().toISOString(),
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
    questions: questionsMap,
    resultsReleased,
    responses: responses.map((r) => ({
      id: r.id,
      attempt_id: r.attemptId,
      question_id: r.questionId,
      selected_option: r.selectedOption,
      is_marked_for_review: r.isMarkedForReview,
      is_visited: r.isVisited,
      active_time_ms: Number(r.activeTimeMs),
      time_spent_seconds: Math.round(Number(r.activeTimeMs) / 1000),
      answer_change_count: 0,
      first_selected_option: null,
      last_interaction_at: null,
      created_at: r.updatedAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    })) as any,
    events: events.map((e) => ({
      id: e.id,
      attempt_id: e.attemptId,
      event_type: e.eventType,
      question_id: e.questionId,
      client_sequence_num: e.clientSequenceNum,
      client_timestamp: e.clientTimestamp.toISOString(),
      server_timestamp: e.serverTimestamp.toISOString(),
      payload: e.payload,
      created_at: e.createdAt.toISOString(),
    })) as any,
  });

  return (
    <ExamReplayPlayer
      replayData={timeline}
    />
  );
}
