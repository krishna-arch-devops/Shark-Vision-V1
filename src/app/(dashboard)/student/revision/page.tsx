import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StudentRevisionTaskBoard } from "@/components/intelligence/student-revision-task-board";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Zap,
  BarChart3,
  Clock,
  Shuffle,
  TrendingUp,
  BookmarkCheck,
  User,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const studentNavItems: NavItem[] = [
  { label: "Overview", href: "/student", icon: LayoutDashboard },
  { label: "My Examinations", href: "/student/examinations", icon: FileSpreadsheet },
  { label: "Practice", href: "/student/practice", icon: Zap },
  { label: "Performance", href: "/student/performance", icon: BarChart3 },
  { label: "Time Intelligence", href: "/student/time-intelligence", icon: Clock },
  { label: "Answer Changes", href: "/student/answer-changes", icon: Shuffle },
  { label: "Progress", href: "/student/progress", icon: TrendingUp },
  { label: "Revision Plan", href: "/student/revision", icon: BookmarkCheck },
  { label: "Profile", href: "/student/profile", icon: User },
];

export default async function StudentRevisionPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/student");
  }

  const supabase = await createClient();

  // 1. Fetch active revision plan
  const { data: plan } = await supabase
    .from("revision_plans")
    .select("*")
    .eq("student_id", profile.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let tasks: any[] = [];
  if (plan) {
    const { data: taskRows } = await supabase
      .from("revision_tasks")
      .select("*")
      .eq("plan_id", plan.id)
      .order("created_at", { ascending: true });
    tasks = taskRows || [];
  }

  return (
    <DashboardLayout profile={profile} navItems={studentNavItems} roleTitle="Student Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Personalized Revision Planner
          </h1>
          <p className="text-xs text-slate-500">
            Evidence-based remedial action items derived from question dwell traps and concept gaps.
          </p>
        </div>

        {plan && tasks.length > 0 ? (
          <StudentRevisionTaskBoard plan={plan} tasks={tasks} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Revision Agenda</CardTitle>
              <CardDescription>
                Remediation plans generated automatically from completed mock examinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<BookmarkCheck className="h-6 w-6 text-slate-400" />}
                title="No Active Revision Plan"
                description="Complete and submit an examination to unlock tailored problem-set practice priorities and second-guessing reviews."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
