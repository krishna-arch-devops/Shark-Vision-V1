import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { examinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";

const teacherNavItems: NavItem[] = [
  { label: "Overview", href: "/teacher", iconName: "LayoutDashboard" },
  { label: "Batches", href: "/teacher/batches", iconName: "Users" },
  { label: "Question Bank", href: "/teacher/questions", iconName: "FileQuestion" },
  { label: "Examinations", href: "/teacher/examinations", iconName: "FileSpreadsheet" },
  { label: "Assignments", href: "/teacher/assignments", iconName: "BookmarkCheck" },
  { label: "Cohort Analytics", href: "/teacher/analytics", iconName: "BarChart3" },
  { label: "Students", href: "/teacher/students", iconName: "User" },
];

export default async function TeacherExaminationsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const examsList = await db
    .select()
    .from(examinations)
    .where(eq(examinations.createdBy, profile.id));

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Examination Management
            </h1>
            <p className="text-xs text-slate-500">
              Published assessments and batch assignments.
            </p>
          </div>

          <Link
            href="/teacher/examinations/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" /> Create Examination
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {examsList.length > 0 ? (
            examsList.map((exam) => (
              <div
                key={exam.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {exam.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    {exam.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{exam.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>
                <div className="pt-2 text-xs text-slate-500">
                  {exam.durationMinutes} minutes • {exam.totalMarks} Marks
                </div>
              </div>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="pt-6">
                <EmptyState
                  title="No examinations created yet"
                  description="Click 'Create Examination' to author a test and assign it to your student cohorts."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
