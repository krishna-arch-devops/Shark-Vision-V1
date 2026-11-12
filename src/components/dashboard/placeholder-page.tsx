import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface PlaceholderConfig {
  title: string;
  description: string;
  role: "SUPER_ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
  emptyTitle: string;
  emptyDescription: string;
}

const roleNavMap: Record<string, NavItem[]> = {
  STUDENT: [
    { label: "Overview", href: "/student", iconName: "LayoutDashboard" },
    { label: "My Examinations", href: "/student/examinations", iconName: "FileSpreadsheet" },
    { label: "Practice", href: "/student/practice", iconName: "Zap" },
    { label: "Performance", href: "/student/performance", iconName: "BarChart3" },
    { label: "Time Intelligence", href: "/student/time-intelligence", iconName: "Clock" },
    { label: "Answer Changes", href: "/student/answer-changes", iconName: "Shuffle" },
    { label: "Progress", href: "/student/progress", iconName: "TrendingUp" },
    { label: "Revision Plan", href: "/student/revision", iconName: "BookmarkCheck" },
    { label: "Profile", href: "/student/profile", iconName: "User" },
  ],
  TEACHER: [
    { label: "Overview", href: "/teacher", iconName: "LayoutDashboard" },
    { label: "Batches", href: "/teacher/batches", iconName: "Users" },
    { label: "Question Bank", href: "/teacher/questions", iconName: "FileQuestion" },
    { label: "Examinations", href: "/teacher/examinations", iconName: "FileSpreadsheet" },
    { label: "Assignments", href: "/teacher/assignments", iconName: "BookmarkCheck" },
    { label: "Cohort Analytics", href: "/teacher/analytics", iconName: "BarChart3" },
    { label: "Students", href: "/teacher/students", iconName: "User" },
  ],
  PARENT: [
    { label: "Overview", href: "/parent", iconName: "LayoutDashboard" },
    { label: "Children", href: "/parent/children", iconName: "Users" },
    { label: "Performance", href: "/parent/performance", iconName: "BarChart3" },
    { label: "Progress Reports", href: "/parent/progress", iconName: "TrendingUp" },
    { label: "Feedback", href: "/parent/feedback", iconName: "HelpCircle" },
    { label: "Profile", href: "/parent/profile", iconName: "User" },
  ],
  SUPER_ADMIN: [
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
  ],
};

export function createPlaceholderPage(config: PlaceholderConfig) {
  return async function PlaceholderPage() {
    const profile = await getCurrentProfile();

    if (!profile) {
      redirect("/login");
    }

    if (profile.role !== config.role && profile.role !== "SUPER_ADMIN") {
      redirect("/login");
    }

    const navItems = roleNavMap[config.role] || roleNavMap.STUDENT;

    return (
      <DashboardLayout
        profile={profile}
        navItems={navItems}
        roleTitle={`${config.role.replace("_", " ")} Portal`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{config.title}</h1>
              <p className="text-xs text-slate-500">{config.description}</p>
            </div>
            <Link
              href={navItems[0].href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Users className="h-6 w-6 text-slate-400" />}
                title={config.emptyTitle}
                description={config.emptyDescription}
              />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  };
}
