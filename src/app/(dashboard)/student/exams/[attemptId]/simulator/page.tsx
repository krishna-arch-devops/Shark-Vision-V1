import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { AnalyticsService } from "@/features/analytics/services/analytics-service";
import { InteractiveMarksSimulator } from "@/components/intelligence/interactive-marks-simulator";
import { db } from "@/lib/db";
import { examinationAttempts, examinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface SimulatorPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function MarksSimulatorPage({ params }: SimulatorPageProps) {
  const { attemptId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/exams/${attemptId}/simulator`);
  }

  // 1. Fetch attempt and exam master from native PostgreSQL
  const [attempt] = await db
    .select({
      studentId: examinationAttempts.studentId,
      examTitle: examinations.title,
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

  // 2. Validate Student Ownership
  if (profile.role === "STUDENT" && attempt.studentId !== profile.id) {
    redirect("/student");
  }

  // 3. Verify results are released
  const policy = attempt.resultReleasePolicy;
  const endWindow = new Date(attempt.endWindow);
  if (profile.role === "STUDENT") {
    if (policy === "AFTER_DEADLINE" && new Date() < endWindow) {
      redirect(`/student/exams/${attemptId}/results`);
    }
  }

  const analyticsService = new AnalyticsService();
  const analytics = await analyticsService.getOrComputeAttemptAnalytics(attemptId);

  return (
    <InteractiveMarksSimulator
      examTitle={attempt.examTitle}
      analytics={analytics}
    />
  );
}
