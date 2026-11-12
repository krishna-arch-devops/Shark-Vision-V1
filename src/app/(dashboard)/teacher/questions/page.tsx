import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
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

export default async function TeacherQuestionsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const questionsList = await db
    .select({
      id: questions.id,
      topic: questions.topic,
      difficulty: questions.difficulty,
      questionText: questions.questionText,
      defaultMarks: questions.defaultMarks,
      category: questions.category,
    })
    .from(questions)
    .where(eq(questions.createdBy, profile.id))
    .limit(50);

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Question Bank
            </h1>
            <p className="text-xs text-slate-500">
              Authored questions with full difficulty tagging and negative marking configuration.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="divide-y divide-slate-100">
            {questionsList.length > 0 ? (
              questionsList.map((q) => (
                <div key={q.id} className="py-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-800">{q.category} • {q.topic}</span>
                    <span className="rounded-sm bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{q.questionText}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No questions authored yet"
                description="Questions you create for your batch assignments will be listed here."
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
