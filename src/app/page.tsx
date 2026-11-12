import Link from "next/link";
import {
  Clock,
  Shuffle,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-base shadow-sm">
              SV
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SHARKVISION
              </span>
              <span className="hidden sm:inline-block ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                JEE / NEET
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Student Registration
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-700 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Commercial SaaS for JEE & NEET Preparation</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl max-w-4xl mx-auto">
            Know Where Every Second Goes.
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            An intelligent JEE & NEET examination and performance analytics platform engineered to measure solving time, answer revisions, question difficulty traps, and strategic accuracy.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Begin Student Practice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Access Institution Portal
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Multi-Tenant Institution Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Row-Level Security Isolation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Dedicated Portals for 4 User Roles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600">Core Capabilities</h2>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              Engineered for Competitive Indian Examinations
            </h3>
            <p className="mt-3 text-sm text-slate-500">
              High-stakes examinations like JEE Main, JEE Advanced, and NEET require strategic time discipline alongside subject mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700 mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Track Question Solving Time</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log exact dwell times per problem. Pinpoint questions where candidates spend excessive seconds without scoring marks.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-4">
                <Shuffle className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Understand Answer Changes</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Analyze option switching behavior. Determine whether second-guessing helps or harms final score in high-pressure tests.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Identify Topic Weaknesses</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Granular chapter and sub-topic breakdown across Physics, Chemistry, Mathematics, and Biology without guessing.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Improve Examination Strategy</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Help aspirants build round-by-round question selection disciplines, eliminating negative marking from unforced errors.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Help Parents Understand Progress</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear, jargon-free dashboards giving parents verified updates on effort, growth, and teacher feedback.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Enterprise Security & Isolation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict PostgreSQL Row Level Security (RLS) ensuring batches, schools, and children data are strictly isolated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Four Distinct Roles Overview */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dedicated Experiences for Every Stakeholder
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Each user profile features an isolated, server-authorized workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <span className="text-xs font-bold text-sky-700">SUPER ADMIN</span>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">Platform Control</h4>
              <p className="text-xs text-slate-500 mt-2">
                Manage institutions, batches, subjects, question banks, subscriptions, and audit logs.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <span className="text-xs font-bold text-violet-700">TEACHER</span>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">Classroom Mentorship</h4>
              <p className="text-xs text-slate-500 mt-2">
                View assigned batches, author tests, inspect submissions, and recommend targeted revision.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <span className="text-xs font-bold text-rose-700">PARENT</span>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">Honest Transparency</h4>
              <p className="text-xs text-slate-500 mt-2">
                Plain-English reports on child consistency, time management health, and teacher notes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <span className="text-xs font-bold text-emerald-700">STUDENT</span>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">Exam Precision</h4>
              <p className="text-xs text-slate-500 mt-2">
                Clean test interface, accuracy metrics, time allocation telemetry, and personalized review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">SHARKVISION</span>
            <span>— Commercial JEE/NEET Performance SaaS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
