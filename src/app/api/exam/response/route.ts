import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SaveResponseSchema } from "@/lib/validation/exam";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Verify deadline
    if (new Date() > new Date(attempt.server_deadline)) {
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
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
