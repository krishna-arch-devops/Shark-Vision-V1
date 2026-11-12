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
  FileSpreadsheet,
  Zap,
  BarChart3,
  Clock,
  Shuffle,
  TrendingUp,
  BookmarkCheck,
  User,
  ArrowRight,
  Play,
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

export default async function StudentExaminationsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const supabase = await createClient();

  // Fetch examinations assigned to batches where student is enrolled
  const { data: assignments } = await supabase
    .from("examination_assignments")
    .select(`
      examination_id,
      examinations!inner(
        id,
        title,
        description,
        category,
        duration_minutes,
        total_marks,
        start_window,
        end_window,
        is_published
      ),
      batches!inner(
        name,
        batch_students!inner(student_id)
      )
    `)
    .eq("batches.batch_students.student_id", profile.id)
    .eq("examinations.is_published", true);

  const assignedExams = assignments?.map((a: any) => a.examinations) || [];

  return (
    <DashboardLayout profile={profile} navItems={studentNavItems} roleTitle="Student Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Examinations</h1>
          <p className="text-xs text-slate-500">
            Active and scheduled JEE / NEET tests assigned to your batches.
          </p>
        </div>

        {assignedExams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedExams.map((exam: any) => (
              <Card key={exam.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default">{exam.category}</Badge>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {exam.duration_minutes} Mins
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {exam.description || "Comprehensive examination testing conceptual clarity."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Marks: {exam.total_marks}
                  </span>
                  <Link href={`/student/examinations/${exam.id}/take`}>
                    <Button size="sm">
                      <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                      Take Test
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Assessments</CardTitle>
              <CardDescription>Target examinations assigned by your institution teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FileSpreadsheet className="h-6 w-6 text-slate-400" />}
                title="No Tests Available Right Now"
                description="Your institution instructors have not deployed active assessments to your batch yet. Check back soon."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
