import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getDashboardPathForRole } from "@/lib/auth/roles";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const navItems: NavItem[] = [
    { label: "Dashboard", href: getDashboardPathForRole(profile.role), iconName: "LayoutDashboard" },
    { label: "Profile", href: "/profile", iconName: "User" },
  ];

  return (
    <DashboardLayout
      profile={profile}
      navItems={navItems}
      roleTitle={`${profile.role.replace("_", " ")} Settings`}
    >
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Profile</h1>
          <p className="text-xs text-slate-500">
            Manage your personal profile, credentials, and identity credentials.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">User Details</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verified identity credentials on the Sharkvision examination network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                <p className="text-sm font-medium text-slate-900 mt-1">{profile.full_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                <p className="text-sm font-medium text-slate-900 mt-1">{profile.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Platform Role</label>
                <p className="text-sm font-medium text-slate-900 mt-1">{profile.role}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                <p className="text-sm font-medium text-slate-900 mt-1">{profile.phone_number || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
