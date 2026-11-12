import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { examinations, examinationAttempts, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Settings, Users, BookOpen, Clock, Calendar } from "lucide-react";
import { ExamSettingsModal } from "@/components/admin/exam-settings-modal";
import { AttemptManagerModal } from "@/components/admin/attempt-manager-modal";

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

  // Fetch all exams authored by teacher (or all exams if Super Admin)
  const examsList = profile.role === "SUPER_ADMIN"
    ? await db.select().from(examinations).orderBy(desc(examinations.createdAt))
    : await db.select().from(examinations).where(eq(examinations.createdBy, profile.id)).orderBy(desc(examinations.createdAt));

  // Fetch all student attempts for each exam
  const allAttempts = await db
    .select({
      id: examinationAttempts.id,
      examinationId: examinationAttempts.examinationId,
      status: examinationAttempts.status,
      startedAt: examinationAttempts.startedAt,
      submittedAt: examinationAttempts.submittedAt,
      score: examinationAttempts.totalActiveTimeMs,
      studentName: profiles.fullName,
      studentEmail: profiles.email,
    })
    .from(examinationAttempts)
    .innerJoin(profiles, eq(examinationAttempts.studentId, profiles.id));

  return (
    <DashboardLayout profile={profile} navItems={teacherNavItems} roleTitle="Teacher Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Examination Management & Control
            </h1>
            <p className="text-xs text-slate-500">
              Configure parameters, attempt limits, result release policies, and manage student retakes.
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
            examsList.map((exam) => {
              const examAttempts = allAttempts
                .filter((att) => att.examinationId === exam.id)
                .map((att) => ({
                  id: att.id,
                  studentName: att.studentName,
                  studentEmail: att.studentEmail,
                  status: att.status,
                  startedAt: att.startedAt ? att.startedAt.toISOString() : "",
                  submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
                  score: null,
                }));

              return (
                <div
                  key={exam.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {exam.category}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          exam.isPublished
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {exam.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {exam.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{exam.durationMinutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        <span>{exam.totalMarks} Marks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Max Attempts: <strong className="text-slate-900">{exam.maxAttempts}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Policy: <strong className="text-slate-900">{exam.resultReleasePolicy}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <AttemptManagerModal
                      examId={exam.id}
                      examTitle={exam.title}
                      attempts={examAttempts}
                    />

                    <ExamSettingsModal
                      exam={{
                        id: exam.id,
                        title: exam.title,
                        maxAttempts: exam.maxAttempts,
                        durationMinutes: exam.durationMinutes,
                        isPublished: exam.isPublished,
                        resultReleasePolicy: exam.resultReleasePolicy,
                      }}
                    />
                  </div>
                </div>
              );
            })
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
