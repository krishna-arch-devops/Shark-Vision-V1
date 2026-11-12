import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  HelpCircle,
  FilePlus,
  FileSpreadsheet,
  BarChart3,
  BookOpenCheck,
  Calendar,
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
    .select("batch_id, batches(*)")
    .eq("teacher_id", profile.id);

  const activeBatchCount = batches?.length || 0;

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {profile.full_name}
          </h1>
          <p className="text-xs text-slate-500">
            Classroom management, student performance insights, and batch examination tracking.
          </p>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Assigned Batches</span>
              <Users2 className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {activeBatchCount}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Assigned Students</span>
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              0
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Upcoming Tests</span>
              <Calendar className="h-4 w-4 text-violet-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              0
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Attention Needed</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              0
            </div>
          </Card>
        </div>

        {/* Real Content Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Active Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Batches</CardTitle>
              <CardDescription>Batches you are authorized to instruct and monitor</CardDescription>
            </CardHeader>
            <CardContent>
              {batches && batches.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {batches.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">Batch {item.batch_id}</span>
                        <p className="text-slate-400 text-[11px]">Active Academic Session</p>
                      </div>
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

          {/* Recent Test Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Examination Results</CardTitle>
              <CardDescription>Submissions and evaluation status from your students</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FileSpreadsheet className="h-6 w-6 text-slate-400" />}
                title="No Test Results Submitted Yet"
                description="Once assigned examinations are concluded, detailed student analytics and answer change telemetry will appear here."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
