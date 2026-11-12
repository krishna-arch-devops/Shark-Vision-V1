import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SaveResponseSchema } from "@/lib/validation/exam";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit response saves: 120 per minute per student
    const rl = checkRateLimit(`response_${user.id}`, { windowMs: 60 * 1000, maxRequests: 120 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on response save", { userId: user.id });
      return NextResponse.json(
        { error: "Too many response updates. Please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const body = await req.json();
    const parsed = SaveResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { attemptId, questionId, selectedOption, isMarkedForReview, activeTimeMs } = parsed.data;

    // Verify attempt belongs to user and is currently IN_PROGRESS
    const { data: attempt, error: aErr } = await supabase
      .from("examination_attempts")
      .select("status, server_deadline")
      .eq("id", attemptId)
      .eq("student_id", user.id)
      .single();

    if (aErr || !attempt) {
      return NextResponse.json({ error: "Attempt not found or unauthorized" }, { status: 403 });
    }

    if (attempt.status !== "IN_PROGRESS" && attempt.status !== "CREATED") {
      return NextResponse.json({ error: "Examination is no longer active" }, { status: 409 });
    }

    // Verify deadline (allowing 30 second network grace period)
    const deadlineWithGrace = new Date(new Date(attempt.server_deadline).getTime() + 30000);
    if (new Date() > deadlineWithGrace) {
      return NextResponse.json({ error: "Examination deadline has passed" }, { status: 410 });
    }

    // Upsert response
    const { error: upsertErr } = await supabase
      .from("attempt_responses")
      .upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: selectedOption,
          is_marked_for_review: isMarkedForReview,
          is_visited: true,
          active_time_ms: activeTimeMs,
          last_visited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id,question_id" }
      );

    if (upsertErr) {
      logger.error("Failed to upsert student response", { error: upsertErr, attemptId, questionId });
      return NextResponse.json({ error: "Failed to persist response" }, { status: 500 });
    }

    logger.debug("Attempt response saved", {
      attemptId,
      questionId,
      userId: user.id,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error: any) {
    logger.error("Exception in save response endpoint", { error });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
