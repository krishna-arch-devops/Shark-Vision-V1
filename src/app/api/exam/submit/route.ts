import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeAttempt } from "@/lib/exam/engine";
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

    // Rate limit finalize attempts: 5 per minute per user
    const rl = checkRateLimit(`submit_${user.id}`, { windowMs: 60 * 1000, maxRequests: 5 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on exam submit", { userId: user.id });
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const { attemptId } = await req.json();
    if (!attemptId || typeof attemptId !== "string") {
      return NextResponse.json({ error: "Valid Attempt ID is required" }, { status: 400 });
    }

    // Verify ownership and status
    const { data: attempt, error: aErr } = await supabase
      .from("examination_attempts")
      .select("id, student_id, status")
      .eq("id", attemptId)
      .eq("student_id", user.id)
      .single();

    if (aErr || !attempt) {
      return NextResponse.json({ error: "Attempt not found or unauthorized" }, { status: 403 });
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "TIMED_OUT") {
      return NextResponse.json(
        { message: "Examination already finalized", status: attempt.status },
        { status: 200 }
      );
    }

    const result = await finalizeAttempt(attemptId, "SUBMITTED");

    logger.info("Examination finalized successfully", {
      attemptId,
      userId: user.id,
      score: result.marks_obtained,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error("Failed to submit examination", { error });
    return NextResponse.json({ error: "Failed to submit examination" }, { status: 500 });
  }
}
