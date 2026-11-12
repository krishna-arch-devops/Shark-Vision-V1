import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { db } from "@/lib/db";
import { revisionPlans, revisionTasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { StudentRevisionTaskBoard } from "@/components/intelligence/student-revision-task-board";

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

export default async function StudentRevisionPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const activePlans = await db
    .select()
    .from(revisionPlans)
    .where(eq(revisionPlans.studentId, profile.id))
    .orderBy(desc(revisionPlans.createdAt));

  const tasks = await db
    .select()
    .from(revisionTasks)
    .where(eq(revisionTasks.studentId, profile.id))
    .orderBy(desc(revisionTasks.createdAt));

  const activePlan = activePlans[0] || null;

  const formattedPlan = activePlan
    ? {
        id: activePlan.id,
        title: activePlan.title,
        description: activePlan.description || "",
        tasks: tasks.map((t) => ({
          id: t.id,
          taskType: t.taskType as any,
          priority: t.priority as any,
          status: t.status as any,
          title: t.title,
          description: t.description,
          topic: t.topic || undefined,
          estimatedMinutes: t.estimatedMinutes,
          completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
        })),
      }
    : null;

  return (
    <DashboardLayout profile={profile} navItems={studentNavItems} roleTitle="Student Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Targeted Remediation & Revision
          </h1>
          <p className="text-xs text-slate-500">
            Actionable daily tasks synthesized automatically from exam time traps, weak topics, and second-guessed answers.
          </p>
        </div>

        {activePlan ? (
          <StudentRevisionTaskBoard plan={activePlan} tasks={tasks} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No active revision agenda found. Complete an examination to synthesize personalized remediation tasks.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
