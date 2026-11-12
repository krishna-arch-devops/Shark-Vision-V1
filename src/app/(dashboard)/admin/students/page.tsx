import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { UserSettingsModal } from "@/components/admin/user-settings-modal";

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

export default async function AdminStudentsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const studentsList = await db
    .select()
    .from(profiles)
    .where(eq(profiles.role, "STUDENT"))
    .orderBy(desc(profiles.createdAt));

  return (
    <DashboardLayout profile={profile} navItems={adminNavItems} roleTitle="Super Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Directory & Account Controls
            </h1>
            <p className="text-xs text-slate-500">
              Manage student accounts, active status toggles, and profile contact details.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            Enrolled Candidates: <strong>{studentsList.length}</strong>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{s.fullName}</div>
                    <div className="text-[11px] text-slate-500">{s.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {s.phoneNumber || <span className="text-slate-400 italic">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {s.isActive ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <UserSettingsModal
                      user={{
                        id: s.id,
                        fullName: s.fullName,
                        email: s.email,
                        role: s.role,
                        phoneNumber: s.phoneNumber,
                        isActive: s.isActive,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
