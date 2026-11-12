import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { QuestionAuthoringForm } from "@/components/exam/question-authoring-form";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const teacherNavItems: NavItem[] = [
  { label: "Overview", href: "/teacher", iconName: "LayoutDashboard" },
  { label: "Batches", href: "/teacher/batches", iconName: "Users" },
  { label: "Question Bank", href: "/teacher/questions", iconName: "FileQuestion" },
  { label: "Examinations", href: "/teacher/examinations", iconName: "FileSpreadsheet" },
  { label: "Assignments", href: "/teacher/assignments", iconName: "BookmarkCheck" },
  { label: "Cohort Analytics", href: "/teacher/analytics", iconName: "BarChart3" },
  { label: "Students", href: "/teacher/students", iconName: "User" },
];

export default async function CreateQuestionPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const subjectsList = await db.select({ id: subjects.id, name: subjects.name, code: subjects.code }).from(subjects);

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/questions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Question Bank
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create New Question
            </h1>
            <p className="text-xs text-slate-500">
              Draft MCQs with 4 options, difficulty metrics, solutions, and target benchmark times.
            </p>
          </div>
        </div>

        <QuestionAuthoringForm subjects={subjectsList} />
      </div>
    </DashboardLayout>
  );
}
