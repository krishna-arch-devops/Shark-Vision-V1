import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/local-auth";
import { SaveResponseSchema } from "@/lib/validation/exam";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attemptResponses, examinationAttempts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit response saves: 120 per minute per student
    const rl = checkRateLimit(`response_${session.userId}`, { windowMs: 60 * 1000, maxRequests: 120 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on response save", { userId: session.userId });
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

    // Verify attempt belongs to user and is currently active
    const [attempt] = await db
      .select({
        status: examinationAttempts.status,
        serverDeadline: examinationAttempts.serverDeadline,
      })
      .from(examinationAttempts)
      .where(
        and(
          eq(examinationAttempts.id, attemptId),
          eq(examinationAttempts.studentId, session.userId)
        )
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found or unauthorized" }, { status: 403 });
    }

    if (attempt.status !== "IN_PROGRESS" && attempt.status !== "CREATED") {
      return NextResponse.json({ error: "Examination is no longer active" }, { status: 409 });
    }

    // Verify deadline (allowing 30 second grace period)
    const deadlineWithGrace = new Date(attempt.serverDeadline.getTime() + 30000);
    if (new Date() > deadlineWithGrace) {
      return NextResponse.json({ error: "Examination deadline has passed" }, { status: 410 });
    }

    const now = new Date();

    // Upsert response
    await db
      .insert(attemptResponses)
      .values({
        attemptId,
        questionId,
        selectedOption,
        isMarkedForReview,
        isVisited: true,
        activeTimeMs,
        lastVisitedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [attemptResponses.attemptId, attemptResponses.questionId],
        set: {
          selectedOption,
          isMarkedForReview,
          isVisited: true,
          activeTimeMs,
          lastVisitedAt: now,
          updatedAt: now,
        },
      });

    return NextResponse.json({ success: true, savedAt: now.toISOString() });
  } catch (error: any) {
    logger.error("Exception in save response endpoint", { error });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
