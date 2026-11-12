import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { reconstructExamTimeline } from "@/features/intelligence/services/replay-reconstruction";
import { ExamReplayPlayer } from "@/components/intelligence/exam-replay-player";

interface ExamReplayPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function ExamReplayPage({ params }: ExamReplayPageProps) {
  const { attemptId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/exams/${attemptId}/replay`);
  }

  const supabase = await createClient();

  // 1. Fetch attempt and exam master
  const { data: attempt, error: aErr } = await supabase
    .from("examination_attempts")
    .select("*, examinations!inner(*)")
    .eq("id", attemptId)
    .single();

  if (aErr || !attempt) {
    redirect("/student/examinations");
  }

  // 2. Validate Student Ownership (or elevated Super Admin / authorized Teacher)
  if (profile.role === "STUDENT" && attempt.student_id !== profile.id) {
    redirect("/student");
  }

  // 3. Check result release policy
  const policy = (attempt.examinations as any).result_release_policy;
  const endWindow = new Date((attempt.examinations as any).end_window);
  const resultsReleased =
    policy === "IMMEDIATE" || (policy === "AFTER_DEADLINE" && new Date() >= endWindow);

  // 4. Fetch examination questions
  const { data: examQuestions } = await supabase
    .from("examination_questions")
    .select(`
      question_id,
      question_order,
      marks,
      negative_marks,
      snapshot_text,
      snapshot_options,
      snapshot_image_url,
      snapshot_correct_answer,
      snapshot_explanation,
      questions(
        topic,
        subjects(name)
      )
    `)
    .eq("examination_id", attempt.examination_id)
    .order("question_order", { ascending: true });

  const mappedQuestions = (examQuestions || []).map((eq: any) => ({
    question_id: eq.question_id,
    question_order: eq.question_order,
    marks: Number(eq.marks),
    negative_marks: Number(eq.negative_marks),
    snapshot_text: eq.snapshot_text,
    snapshot_options: eq.snapshot_options,
    snapshot_image_url: eq.snapshot_image_url,
    snapshot_correct_answer: eq.snapshot_correct_answer,
    snapshot_explanation: eq.snapshot_explanation,
    topic: eq.questions?.topic,
    subject_name: eq.questions?.subjects?.name,
  }));

  // 5. Fetch responses
  const { data: responses } = await supabase
    .from("attempt_responses")
    .select("*")
    .eq("attempt_id", attemptId);

  // 6. Fetch events
  const { data: events } = await supabase
    .from("attempt_events")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("client_sequence_num", { ascending: true });

  const replayData = reconstructExamTimeline({
    attemptId,
    examTitle: (attempt.examinations as any).title,
    examCategory: (attempt.examinations as any).category,
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,
    events: events || [],
    responses: responses || [],
    questions: mappedQuestions,
    resultsReleased,
  });

  return <ExamReplayPlayer replayData={replayData} />;
}
