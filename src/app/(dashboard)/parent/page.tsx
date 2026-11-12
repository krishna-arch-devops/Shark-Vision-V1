import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LayoutDashboard,
  Users,
  LineChart,
  TrendingUp,
  MessageSquare,
  User,
  Heart,
  Clock,
  Award,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const parentNavItems: NavItem[] = [
  { label: "Overview", href: "/parent", icon: LayoutDashboard },
  { label: "My Children", href: "/parent/children", icon: Users },
  { label: "Performance", href: "/parent/performance", icon: LineChart },
  { label: "Progress", href: "/parent/progress", icon: TrendingUp },
  { label: "Teacher Feedback", href: "/parent/feedback", icon: MessageSquare },
  { label: "Profile", href: "/parent/profile", icon: User },
];

export default async function ParentDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "PARENT" && profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const supabase = await createClient();

  // Query verified linked children
  const { data: linkedChildren } = await supabase
    .from("parent_student_links")
    .select("student_id, relationship_type, is_verified, profiles:student_id(*)")
    .eq("parent_id", profile.id)
    .eq("is_verified", true);

  const verifiedChildCount = linkedChildren?.length || 0;

  return (
    <DashboardLayout profile={profile} navItems={parentNavItems} roleTitle="Parent Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hello, {profile.full_name}
          </h1>
          <p className="text-xs text-slate-500">
            Simple, honest insights into your child&apos;s JEE & NEET preparation progress.
          </p>
        </div>

        {/* Children Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Linked Children</span>
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {verifiedChildCount}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tests Completed</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              0
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Time Strategy Health</span>
              <Clock className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              --
            </div>
          </Card>
        </div>

        {/* Child's Progress Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Child&apos;s Progress</CardTitle>
              <CardDescription>Verified academic performance summary and growth metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedChildCount > 0 ? (
                <div className="space-y-3">
                  {linkedChildren?.map((link, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-800">Child #{idx + 1}</p>
                      <p className="text-[11px] text-slate-500">Relation: {link.relationship_type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Users className="h-6 w-6 text-slate-400" />}
                  title="No Linked Children"
                  description="Your child must be linked and verified by the institution administration before examination performance will be shown."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teacher & Institute Notes</CardTitle>
              <CardDescription>Direct recommendations from subject mentors</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<MessageSquare className="h-6 w-6 text-slate-400" />}
                title="No Teacher Notes Published Yet"
                description="Teacher reviews and actionable recommendations will be shared here following scheduled assessments."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
