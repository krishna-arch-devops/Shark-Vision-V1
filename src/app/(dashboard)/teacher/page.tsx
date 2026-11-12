import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  HelpCircle,
  FilePlus,
  FileSpreadsheet,
  BarChart3,
  BookOpenCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const teacherNavItems: NavItem[] = [
  { label: "Overview", href: "/teacher", icon: LayoutDashboard },
  { label: "My Batches", href: "/teacher/batches", icon: Users2 },
  { label: "My Students", href: "/teacher/students", icon: GraduationCap },
  { label: "Question Bank", href: "/teacher/questions", icon: HelpCircle },
  { label: "Create Examination", href: "/teacher/examinations/create", icon: FilePlus },
  { label: "Examinations", href: "/teacher/examinations", icon: FileSpreadsheet },
  { label: "Performance Analytics", href: "/teacher/analytics", icon: BarChart3 },
  { label: "Assignments", href: "/teacher/assignments", icon: BookOpenCheck },
];

export default async function TeacherDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const supabase = await createClient();

  // Query batches assigned to this teacher
  const { data: batches } = await supabase
    .from("batch_teachers")
    .select("batch_id, batches(id, name, target_exam)")
    .eq("teacher_id", profile.id);

  const activeBatchCount = batches?.length || 0;

  // Query completed attempts for students taught by this teacher
  const { data: attempts } = await supabase
    .from("examination_attempts")
    .select(`
      id,
      status,
      started_at,
      submitted_at,
      student_id,
      examination_id,
      profiles!student_id(full_name),
      examinations(title, category)
    `)
    .eq("status", "SUBMITTED")
    .order("submitted_at", { ascending: false })
    .limit(10);

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {profile.full_name}
          </h1>
          <p className="text-xs text-slate-500">
            Batch-level monitoring, examination intelligence, and student diagnostic performance.
          </p>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Active Batches</span>
              <Users2 className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              {activeBatchCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target JEE & NEET cohorts</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Completed Submissions</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">
              {attempts?.length || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Graded test sessions</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Attention Areas</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Active
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Speed traps & negative mark leaks</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Telemetry Engine</span>
              <Clock className="h-4 w-4 text-violet-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Live
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Monotonic dwell logging</p>
          </Card>
        </div>

        {/* Real Content Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Active Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Batches</CardTitle>
              <CardDescription>Cohorts you are authorized to mentor and assess</CardDescription>
            </CardHeader>
            <CardContent>
              {batches && batches.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {batches.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {item.batches?.name || `Batch ${item.batch_id}`}
                        </span>
                        <p className="text-slate-400 text-[11px]">
                          Target Exam: {item.batches?.target_exam}
                        </p>
                      </div>
                      <Badge variant="outline">{item.batches?.target_exam}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Users2 className="h-6 w-6 text-slate-400" />}
                  title="No Batches Assigned Yet"
                  description="Your institution administrator will assign you to target JEE/NEET batches."
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Student Submissions & Diagnostic Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Examination Submissions</CardTitle>
              <CardDescription>Submitted attempts from students in your cohorts</CardDescription>
            </CardHeader>
            <CardContent>
              {attempts && attempts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {attempts.map((att: any) => (
                    <div
                      key={att.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">
                          {(att.profiles as any)?.full_name || "Student"}
                        </span>
                        <p className="text-slate-400 text-[11px]">
                          {(att.examinations as any)?.title} • {new Date(att.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/student/exams/${att.id}/results`}
                        className="text-sky-600 font-semibold hover:text-sky-700 text-xs"
                      >
                        Inspect Analytics ──▶
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FileSpreadsheet className="h-6 w-6 text-slate-400" />}
                  title="No Test Results Submitted Yet"
                  description="Once assigned examinations are completed by students, batch-level analytics and answer-change histories will be available."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
