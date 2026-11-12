import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Users, FileSpreadsheet, CheckCircle2, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { questions, examinations, examinationResults } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

const teacherNavItems: NavItem[] = [
  { label: "Overview", href: "/teacher", iconName: "LayoutDashboard" },
  { label: "Batches", href: "/teacher/batches", iconName: "Users" },
  { label: "Question Bank", href: "/teacher/questions", iconName: "FileQuestion" },
  { label: "Examinations", href: "/teacher/examinations", iconName: "FileSpreadsheet" },
  { label: "Assignments", href: "/teacher/assignments", iconName: "BookmarkCheck" },
  { label: "Cohort Analytics", href: "/teacher/analytics", iconName: "BarChart3" },
  { label: "Students", href: "/teacher/students", iconName: "User" },
];

export default async function TeacherDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [questionsRes] = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.createdBy, profile.id));

  const [examsRes] = await db
    .select({ count: count() })
    .from(examinations)
    .where(eq(examinations.createdBy, profile.id));

  const [resultsRes] = await db.select({ count: count() }).from(examinationResults);

  const totalQuestions = questionsRes?.count || 0;
  const totalExams = examsRes?.count || 0;
  const gradedSubmissions = resultsRes?.count || 0;

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Instructor Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Author questions, assemble examinations, and monitor cohort test performances.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Questions Authored"
            value={totalQuestions}
            subtitle="Verified in question bank"
            icon={FileSpreadsheet}
            color="teal"
          />
          <MetricCard
            label="Examinations Published"
            value={totalExams}
            subtitle="Active test assignments"
            icon={CheckCircle2}
            color="success"
          />
          <MetricCard
            label="Submissions Graded"
            value={gradedSubmissions}
            subtitle="Automated server scoring"
            icon={TrendingUp}
            color="warning"
          />
          <MetricCard
            label="Active Cohort"
            value="JEE Adv-30"
            subtitle="Kota Center Batch A"
            icon={Users}
            color="default"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
