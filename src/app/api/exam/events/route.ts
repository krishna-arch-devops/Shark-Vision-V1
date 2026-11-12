import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ExamEventSchema } from "@/lib/validation/exam";
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

    // Rate limit per user: 120 events per minute
    const rl = checkRateLimit(`events_${user.id}`, { windowMs: 60 * 1000, maxRequests: 120 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on exam events", { userId: user.id });
      return NextResponse.json(
        { error: "Too many event submissions. Please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const body = await req.json();
    const parsed = ExamEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Event schema validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      attemptId,
      questionId,
      eventType,
      clientSequenceNum,
      idempotencyKey,
      clientTimestamp,
      payload,
      clientSessionId,
    } = parsed.data;

    // Verify student ownership and active status
    const { data: attempt, error: aErr } = await supabase
      .from("examination_attempts")
      .select("status")
      .eq("id", attemptId)
      .eq("student_id", user.id)
      .single();

    if (aErr || !attempt) {
      return NextResponse.json({ error: "Attempt unauthorized or not found" }, { status: 403 });
    }

    // Insert event idempotently
    const { error: insertErr } = await supabase.from("attempt_events").insert({
      attempt_id: attemptId,
      student_id: user.id,
      question_id: questionId || null,
      event_type: eventType,
      client_sequence_num: clientSequenceNum,
      idempotency_key: idempotencyKey,
      client_timestamp: clientTimestamp,
      server_timestamp: new Date().toISOString(),
      payload,
      client_session_id: clientSessionId,
    });

    if (insertErr) {
      // If error is duplicate idempotency_key (23505), accept gracefully
      if (insertErr.code === "23505") {
        return NextResponse.json({ success: true, deduplicated: true });
      }
      logger.error("Failed to insert attempt event", { error: insertErr, userId: user.id, attemptId });
      return NextResponse.json({ error: "Failed to persist event" }, { status: 500 });
    }

    logger.debug("Attempt event logged", {
      attemptId,
      userId: user.id,
      eventType,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, loggedAt: new Date().toISOString() });
  } catch (error: any) {
    logger.error("Exception in exam events endpoint", { error });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
