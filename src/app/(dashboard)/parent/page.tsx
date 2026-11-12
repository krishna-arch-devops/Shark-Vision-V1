import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { UserCheck, BookOpen, Clock, Award } from "lucide-react";
import { db } from "@/lib/db";
import { parentStudentLinks, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const parentNavItems: NavItem[] = [
  { label: "Overview", href: "/parent", iconName: "LayoutDashboard" },
  { label: "Children", href: "/parent/children", iconName: "Users" },
  { label: "Performance", href: "/parent/performance", iconName: "BarChart3" },
  { label: "Progress Reports", href: "/parent/progress", iconName: "TrendingUp" },
  { label: "Feedback", href: "/parent/feedback", iconName: "HelpCircle" },
  { label: "Profile", href: "/parent/profile", iconName: "User" },
];

export default async function ParentDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "PARENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const linkedChildren = await db
    .select({
      studentId: profiles.id,
      studentName: profiles.fullName,
      studentEmail: profiles.email,
    })
    .from(parentStudentLinks)
    .innerJoin(profiles, eq(parentStudentLinks.studentId, profiles.id))
    .where(
      and(
        eq(parentStudentLinks.parentId, profile.id),
        eq(parentStudentLinks.isVerified, true)
      )
    );

  return (
    <DashboardLayout profile={profile} navItems={parentNavItems} roleTitle="Parent Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Parent Progress Portal
          </h1>
          <p className="text-xs text-slate-500">
            Non-judgmental, explainable summaries of your student's test preparation and study habits.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Linked Students"
            value={linkedChildren.length}
            subtitle="Verified student accounts"
            icon={UserCheck}
            color="success"
          />
          <MetricCard
            label="Active Target"
            value="JEE Main"
            subtitle="National entrance exam"
            icon={Award}
            color="teal"
          />
          <MetricCard
            label="Study Cadence"
            value="Consistent"
            subtitle="Positive dwell distribution"
            icon={Clock}
            color="warning"
          />
          <MetricCard
            label="Remediation"
            value="Active"
            subtitle="Targeted revision tasks"
            icon={BookOpen}
            color="default"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Your Enrolled Students</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {linkedChildren.length > 0 ? (
              linkedChildren.map((c) => (
                <div key={c.studentId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.studentName}</p>
                    <p className="text-xs text-slate-500">{c.studentEmail}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Linked & Verified
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-slate-500">
                No verified students linked to this account yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
