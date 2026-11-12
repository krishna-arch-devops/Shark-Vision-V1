import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Server, Database, KeyRound, BellRing, Gauge } from "lucide-react";

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

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardLayout profile={profile} navItems={adminNavItems} roleTitle="Super Admin Portal">
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System & Enterprise Platform Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure platform security parameters, database connections, default test policies, and global thresholds.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Security & Auth */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Authentication & Sessions</CardTitle>
                  <CardDescription className="text-xs">Session timeouts and hashing policies</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Auth Adapter</label>
                <div className="font-mono bg-slate-50 p-2 rounded-md border border-slate-200 text-slate-800">
                  AUTH_PROVIDER=local (Bcrypt 10 Salt Rounds)
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Session Cookie Lifetime</label>
                <Input defaultValue="7 Days (604,800s)" readOnly className="bg-slate-50 text-xs" />
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Protected by strict HTTP-Only, SameSite=Lax flags.
              </div>
            </CardContent>
          </Card>

          {/* Database & Persistence */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Database Engine</CardTitle>
                  <CardDescription className="text-xs">PostgreSQL 16 connection state</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Database Cluster</label>
                <div className="font-mono bg-slate-50 p-2 rounded-md border border-slate-200 text-slate-800">
                  PostgreSQL 16.0 (Drizzle ORM Connection Pool)
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span>Database Status:</span>
                <span className="font-semibold text-emerald-600">CONNECTED & SYNCED</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Connection Pool:</span>
                <span className="font-mono">10 Conns Max</span>
              </div>
            </CardContent>
          </Card>

          {/* Exam Runtime Defaults */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Default Examination Parameters</CardTitle>
                  <CardDescription className="text-xs">Global baseline for newly authored tests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Default Max Attempts</label>
                <Input defaultValue="2" type="number" readOnly className="bg-slate-50 text-xs" />
                <p className="mt-1 text-[11px] text-slate-400">
                  Admins and teachers can override this per individual test in the Examinations tab.
                </p>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Default Release Policy</label>
                <Input defaultValue="IMMEDIATE" readOnly className="bg-slate-50 text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Telemetry Engine */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Telemetry & Intelligence</CardTitle>
                  <CardDescription className="text-xs">Sub-second behavioral event logging</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Heartbeat Interval:</span>
                <span className="font-mono">10,000 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Batch Buffer Flush:</span>
                <span className="font-mono">5 events or 3s</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Anti-Cheat Tab Monitor:</span>
                <span className="font-semibold text-emerald-600">ACTIVE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
