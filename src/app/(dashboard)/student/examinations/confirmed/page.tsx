import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ConfirmedExamPage({
  searchParams,
}: {
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { attemptId } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Examination Submitted</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Your answers, question timing telemetry, and review marks have been securely recorded on the server.
        </p>

        {attemptId && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 mb-6">
            <span className="text-[11px] text-slate-400">Attempt Reference ID:</span>
            <p className="font-mono text-xs font-semibold text-slate-700 truncate">{attemptId}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link href="/student/examinations">
            <Button className="w-full">
              Back to My Examinations
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/student">
            <Button variant="ghost" className="w-full text-xs">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
