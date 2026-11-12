import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { AnalyticsService } from "@/features/analytics/services/analytics-service";
import { StudentExamResultsHub } from "@/components/dashboard/student-exam-results-hub";
import { db } from "@/lib/db";
import { examinationAttempts, examinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface StudentExamResultsPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function StudentExamResultsPage({
  params,
}: StudentExamResultsPageProps) {
  const { attemptId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/exams/${attemptId}/results`);
  }

  // 1. Fetch attempt and exam master from native PostgreSQL
  const [attemptData] = await db
    .select({
      studentId: examinationAttempts.studentId,
      examTitle: examinations.title,
      examCategory: examinations.category,
      resultReleasePolicy: examinations.resultReleasePolicy,
      endWindow: examinations.endWindow,
    })
    .from(examinationAttempts)
    .innerJoin(examinations, eq(examinationAttempts.examinationId, examinations.id))
    .where(eq(examinationAttempts.id, attemptId))
    .limit(1);

  if (!attemptData) {
    redirect("/student/examinations");
  }

  // 2. Validate Student Ownership (or elevated Super Admin)
  if (profile.role === "STUDENT" && attemptData.studentId !== profile.id) {
    redirect("/student");
  }

  // 3. Validate Result Release Policy
  const policy = attemptData.resultReleasePolicy;
  const endWindow = new Date(attemptData.endWindow);

  if (profile.role === "STUDENT") {
    if (policy === "AFTER_DEADLINE" && new Date() < endWindow) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Results Pending Release</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Your test was submitted successfully. In accordance with the examination policy, comprehensive analytics and solutions will become visible once the examination window closes on:
            </p>
            <div className="rounded-lg bg-slate-100 p-3 mb-6 font-semibold text-xs text-slate-800">
              {endWindow.toLocaleString()}
            </div>
            <a
              href="/student/examinations"
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Back to My Examinations
            </a>
          </div>
        </div>
      );
    }
  }

  // 4. Compute or load analytics snapshot via native PostgreSQL
  const analyticsService = new AnalyticsService();
  const analytics = await analyticsService.getOrComputeAttemptAnalytics(attemptId);

  return (
    <StudentExamResultsHub
      analytics={analytics}
      examTitle={attemptData.examTitle}
      examCategory={attemptData.examCategory}
    />
  );
}
