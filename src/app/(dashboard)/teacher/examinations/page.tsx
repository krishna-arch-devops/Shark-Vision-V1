import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  HelpCircle,
  FilePlus,
  FileSpreadsheet,
  BarChart3,
  BookOpenCheck,
  Plus,
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

export default async function TeacherExaminationsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "TEACHER" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("examinations")
    .select("*, examination_attempts(count)")
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Examinations Manager
            </h1>
            <p className="text-xs text-slate-500">
              Active, scheduled, and past batch assessments.
            </p>
          </div>
          <Link href="/teacher/examinations/create">
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Examination
            </Button>
          </Link>
        </div>

        {exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={exam.is_published ? "success" : "outline"}>
                      {exam.is_published ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {exam.duration_minutes} Mins
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    Category: {exam.category} • Total Marks: {exam.total_marks}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Policy: {exam.result_release_policy}</span>
                  <span className="font-semibold text-slate-700">
                    Attempts: {exam.examination_attempts?.[0]?.count || 0}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Batch Examinations</CardTitle>
              <CardDescription>Created tests deployed to student batches</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FileSpreadsheet className="h-6 w-6 text-slate-400" />}
                title="No Examinations Created Yet"
                description="Use the examination builder to configure test blueprints and select questions from the question bank."
                action={
                  <Link href="/teacher/examinations/create">
                    <Button size="sm">Create First Examination</Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
