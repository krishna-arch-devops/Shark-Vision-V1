import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            <FileText className="h-3.5 w-3.5" />
            <span>Commercial SaaS Terms</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="mt-1 text-xs text-slate-500">Effective Date: November 2026</p>

        <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p className="mt-2 text-xs leading-relaxed">
              By accessing SHARKVISION, institutions, teachers, parents, and students agree to these Terms of Service. The service is provided to assist in performance diagnostics for competitive examinations including JEE Main, JEE Advanced, and NEET.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Examination Integrity & Account Conduct</h2>
            <p className="mt-2 text-xs leading-relaxed">
              Users agree to maintain authentic credentials. Attempts to bypass authorization guards, manipulate question time telemetry, or reverse engineer assessment logic are strictly prohibited and result in account termination.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Role-Based Access</h2>
            <p className="mt-2 text-xs leading-relaxed">
              Access to administrative, teacher, or parental workspaces requires explicit authorization and institution verification.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Service Availability</h2>
            <p className="mt-2 text-xs leading-relaxed">
              SHARKVISION provides continuous software updates across iterations to refine diagnostic models. Inquiries can be addressed to <span className="font-mono text-slate-800">support@sharkvision.in</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
