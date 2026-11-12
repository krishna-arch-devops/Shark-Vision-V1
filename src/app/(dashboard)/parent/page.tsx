import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/features/analytics/services/analytics-service";

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
    .select("student_id, relationship_type, is_verified, profiles:student_id(full_name, email)")
    .eq("parent_id", profile.id)
    .eq("is_verified", true);

  const verifiedChildCount = linkedChildren?.length || 0;

  // If parent has a verified child, query latest completed examination attempt
  let latestAttemptAnalytics: any = null;
  let activeChildName = "Your Child";

  if (linkedChildren && linkedChildren.length > 0) {
    const firstChild = linkedChildren[0];
    activeChildName = (firstChild.profiles as any)?.full_name || "Your Child";

    const { data: latestAttempt } = await supabase
      .from("examination_attempts")
      .select("id, examination_id, examinations!inner(title, result_release_policy, end_window)")
      .eq("student_id", firstChild.student_id)
      .eq("status", "SUBMITTED")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestAttempt) {
      try {
        const analyticsService = new AnalyticsService();
        latestAttemptAnalytics = await analyticsService.getOrComputeAttemptAnalytics(latestAttempt.id);
      } catch (err) {
        // Safe fallback if attempt analytics is inaccessible
      }
    }
  }

  return (
    <DashboardLayout profile={profile} navItems={parentNavItems} roleTitle="Parent Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hello, {profile.full_name}
          </h1>
          <p className="text-xs text-slate-500">
            Transparent, plain-English insights into your child&apos;s JEE & NEET preparation progress.
          </p>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Verified Children</span>
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              {verifiedChildCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Authorized student links</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Latest Test Accuracy</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">
              {latestAttemptAnalytics?.performanceOverview?.accuracyPercentage !== null &&
              latestAttemptAnalytics?.performanceOverview?.accuracyPercentage !== undefined
                ? `${latestAttemptAnalytics.performanceOverview.accuracyPercentage}%`
                : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Score: {latestAttemptAnalytics?.performanceOverview?.marksObtained ?? "--"} / {latestAttemptAnalytics?.performanceOverview?.maximumMarks ?? "--"}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Pacing Discipline</span>
              <Clock className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              {latestAttemptAnalytics
                ? `${Math.round(latestAttemptAnalytics.performanceOverview.averageActiveTimePerAttemptedMs / 1000)}s`
                : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Average seconds per question</p>
          </Card>
        </div>

        {/* Plain-English Parent Performance Summary */}
        {latestAttemptAnalytics ? (
          <div className="space-y-6">
            <Card className="border-sky-100 bg-gradient-to-r from-sky-50/40 via-white to-sky-50/20 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-800">
                  Your Child&apos;s Progress Summary
                </h3>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {latestAttemptAnalytics.parentSummary.summaryParagraphs.map(
                  (para: string, idx: number) => (
                    <p key={idx}>{para}</p>
                  )
                )}

                {latestAttemptAnalytics.parentSummary.strengthStatement && (
                  <p className="font-semibold text-emerald-800">
                    {latestAttemptAnalytics.parentSummary.strengthStatement}
                  </p>
                )}

                {latestAttemptAnalytics.parentSummary.attentionStatement && (
                  <p className="font-semibold text-amber-800">
                    {latestAttemptAnalytics.parentSummary.attentionStatement}
                  </p>
                )}

                {latestAttemptAnalytics.parentSummary.timeManagementObservation && (
                  <p className="text-slate-600 italic">
                    {latestAttemptAnalytics.parentSummary.timeManagementObservation}
                  </p>
                )}
              </div>

              <p className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
                {latestAttemptAnalytics.parentSummary.dataSufficiencyNote}
              </p>
            </Card>

            {/* What Should Your Child Focus on Next? */}
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle>What Should {activeChildName} Focus on Next?</CardTitle>
                <CardDescription>
                  Key action items determined from their actual examination errors and time pacing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {latestAttemptAnalytics.recommendations.map((rec: any) => (
                    <div
                      key={rec.ruleId}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3 text-xs"
                    >
                      <div className="h-2 w-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900">{rec.title}</h4>
                        <p className="text-slate-600 mt-0.5">{rec.suggestedAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Child Academic Summary</CardTitle>
              <CardDescription>Verified academic performance summary and growth metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedChildCount > 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-6 w-6 text-slate-400" />}
                  title="No Test Submissions Recorded"
                  description="Your child has not submitted any examinations yet. As soon as mock assessments are submitted and results released, plain-English reports will appear here."
                />
              ) : (
                <EmptyState
                  icon={<Users className="h-6 w-6 text-slate-400" />}
                  title="No Linked Children"
                  description="Your child must be linked and verified by the institution administration before examination performance will be shown."
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
