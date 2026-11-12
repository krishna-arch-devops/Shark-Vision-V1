import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { QuestionAuthoringForm } from "@/components/exam/question-authoring-form";
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  HelpCircle,
  FilePlus,
  FileSpreadsheet,
  BarChart3,
  BookOpenCheck,
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

export default async function TeacherQuestionsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: subjects } = await supabase.from("subjects").select("id, name, code");

  const fallbackSubjects = [
    { id: "11111111-1111-1111-1111-111111111111", name: "Physics", code: "PHY" },
    { id: "22222222-2222-2222-2222-222222222222", name: "Chemistry", code: "CHE" },
    { id: "33333333-3333-3333-3333-333333333333", name: "Mathematics", code: "MAT" },
    { id: "44444444-4444-4444-4444-444444444444", name: "Biology", code: "BIO" },
  ];

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Question Bank Manager
          </h1>
          <p className="text-xs text-slate-500">
            Author and publish JEE / NEET questions with difficulty tagging and options.
          </p>
        </div>

        <QuestionAuthoringForm subjects={subjects && subjects.length > 0 ? subjects : fallbackSubjects} />
      </div>
    </DashboardLayout>
  );
}
