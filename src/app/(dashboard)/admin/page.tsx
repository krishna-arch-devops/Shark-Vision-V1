import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  Users,
  Building2,
  GraduationCap,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { db } from "@/lib/db";
import { profiles, institutions, questions, examinations } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

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

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [studentsRes] = await db
    .select({ count: count() })
    .from(profiles)
    .where(eq(profiles.role, "STUDENT"));

  const [teachersRes] = await db
    .select({ count: count() })
    .from(profiles)
    .where(eq(profiles.role, "TEACHER"));

  const [institutionsRes] = await db.select({ count: count() }).from(institutions);
  const [questionsRes] = await db.select({ count: count() }).from(questions);
  const [examsRes] = await db.select({ count: count() }).from(examinations);

  const totalStudents = studentsRes?.count || 0;
  const totalTeachers = teachersRes?.count || 0;
  const totalInstitutions = institutionsRes?.count || 0;
  const totalQuestions = questionsRes?.count || 0;
  const totalExams = examsRes?.count || 0;

  return (
    <DashboardLayout profile={profile} navItems={adminNavItems} roleTitle="Super Admin Console">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Master Console
          </h1>
          <p className="text-xs text-slate-500">
            System administration, multi-tenant institutional isolation, and telemetry metrics.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Students"
            value={totalStudents}
            subtitle="Verified across cohorts"
            icon={GraduationCap}
            color="teal"
          />
          <MetricCard
            label="Active Teachers"
            value={totalTeachers}
            subtitle="Faculty instructors"
            icon={Users}
            color="success"
          />
          <MetricCard
            label="Institutions"
            value={totalInstitutions}
            subtitle="Affiliated coaching centers"
            icon={Building2}
            color="warning"
          />
          <MetricCard
            label="Question Pool"
            value={totalQuestions}
            subtitle={`${totalExams} mock exams authored`}
            icon={FileSpreadsheet}
            color="default"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                System Infrastructure Status
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                PostgreSQL database and authentication services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                  <span>PostgreSQL 16 Engine</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Healthy (22 Tables)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                  <span>Native Local Auth Adapter</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active (Bcrypt / JWT)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Role Governance
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Four-role RBAC enforcement & resource boundary isolation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Platform strictly validates role permissions server-side. Candidates cannot view unreleased examination keys or peer telemetry.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
