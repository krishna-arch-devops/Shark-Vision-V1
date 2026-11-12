import { createClient } from "@/lib/supabase/server";
import { CompleteAttemptAnalytics } from "../types";
import { AnalyticsCalculationInput } from "../domain/input-types";
import { calculatePerformanceOverview } from "../calculators/performance-calculator";
import { calculateTimeIntelligence } from "../calculators/time-calculator";
import { calculateAnswerChangeIntelligence } from "../calculators/answer-change-calculator";
import { calculateSpeedAccuracyMatrix } from "../calculators/speed-accuracy-calculator";
import {
  calculateSubjectAnalytics,
  calculateTopicAnalytics,
} from "../calculators/subject-topic-calculator";
import { generateRecommendations } from "../recommendations/recommendation-engine";
import { generateParentSummary } from "../services/parent-summary-service";
import { AnalyticsRepository } from "../repositories/analytics-repository";

export class AnalyticsService {
  private repo = new AnalyticsRepository();

  /**
   * Computes or retrieves cached analytics for an examination attempt.
   */
  async getOrComputeAttemptAnalytics(
    attemptId: string,
    forceRecompute = false
  ): Promise<CompleteAttemptAnalytics> {
    if (!forceRecompute) {
      const cached = await this.repo.getSnapshot(attemptId);
      if (cached) return cached;
    }

    const supabase = await createClient();

    // 1. Fetch attempt and exam
    const { data: attempt, error: aErr } = await supabase
      .from("examination_attempts")
      .select("*, examinations!inner(*), profiles!student_id(full_name)")
      .eq("id", attemptId)
      .single();

    if (aErr || !attempt) {
      throw new Error("Examination attempt not found.");
    }

    // 2. Fetch examination questions with subjects
    const { data: examQuestions, error: eqErr } = await supabase
      .from("examination_questions")
      .select(`
        question_id,
        question_order,
        marks,
        negative_marks,
        snapshot_text,
        snapshot_options,
        snapshot_correct_answer,
        snapshot_benchmark_seconds,
        questions!inner(
          topic,
          subject_id,
          subjects!inner(name, code)
        )
      `)
      .eq("examination_id", attempt.examination_id)
      .order("question_order", { ascending: true });

    if (eqErr || !examQuestions) {
      throw new Error("Unable to fetch examination question set.");
    }

    const mappedQuestions = examQuestions.map((eq: any) => ({
      question_id: eq.question_id,
      question_order: eq.question_order,
      marks: Number(eq.marks),
      negative_marks: Number(eq.negative_marks),
      snapshot_text: eq.snapshot_text,
      snapshot_options: eq.snapshot_options,
      snapshot_correct_answer: eq.snapshot_correct_answer,
      snapshot_benchmark_seconds: eq.snapshot_benchmark_seconds || null,
      subject_id: eq.questions?.subject_id,
      subject_name: eq.questions?.subjects?.name,
      subject_code: eq.questions?.subjects?.code,
      topic: eq.questions?.topic,
    }));

    // 3. Fetch candidate's responses
    const { data: responses } = await supabase
      .from("attempt_responses")
      .select("*")
      .eq("attempt_id", attemptId);

    // 4. Fetch candidate's behavioral events
    const { data: events } = await supabase
      .from("attempt_events")
      .select("*")
      .eq("attempt_id", attemptId)
      .order("client_sequence_num", { ascending: true });

    const calcInput: AnalyticsCalculationInput = {
      attemptId,
      durationMinutes: attempt.examinations.duration_minutes,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      questions: mappedQuestions,
      responses: responses || [],
      events: events || [],
    };

    // 5. Execute Pure Calculations
    const performanceOverview = calculatePerformanceOverview(calcInput);
    const timeIntelligence = calculateTimeIntelligence(calcInput);
    const answerChangeIntelligence = calculateAnswerChangeIntelligence(calcInput);
    const speedAccuracyMatrix = calculateSpeedAccuracyMatrix(calcInput);
    const subjectAnalytics = calculateSubjectAnalytics(calcInput);
    const topicAnalytics = calculateTopicAnalytics(calcInput);

    const recommendations = generateRecommendations({
      performance: performanceOverview,
      answerChanges: answerChangeIntelligence,
      speedAccuracy: speedAccuracyMatrix,
      topics: topicAnalytics,
      quality: performanceOverview.measurementQuality,
    });

    const studentName = attempt.profiles?.full_name || "The student";
    const parentSummary = generateParentSummary({
      studentName,
      performance: performanceOverview,
      answerChanges: answerChangeIntelligence,
      speedAccuracy: speedAccuracyMatrix,
      subjects: subjectAnalytics,
    });

    const fullAnalytics: CompleteAttemptAnalytics = {
      attemptId,
      schemaVersion: 1,
      calculatedAt: new Date().toISOString(),
      measurementQuality: performanceOverview.measurementQuality,
      performanceOverview,
      timeIntelligence,
      answerChangeIntelligence,
      speedAccuracyMatrix,
      subjectAnalytics,
      topicAnalytics,
      recommendations,
      parentSummary,
    };

    // 6. Save snapshot for instant subsequent reads
    await this.repo.saveSnapshot(
      attemptId,
      attempt.examination_id,
      attempt.student_id,
      fullAnalytics
    );

    return fullAnalytics;
  }
}
