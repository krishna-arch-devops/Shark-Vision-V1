import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Shield, Mail, Phone, Calendar } from "lucide-react";
import { getDashboardPathForRole } from "@/lib/auth/session";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const navItems: NavItem[] = [
    { label: "Dashboard", href: getDashboardPathForRole(profile.role), icon: User },
  ];

  return (
    <DashboardLayout
      profile={profile}
      navItems={navItems}
      roleTitle={`${profile.role} Settings`}
    >
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Profile</h1>
          <p className="text-xs text-slate-500">
            Account identity, institutional affiliation, and contact preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Verified account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  defaultValue={profile.full_name}
                  disabled
                />
                <Input
                  label="Email Address"
                  defaultValue={profile.email}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  defaultValue={profile.phone_number || "Not provided"}
                  disabled
                />
                <div className="w-full space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    System Role
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800">
                    <Shield className="h-4 w-4 text-sky-600" />
                    <span className="font-semibold">{profile.role}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Created: {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
