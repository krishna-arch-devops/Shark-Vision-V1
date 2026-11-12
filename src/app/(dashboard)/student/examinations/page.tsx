import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { examinations, examinationAssignments, batchStudents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Clock, Award } from "lucide-react";

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

export default async function StudentExaminationsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const assignedExams = await db
    .select({
      id: examinations.id,
      title: examinations.title,
      description: examinations.description,
      category: examinations.category,
      durationMinutes: examinations.durationMinutes,
      totalMarks: examinations.totalMarks,
      startWindow: examinations.startWindow,
      endWindow: examinations.endWindow,
    })
    .from(examinations)
    .innerJoin(examinationAssignments, eq(examinations.id, examinationAssignments.examinationId))
    .innerJoin(batchStudents, eq(examinationAssignments.batchId, batchStudents.batchId))
    .where(eq(batchStudents.studentId, profile.id));

  return (
    <DashboardLayout profile={profile} navItems={studentNavItems} roleTitle="Student Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Available Examinations
          </h1>
          <p className="text-xs text-slate-500">
            Select an assessment to begin or resume your timed test.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {assignedExams.length > 0 ? (
            assignedExams.map((exam) => (
              <Card key={exam.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {exam.category}
                    </span>
                    <span>Window: {new Date(exam.endWindow).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {exam.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> {exam.totalMarks} Marks
                    </span>
                  </div>

                  <Link
                    href={`/student/examinations/${exam.id}/take`}
                    className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    Start Test
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="pt-6">
                <EmptyState
                  title="No examinations assigned"
                  description="When instructors publish tests for your cohort, they will appear here."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
