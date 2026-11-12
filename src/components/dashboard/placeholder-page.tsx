import { redirect } from "next/navigation";
import { getCurrentProfile, getDashboardPathForRole } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export interface PlaceholderConfig {
  title: string;
  description: string;
  role: "SUPER_ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
  emptyTitle: string;
  emptyDescription: string;
}

export function createPlaceholderPage(config: PlaceholderConfig) {
  return async function PlaceholderPage() {
    const profile = await getCurrentProfile();

    if (!profile) {
      redirect("/login");
    }

    if (profile.role !== config.role && profile.role !== "SUPER_ADMIN") {
      redirect("/login");
    }

    const navItems: NavItem[] = [
      { label: "Dashboard", href: getDashboardPathForRole(profile.role), iconName: "LayoutDashboard" },
    ];

    return (
      <DashboardLayout
        profile={profile}
        navItems={navItems}
        roleTitle={`${config.role} Portal`}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{config.title}</h1>
            <p className="text-xs text-slate-500">{config.description}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Users className="h-6 w-6 text-slate-400" />}
                title={config.emptyTitle}
                description={config.emptyDescription}
              />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  };
}
