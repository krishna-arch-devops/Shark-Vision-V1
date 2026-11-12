import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeAttempt } from "@/lib/exam/engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: attempt, error: aErr } = await supabase
      .from("examination_attempts")
      .select("id, student_id, status")
      .eq("id", attemptId)
      .eq("student_id", user.id)
      .single();

    if (aErr || !attempt) {
      return NextResponse.json({ error: "Attempt not found or unauthorized" }, { status: 403 });
    }

    const result = await finalizeAttempt(attemptId, "SUBMITTED");

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit examination" }, { status: 500 });
  }
}
