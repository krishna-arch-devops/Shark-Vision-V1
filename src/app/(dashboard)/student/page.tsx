import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Target, CheckCircle, Clock, Zap } from "lucide-react";

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
            Monitor your exam readiness, active testing metrics, and behavioral intelligence.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Active Target</CardTitle>
              <Target className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">JEE Advanced</div>
              <p className="text-[10px] text-slate-400 mt-1">Class 12 / Dropper Cohort</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Examinations Taken</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">0</div>
              <p className="text-[10px] text-slate-400 mt-1">Pending first mock exam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Active Test Dwell</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">0h 0m</div>
              <p className="text-[10px] text-slate-400 mt-1">Total active problem time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Readiness Score</CardTitle>
              <Zap className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">N/A</div>
              <p className="text-[10px] text-slate-400 mt-1">Requires 1 complete examination</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Assigned Examinations
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Scheduled tests assigned by your instructors and coaching batches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No active assessments"
                description="When your institution assigns an upcoming full-length mock or sectional test, it will appear here."
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Behavioral Trait Analytics
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Anti-guessing, answer change patterns, and speed-accuracy matrices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Telemetry waiting for data"
                description="Complete an assigned assessment to unlock dwell time breakdown and rush-trap diagnostics."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
