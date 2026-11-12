import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { startOrResumeExam } from "@/lib/exam/engine";
import { StudentExamWorkspace } from "@/components/exam/student-exam-workspace";

interface LiveExamPageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveExamPage({ params }: LiveExamPageProps) {
  const { id: examId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/examinations/${examId}/take`);
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/student");
  }

  try {
    const session = await startOrResumeExam(examId, profile.id);
    return <StudentExamWorkspace session={session} />;
  } catch (error: any) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4 font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Examination Notice</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {error.message || "Unable to access examination."}
          </p>
          <a
            href="/student/examinations"
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
          >
            Back to My Examinations
          </a>
        </div>
      </div>
    );
  }
}
