import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const parentNavItems: NavItem[] = [
  { label: "Overview", href: "/parent", iconName: "LayoutDashboard" },
  { label: "My Children", href: "/parent/children", iconName: "Users" },
  { label: "Performance", href: "/parent/performance", iconName: "BarChart3" },
  { label: "Progress", href: "/parent/progress", iconName: "TrendingUp" },
  { label: "Teacher Feedback", href: "/parent/feedback", iconName: "HelpCircle" },
  { label: "Profile", href: "/parent/profile", iconName: "User" },
];

export default async function ParentProgressPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "PARENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardLayout profile={profile} navItems={parentNavItems} roleTitle="Parent Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Longitudinal Progress Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Inspect your student's multi-week trends, accuracy trajectories, and dwell endurance.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Progress Trajectory</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Aggregated across all completed examination attempts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Awaiting test submissions"
              description="Progress charts and cadence analysis will populate as your student completes mock assessments."
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
