import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/features/analytics/services/analytics-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const startTime = Date.now();
  try {
    const { attemptId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit analytics requests: 60 per minute per user
    const rl = checkRateLimit(`analytics_${user.id}`, { windowMs: 60 * 1000, maxRequests: 60 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on analytics view", { userId: user.id });
      return NextResponse.json(
        { error: "Too many analytics requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    // Verify user role & attempt authorization
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const { data: attempt } = await supabase
      .from("examination_attempts")
      .select("student_id, examination_id, examinations!inner(result_release_policy, end_window)")
      .eq("id", attemptId)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Role-based access validation
    if (profile.role === "STUDENT") {
      if (attempt.student_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: Not your attempt" }, { status: 403 });
      }

      // Check result-release policy
      const policy = (attempt.examinations as any).result_release_policy;
      const endWindow = new Date((attempt.examinations as any).end_window);
      if (policy === "AFTER_DEADLINE" && new Date() < endWindow) {
        return NextResponse.json(
          { error: "Results for this examination will be released after the submission deadline." },
          { status: 423 }
        );
      }
      if (policy === "MANUAL") {
        return NextResponse.json(
          { error: "Results have not been released by the institution yet." },
          { status: 423 }
        );
      }
    } else if (profile.role === "PARENT") {
      // Check linked child verified
      const { data: link } = await supabase
        .from("parent_student_links")
        .select("is_verified")
        .eq("parent_id", user.id)
        .eq("student_id", attempt.student_id)
        .eq("is_verified", true)
        .single();

      if (!link) {
        return NextResponse.json({ error: "Forbidden: Student is not your linked child" }, { status: 403 });
      }
    } else if (profile.role === "TEACHER") {
      // Check teacher teaches student
      const { data: canAccess } = await supabase.rpc("teacher_teaches_student", {
        p_teacher_id: user.id,
        p_student_id: attempt.student_id,
      });

      if (!canAccess && profile.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden: Student not in your assigned batches" }, { status: 403 });
      }
    }

    const analyticsService = new AnalyticsService();
    const analytics = await analyticsService.getOrComputeAttemptAnalytics(attemptId);

    logger.debug("Analytics retrieved successfully", {
      attemptId,
      userId: user.id,
      role: profile.role,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    logger.error("Failed to retrieve attempt analytics", { error });
    return NextResponse.json(
      { error: "Failed to retrieve analytics" },
      { status: 500 }
    );
  }
}
