import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  Target,
  CheckCircle,
} from "lucide-react";

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

export default async function StudentDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "STUDENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardLayout profile={profile} navItems={studentNavItems} roleTitle="Student Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {profile.full_name}
          </h1>
          <p className="text-xs text-slate-500">
            Targeting excellence in JEE / NEET examinations. Measure every second.
          </p>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Upcoming Tests</span>
              <FileSpreadsheet className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              0
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tests Completed</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              0
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Average Accuracy</span>
              <Target className="h-4 w-4 text-violet-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              --
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Time / Question</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              --
            </div>
          </Card>
        </div>

        {/* Real Dynamic Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Active Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Examinations</CardTitle>
              <CardDescription>Scheduled JEE & NEET mock tests and chapter assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FileSpreadsheet className="h-6 w-6 text-slate-400" />}
                title="No Examinations Assigned Yet"
                description="Your institution or teacher has not assigned tests to your batch yet. Check back soon."
              />
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Accuracy trends, time per difficulty level, and answer changes</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<BarChart3 className="h-6 w-6 text-slate-400" />}
                title="No Performance Data Yet"
                description="Your performance insights, time intelligence graphs, and revision recommendations will appear after your first examination."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
