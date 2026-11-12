import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import {
  examinations,
  examinationAssignments,
  batchStudents,
  examinationAttempts,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Target, CheckCircle, Clock, Zap, ArrowRight, Play, Sparkles, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const studentNavItems: NavItem[] = [
  { label: "Overview", href: "/student", iconName: "LayoutDashboard" },
  { label: "My Examinations", href: "/student/examinations", iconName: "FileSpreadsheet" },
  { label: "Practice", href: "/student/practice", iconName: "Zap" },
  { label: "Performance", href: "/student/performance", iconName: "BarChart3" },
  { label: "Time Intelligence", href: "/student/time-intelligence", iconName: "Clock" },
  { label: "Answer Changes", href: "/student/answer-changes", iconName: "Shuffle" },
  { label: "Progress", href: "/student/progress", iconName: "TrendingUp" },
  { label: "Revision Plan", href: "/student/revision", iconName: "BookmarkCheck" },
  { label: "Profile", href: "/student/profile", iconName: "User" },
];

export default async function StudentDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // 1. Fetch assigned examinations for this student
  const assignedExams = await db
    .select({
      id: examinations.id,
      title: examinations.title,
      description: examinations.description,
      category: examinations.category,
      durationMinutes: examinations.durationMinutes,
      totalMarks: examinations.totalMarks,
      maxAttempts: examinations.maxAttempts,
      isPublished: examinations.isPublished,
    })
    .from(examinations)
    .innerJoin(examinationAssignments, eq(examinations.id, examinationAssignments.examinationId))
    .innerJoin(batchStudents, eq(examinationAssignments.batchId, batchStudents.batchId))
    .where(eq(batchStudents.studentId, profile.id))
    .orderBy(desc(examinations.createdAt));

  // 2. Fetch completed or in-progress attempts for this student
  const studentAttempts = await db
    .select()
    .from(examinationAttempts)
    .where(eq(examinationAttempts.studentId, profile.id))
    .orderBy(desc(examinationAttempts.startedAt));

  const completedAttempts = studentAttempts.filter((a) => a.status === "SUBMITTED");
  const totalDwellMs = studentAttempts.reduce((sum, a) => sum + Number(a.totalActiveTimeMs || 0), 0);
  const dwellMinutes = Math.round(totalDwellMs / 60000);
  const dwellHours = Math.floor(dwellMinutes / 60);
  const remainingMins = dwellMinutes % 60;

  // Check if executive demo test is available
  const demoExam = assignedExams.find((e) => e.category === "DEMO" || e.title.includes("EXECUTIVE DEMO"));

  return (
    <DashboardLayout profile={profile} navItems={studentNavItems} roleTitle="Student Portal">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome, {profile.full_name}
              </h1>
              {demoExam && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-amber-800 border border-amber-300">
                  DEMO ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Experience SharkVision testing engine, answer-tracking telemetry, and intelligent diagnostics.
            </p>
          </div>
        </div>

        {/* Executive Demo Featured Hero Banner */}
        {demoExam && (
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/60 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    <Sparkles className="h-3.5 w-3.5" /> Featured Executive Assessment
                  </span>
                  <span className="text-xs font-mono text-amber-800 bg-white/80 border border-amber-200 px-2 py-0.5 rounded">
                    15 Mins • 20 Questions
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {demoExam.title}
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {demoExam.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1 font-medium">
                  <span>✓ General Knowledge (8 Qs)</span>
                  <span>✓ Basic Science (4 Qs)</span>
                  <span>✓ Basic Math (4 Qs)</span>
                  <span>✓ Logical Reasoning (4 Qs)</span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                <Link
                  href={`/student/examinations/${demoExam.id}/take`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Start Assessment
                </Link>
                <div className="text-[11px] text-center text-slate-500">
                  Instant results + Replay + Marks Simulator
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Active Stream</CardTitle>
              <Target className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {demoExam ? "Executive Demo" : "JEE / NEET"}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">General Knowledge & Aptitude</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Examinations Taken</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{completedAttempts.length}</div>
              <p className="text-[10px] text-slate-400 mt-1">
                {completedAttempts.length > 0 ? "Analytics available" : "Pending assessment attempt"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Active Test Dwell</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {dwellHours}h {remainingMins}m
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Total active problem time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Readiness Score</CardTitle>
              <Zap className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {completedAttempts.length > 0 ? "Active" : "N/A"}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {completedAttempts.length > 0 ? "Telemetry computed" : "Requires 1 complete examination"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Examinations List */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Assigned Examinations
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Scheduled assessments assigned to your cohort.
                  </CardDescription>
                </div>
                <Link
                  href="/student/examinations"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignedExams.length > 0 ? (
                assignedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{exam.title}</span>
                        {exam.category === "DEMO" && (
                          <span className="rounded bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {exam.durationMinutes} mins • {exam.totalMarks} Marks
                      </div>
                    </div>

                    <Link
                      href={`/student/examinations/${exam.id}/take`}
                      className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      Start
                    </Link>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No active assessments"
                  description="When your institution assigns an upcoming test, it will appear here."
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Attempts & Scorecards */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent Attempts & Analytics
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Scorecards, behavioral replay, and Marks Simulator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedAttempts.length > 0 ? (
                completedAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">Attempt #{att.attemptNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        Submitted {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/exams/${att.id}/results`}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Analytics
                      </Link>
                      <Link
                        href={`/student/exams/${att.id}/replay`}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Replay
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No completed assessments"
                  description="Complete an assessment above to review your detailed performance diagnostics and replay timeline."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
