import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { questions, subjects, questionBenchmarks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, BookOpen, Clock, ShieldCheck } from "lucide-react";
import { EditQuestionModal } from "@/components/exam/edit-question-modal";

const adminNavItems: NavItem[] = [
  { label: "Overview", href: "/admin", iconName: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", iconName: "Users" },
  { label: "Institutions", href: "/admin/institutions", iconName: "Building2" },
  { label: "Teachers", href: "/admin/teachers", iconName: "Users" },
  { label: "Students", href: "/admin/students", iconName: "User" },
  { label: "Parents", href: "/admin/parents", iconName: "Users" },
  { label: "Question Bank", href: "/admin/question-bank", iconName: "FileQuestion" },
  { label: "Examinations", href: "/admin/examinations", iconName: "FileSpreadsheet" },
  { label: "Subscriptions", href: "/admin/subscriptions", iconName: "CreditCard" },
  { label: "Analytics", href: "/admin/analytics", iconName: "BarChart3" },
  { label: "Audit Logs", href: "/admin/audit-logs", iconName: "BookmarkCheck" },
  { label: "Settings", href: "/admin/settings", iconName: "Settings" },
];

export default async function AdminQuestionBankPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // Fetch all questions across the platform
  const questionsList = await db
    .select({
      id: questions.id,
      topic: questions.topic,
      difficulty: questions.difficulty,
      questionText: questions.questionText,
      defaultMarks: questions.defaultMarks,
      defaultNegativeMarks: questions.defaultNegativeMarks,
      category: questions.category,
      subjectId: questions.subjectId,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      explanation: questions.explanation,
      imageUrl: questions.imageUrl,
      benchmarkSeconds: questionBenchmarks.expectedTimeSeconds,
    })
    .from(questions)
    .leftJoin(questionBenchmarks, eq(questions.id, questionBenchmarks.questionId))
    .orderBy(desc(questions.createdAt))
    .limit(100);

  const subjectsList = await db
    .select({ id: subjects.id, name: subjects.name, code: subjects.code })
    .from(subjects);

  return (
    <DashboardLayout profile={profile} navItems={adminNavItems} roleTitle="Super Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                National Question Repository
              </h1>
              <span className="flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                <ShieldCheck className="h-3 w-3" /> Full Edit Rights
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Curate, edit, and audit questions across JEE Main, JEE Advanced, NEET, and Executive Demo.
            </p>
          </div>

          <Link
            href="/teacher/questions/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Question
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="divide-y divide-slate-100">
            {questionsList.length > 0 ? (
              questionsList.map((q) => (
                <div key={q.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        {q.category}
                      </span>
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {q.topic}
                      </span>
                      <span
                        className={`rounded-sm px-2 py-0.5 font-medium ${
                          q.difficulty === "EASY"
                            ? "bg-green-50 text-green-700"
                            : q.difficulty === "HARD"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" /> {q.benchmarkSeconds || 60}s benchmark
                      </span>
                      <span className="text-slate-400">
                        (+{q.defaultMarks} / -{q.defaultNegativeMarks})
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                      {q.questionText}
                    </p>

                    <div className="text-[11px] text-slate-400">
                      Correct Key: <strong className="text-slate-700 font-mono">Option {q.correctAnswer}</strong>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <EditQuestionModal
                      question={{
                        id: q.id,
                        category: q.category,
                        subjectId: q.subjectId,
                        topic: q.topic,
                        difficulty: q.difficulty,
                        questionText: q.questionText,
                        imageUrl: q.imageUrl,
                        options: (q.options as Array<{ id: string; text: string }>) || [],
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        defaultMarks: Number(q.defaultMarks),
                        defaultNegativeMarks: Number(q.defaultNegativeMarks),
                        benchmarkSeconds: q.benchmarkSeconds || 60,
                      }}
                      subjects={subjectsList}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No questions in repository"
                description="Click 'Add Question' above to draft questions into the bank."
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
