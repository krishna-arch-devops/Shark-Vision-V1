import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/local-auth";
import { finalizeAttempt } from "@/lib/exam/engine";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { examinationAttempts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit finalize attempts: 5 per minute per user
    const rl = checkRateLimit(`submit_${session.userId}`, { windowMs: 60 * 1000, maxRequests: 5 });
    if (!rl.allowed) {
      logger.warn("Rate limit exceeded on exam submit", { userId: session.userId });
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const { attemptId } = await req.json();
    if (!attemptId || typeof attemptId !== "string") {
      return NextResponse.json({ error: "Valid Attempt ID is required" }, { status: 400 });
    }

    // Verify ownership and status in native PostgreSQL
    const [attempt] = await db
      .select({
        id: examinationAttempts.id,
        studentId: examinationAttempts.studentId,
        status: examinationAttempts.status,
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

    if (attempt.status === "SUBMITTED" || attempt.status === "TIMED_OUT") {
      return NextResponse.json(
        { message: "Examination already finalized", status: attempt.status },
        { status: 200 }
      );
    }

    const result = await finalizeAttempt(attemptId, "SUBMITTED");

    logger.info("Examination finalized successfully", {
      attemptId,
      userId: session.userId,
      score: result.marks_obtained,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error("Failed to submit examination", { error });
    return NextResponse.json({ error: "Failed to submit examination" }, { status: 500 });
  }
}
