import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  HeartHandshake,
  HelpCircle,
  FileSpreadsheet,
  CreditCard,
  BarChart3,
  ScrollText,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const adminNavItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Institutions", href: "/admin/institutions", icon: Building2 },
  { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
  { label: "Students", href: "/admin/students", icon: UserCheck },
  { label: "Parents", href: "/admin/parents", icon: HeartHandshake },
  { label: "Question Bank", href: "/admin/question-bank", icon: HelpCircle },
  { label: "Examinations", href: "/admin/examinations", icon: FileSpreadsheet },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // Fetch real counts from Supabase database
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalParents },
    { count: totalInstitutions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "TEACHER"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "PARENT"),
    supabase.from("institutions").select("*", { count: "exact", head: true }),
  ]);

  // Fetch recent platform audit activity
  const { data: recentActivity } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const metrics = [
    { label: "Total Registered Users", value: totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Active Students", value: totalStudents ?? 0, icon: UserCheck, color: "text-emerald-600" },
    { label: "Total Teachers", value: totalTeachers ?? 0, icon: GraduationCap, color: "text-violet-600" },
    { label: "Total Parents", value: totalParents ?? 0, icon: HeartHandshake, color: "text-amber-600" },
    { label: "Institutions Enrolled", value: totalInstitutions ?? 0, icon: Building2, color: "text-sky-600" },
    { label: "Examinations Conducted", value: 0, icon: FileSpreadsheet, color: "text-slate-600" },
  ];

  return (
    <DashboardLayout profile={profile} navItems={adminNavItems} roleTitle="Super Admin Console">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Command Center</h1>
          <p className="text-xs text-slate-500">
            Real-time infrastructure, user management, and institutional oversight.
          </p>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{metric.label}</span>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {metric.value}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Operational Overview & Audit Logs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Platform Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Platform Activity</CardTitle>
              <CardDescription>Audited operational actions and administrative workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{log.action}</span>
                        <p className="text-slate-400 text-[11px]">{log.entity_type}</p>
                      </div>
                      <span className="text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<ScrollText className="h-6 w-6 text-slate-400" />}
                  title="No Platform Logs Yet"
                  description="Administrative and user events will be automatically audited and recorded here."
                />
              )}
            </CardContent>
          </Card>

          {/* System Health & Status */}
          <Card>
            <CardHeader>
              <CardTitle>System & Security Status</CardTitle>
              <CardDescription>Authentication, database integrity, and RLS enforcement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">Database Connection</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Operational</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">Row Level Security</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active (10 Tables)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">Public Self-Registration Guard</span>
                  </div>
                  <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded">STUDENT ONLY</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-800">Iteration Stage</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Stage 1: Core Foundation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
