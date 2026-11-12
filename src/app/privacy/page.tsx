import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield className="h-3.5 w-3.5" />
            <span>Data Protection Policy</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-xs text-slate-500">Effective Date: November 2026</p>

        <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Information Collection</h2>
            <p className="mt-2 text-xs leading-relaxed">
              SHARKVISION collects account registration credentials (full name, email address, phone number), institution affiliation, and examination response telemetry (question timing, answer choices, and option revision history) solely for generating educational performance analytics.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Student Data Isolation & Security</h2>
            <p className="mt-2 text-xs leading-relaxed">
              We employ strict PostgreSQL Row Level Security (RLS) policies. Student examination performance is accessible exclusively by the student, authorized verified guardians, and assigned classroom teachers. Unrelated teachers, students, and third parties are mathematically blocked from accessing records.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Parental Transparency</h2>
            <p className="mt-2 text-xs leading-relaxed">
              Parents can only access records of children explicitly linked and verified through institutional administrative approval.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Retention and Contact</h2>
            <p className="mt-2 text-xs leading-relaxed">
              Platform activity is retained securely for the duration of the student&apos;s active enrollment. For inquiries regarding data protection, contact <span className="font-mono text-slate-800">privacy@sharkvision.in</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
