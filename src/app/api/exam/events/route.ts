import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/local-auth";
import { ExamEventSchema } from "@/lib/validation/exam";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attemptEvents, examinationAttempts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per user: 120 events per minute
    const rl = checkRateLimit(`events_${session.userId}`, { windowMs: 60 * 1000, maxRequests: 120 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on exam events", { userId: session.userId });
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
    const [attempt] = await db
      .select({ status: examinationAttempts.status })
      .from(examinationAttempts)
      .where(
        and(
          eq(examinationAttempts.id, attemptId),
          eq(examinationAttempts.studentId, session.userId)
        )
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Attempt unauthorized or not found" }, { status: 403 });
    }

    // Insert event idempotently
    try {
      await db.insert(attemptEvents).values({
        attemptId,
        studentId: session.userId,
        questionId: questionId || null,
        eventType,
        clientSequenceNum,
        idempotencyKey,
        clientTimestamp: new Date(clientTimestamp),
        serverTimestamp: new Date(),
        payload: payload || {},
        clientSessionId,
      });
    } catch (insertErr: any) {
      // Duplicate idempotencyKey
      if (insertErr.code === "23505" || insertErr.message?.includes("unique")) {
        return NextResponse.json({ success: true, deduplicated: true });
      }
      logger.error("Failed to insert attempt event", { error: insertErr, userId: session.userId, attemptId });
      return NextResponse.json({ error: "Failed to persist event" }, { status: 500 });
    }

    return NextResponse.json({ success: true, loggedAt: new Date().toISOString() });
  } catch (error: any) {
    logger.error("Exception in exam events endpoint", { error });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
