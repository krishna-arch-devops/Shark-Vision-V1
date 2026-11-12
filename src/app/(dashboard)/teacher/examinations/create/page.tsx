import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { ExamBuilderForm } from "@/components/exam/exam-builder-form";
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

export default async function TeacherExamCreatePage() {
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
    .select("batch_id, batches!inner(id, name, target_exam)")
    .eq("teacher_id", profile.id);

  const formattedBatches = batches?.map((b: any) => ({
    id: b.batches.id,
    name: b.batches.name,
    target_exam: b.batches.target_exam,
  })) || [];

  // Query questions available
  const { data: questions } = await supabase
    .from("questions")
    .select("id, topic, difficulty, question_text, default_marks")
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Examination
          </h1>
          <p className="text-xs text-slate-500">
            Configure test blueprints, select question sets, and assign to target batches.
          </p>
        </div>

        <ExamBuilderForm
          batches={formattedBatches}
          availableQuestions={questions || []}
        />
      </div>
    </DashboardLayout>
  );
}
