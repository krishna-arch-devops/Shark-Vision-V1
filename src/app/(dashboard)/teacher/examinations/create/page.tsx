import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { ExamBuilderForm } from "@/components/exam/exam-builder-form";
import { db } from "@/lib/db";
import { questions, batches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const teacherNavItems: NavItem[] = [
  { label: "Overview", href: "/teacher", iconName: "LayoutDashboard" },
  { label: "Batches", href: "/teacher/batches", iconName: "Users" },
  { label: "Question Bank", href: "/teacher/questions", iconName: "FileQuestion" },
  { label: "Examinations", href: "/teacher/examinations", iconName: "FileSpreadsheet" },
  { label: "Assignments", href: "/teacher/assignments", iconName: "BookmarkCheck" },
  { label: "Cohort Analytics", href: "/teacher/analytics", iconName: "BarChart3" },
  { label: "Students", href: "/teacher/students", iconName: "User" },
];

export default async function CreateExaminationPage() {
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
      question_text: questions.questionText,
      default_marks: questions.defaultMarks,
    })
    .from(questions)
    .where(eq(questions.createdBy, profile.id));

  const batchesList = await db
    .select({
      id: batches.id,
      name: batches.name,
      academic_year: batches.academicYear,
    })
    .from(batches);

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Examination
          </h1>
          <p className="text-xs text-slate-500">
            Configure examination parameters, select questions from the bank, and assign to cohorts.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <ExamBuilderForm
            availableQuestions={questionsList as any}
            batches={batchesList as any}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
