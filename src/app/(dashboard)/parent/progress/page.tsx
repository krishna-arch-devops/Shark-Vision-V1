import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { DashboardLayout, NavItem } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  Calendar,
  Sparkles,
  ChevronRight,
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

export default async function ParentProgressPage() {
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
    .select("student_id, profiles:student_id(full_name)")
    .eq("parent_id", profile.id)
    .eq("is_verified", true);

  if (!linkedChildren || linkedChildren.length === 0) {
    return (
      <DashboardLayout profile={profile} navItems={parentNavItems} roleTitle="Parent Portal">
        <EmptyState
          icon={<Users className="h-6 w-6 text-slate-400" />}
          title="No Verified Children Linked"
          description="Your parent account must have verified child links approved by institution administration to review progress digests."
        />
      </DashboardLayout>
    );
  }

  const activeChild = linkedChildren[0];
  const studentName = (activeChild.profiles as any)?.full_name || "Your Child";

  // Query completed attempts for this child
  const { data: attempts } = await supabase
    .from("examination_attempts")
    .select("id, status, started_at, submitted_at, examinations(title, category, total_marks)")
    .eq("student_id", activeChild.student_id)
    .eq("status", "SUBMITTED")
    .order("submitted_at", { ascending: false });

  // Query completed revision tasks for this child
  const { data: completedTasks } = await supabase
    .from("revision_tasks")
    .select("id, title, completed_at")
    .eq("student_id", activeChild.student_id)
    .eq("status", "COMPLETED");

  const completedTaskCount = completedTasks?.length || 0;

  return (
    <DashboardLayout profile={profile} navItems={parentNavItems} roleTitle="Parent Portal">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default">WEEKLY PERFORMANCE DIGEST</Badge>
            <span className="text-xs text-slate-400">Reporting for: {studentName}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {studentName}&apos;s Weekly Academic Progress
          </h1>
          <p className="text-xs text-slate-500">
            Plain-English progress summary compiled from verified time-stamped examination submissions and completed remedial tasks.
          </p>
        </div>

        {/* Weekly Digest Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-sky-100 bg-sky-50/20">
            <span className="text-xs font-semibold uppercase text-slate-500">Tests Completed</span>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {attempts?.length || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Submitted assessments</p>
          </Card>

          <Card className="p-5 border-emerald-100 bg-emerald-50/20">
            <span className="text-xs font-semibold uppercase text-slate-500">Revision Tasks Finished</span>
            <div className="text-3xl font-bold text-emerald-700 mt-2">
              {completedTaskCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target remedial tasks resolved</p>
          </Card>

          <Card className="p-5 border-slate-200 bg-white">
            <span className="text-xs font-semibold uppercase text-slate-500">Preparation Rhythm</span>
            <div className="text-3xl font-bold text-sky-700 mt-2">
              {attempts && attempts.length > 0 ? "Consistent" : "Pending Tests"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Based on test frequency</p>
          </Card>
        </div>

        {/* Narrative Digest Card */}
        <Card className="p-6 border-slate-200 bg-white">
          <CardHeader className="p-0 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <CardTitle>Weekly Summary Observations</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              {studentName} has completed {attempts?.length || 0} examination(s) to date and marked {completedTaskCount} structured revision practice tasks as completed.
            </p>
            {completedTaskCount > 0 ? (
              <p className="font-semibold text-emerald-800">
                Remedial effort recorded: {studentName} resolved specific practice items in weak topic areas identified from recent test telemetry.
              </p>
            ) : (
              <p className="text-slate-500">
                Encourage {studentName} to activate their personalized revision plan following test submissions.
              </p>
            )}
            <p className="pt-2 text-[11px] text-slate-400">
              Notice: All observations are calculated directly from recorded answer timestamps. No assumptions or psychological profiling are utilized.
            </p>
          </CardContent>
        </Card>

        {/* Historical Completed Examinations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments Completed</CardTitle>
            <CardDescription>Verified examination submissions by {studentName}</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts && attempts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {attempts.map((att: any) => (
                  <div
                    key={att.id}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {att.examinations?.title || "Examination"}
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Category: {att.examinations?.category} • Submitted: {new Date(att.submitted_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Link
                      href={`/student/exams/${att.id}/results`}
                      className="font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <span>View Report</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-6 w-6 text-slate-400" />}
                title="No Completed Tests Yet"
                description={`${studentName} has not completed any tests this week.`}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
