import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/features/analytics/services/analytics-service";
import { InteractiveMarksSimulator } from "@/components/intelligence/interactive-marks-simulator";

interface SimulatorPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function MarksSimulatorPage({ params }: SimulatorPageProps) {
  const { attemptId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/exams/${attemptId}/simulator`);
  }

  const supabase = await createClient();

  // 1. Fetch attempt and exam master
  const { data: attempt, error: aErr } = await supabase
    .from("examination_attempts")
    .select("student_id, examinations!inner(title, result_release_policy, end_window)")
    .eq("id", attemptId)
    .single();

  if (aErr || !attempt) {
    redirect("/student/examinations");
  }

  // 2. Validate Student Ownership
  if (profile.role === "STUDENT" && attempt.student_id !== profile.id) {
    redirect("/student");
  }

  // 3. Verify results are released
  const policy = (attempt.examinations as any).result_release_policy;
  const endWindow = new Date((attempt.examinations as any).end_window);
  if (profile.role === "STUDENT") {
    if (policy === "AFTER_DEADLINE" && new Date() < endWindow) {
      redirect(`/student/exams/${attemptId}/results`);
    }
  }

  const analyticsService = new AnalyticsService();
  const analytics = await analyticsService.getOrComputeAttemptAnalytics(attemptId);

  return (
    <InteractiveMarksSimulator
      analytics={analytics}
      examTitle={(attempt.examinations as any).title}
    />
  );
}
