import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { db } from "@/lib/db";
import { institutions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Building2 } from "lucide-react";

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

export default async function AdminInstitutionsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const allInstitutions = await db.select().from(institutions).orderBy(desc(institutions.createdAt));

  return (
    <DashboardLayout profile={profile} navItems={adminNavItems} roleTitle="Super Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Partner Institutions & Coaching Centers
            </h1>
            <p className="text-xs text-slate-500">
              Manage multi-tenant school/center configurations and batch hierarchies.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {allInstitutions.map((inst) => (
            <div
              key={inst.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{inst.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">Code: {inst.code}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                    {inst.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{inst.city || "Bangalore"}, {inst.state || "Karnataka"}</span>
                <span className="text-emerald-700 font-medium">Enterprise Tier</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
