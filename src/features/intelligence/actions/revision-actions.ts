"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { CompleteAttemptAnalytics } from "@/features/analytics/types";
import { revalidatePath } from "next/cache";

export async function generateRevisionPlanAction(attemptId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();

  // 1. Fetch attempt and exam
  const { data: attempt, error: aErr } = await supabase
    .from("examination_attempts")
    .select("student_id, examination_id, examinations(title)")
    .eq("id", attemptId)
    .single();

  if (aErr || !attempt) {
    throw new Error("Attempt not found");
  }

  // 2. Fetch or compute analytics snapshot
  const { data: snapshot } = await supabase
    .from("attempt_analytics_snapshots")
    .select("*")
    .eq("attempt_id", attemptId)
    .single();

  if (!snapshot) {
    throw new Error("Analytics snapshot must be generated first.");
  }

  const analytics: CompleteAttemptAnalytics = snapshot.performance_overview
    ? {
        attemptId,
        schemaVersion: snapshot.schema_version,
        calculatedAt: snapshot.calculated_at,
        measurementQuality: snapshot.measurement_quality,
        performanceOverview: snapshot.performance_overview,
        timeIntelligence: snapshot.time_intelligence,
        answerChangeIntelligence: snapshot.answer_change_intelligence,
        speedAccuracyMatrix: snapshot.speed_accuracy_matrix,
        subjectAnalytics: snapshot.subject_analytics,
        topicAnalytics: snapshot.topic_analytics,
        recommendations: snapshot.recommendations,
        parentSummary: snapshot.parent_summary,
      }
    : (null as any);

  // 3. Create or update Revision Plan
  const planTitle = `Targeted Revision: ${(attempt.examinations as any)?.title || "Assessment"}`;

  const { data: plan, error: pErr } = await supabase
    .from("revision_plans")
    .insert({
      student_id: attempt.student_id,
      title: planTitle,
      description: "Auto-generated structured remediation tasks based on examination time leaks and weak topics.",
      generated_from_attempt_id: attemptId,
      is_active: true,
    })
    .select()
    .single();

  if (pErr || !plan) {
    throw new Error(`Failed to initialize revision plan: ${pErr?.message}`);
  }

  // 4. Generate Tasks from Analytics Recommendations & Topics
  const tasksToInsert: Array<{
    plan_id: string;
    student_id: string;
    task_type: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    status: "PENDING";
    title: string;
    description: string;
    topic?: string;
  }> = [];

  // Weak topics (NEEDS_ATTENTION)
  const weakTopics = analytics.topicAnalytics.filter((t) => t.classification === "NEEDS_ATTENTION");
  for (const wt of weakTopics) {
    tasksToInsert.push({
      plan_id: plan.id,
      student_id: attempt.student_id,
      task_type: "PRACTICE_TOPIC",
      priority: "HIGH",
      status: "PENDING",
      title: `Practice Topic: ${wt.topic}`,
      description: `Observed accuracy was ${wt.accuracyPercentage}% (${wt.correctAnswers}/${wt.attemptedQuestions} correct). Resolve foundational questions.`,
      topic: wt.topic,
    });
  }

  // Answer change penalties
  const correctToInc = analytics.answerChangeIntelligence.questions.filter(
    (q) => q.classification === "CORRECT_TO_INCORRECT"
  );
  if (correctToInc.length > 0) {
    tasksToInsert.push({
      plan_id: plan.id,
      student_id: attempt.student_id,
      task_type: "REVIEW_ANSWER_CHANGE",
      priority: "HIGH",
      status: "PENDING",
      title: "Review Second-Guessed Mistakes",
      description: `You changed ${correctToInc.length} answers from correct to incorrect options. Review solution derivations to reinforce initial instincts.`,
    });
  }

  // Slow incorrect questions
  if (analytics.speedAccuracyMatrix.slowIncorrectCount > 0) {
    tasksToInsert.push({
      plan_id: plan.id,
      student_id: attempt.student_id,
      task_type: "REVIEW_SLOW_QUESTION",
      priority: "MEDIUM",
      status: "PENDING",
      title: "Analyze Question Speed Traps",
      description: `${analytics.speedAccuracyMatrix.slowIncorrectCount} questions exceeded target solving times and resulted in negative marks. Focus on rapid problem breakdown.`,
    });
  }

  if (tasksToInsert.length > 0) {
    await supabase.from("revision_tasks").insert(tasksToInsert);
  }

  revalidatePath("/student/revision");
  return plan;
}

export async function toggleRevisionTaskStatusAction(taskId: string, newStatus: "PENDING" | "COMPLETED") {
  const profile = await requireAuth();
  const supabase = await createClient();

  const completedAt = newStatus === "COMPLETED" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("revision_tasks")
    .update({
      status: newStatus,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("student_id", profile.id);

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  revalidatePath("/student/revision");
}
