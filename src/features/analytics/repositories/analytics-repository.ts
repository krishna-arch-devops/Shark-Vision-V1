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

export class AnalyticsRepository {
  /**
   * Fetches an existing analytics snapshot if present.
   */
  async getSnapshot(attemptId: string): Promise<CompleteAttemptAnalytics | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("attempt_analytics_snapshots")
      .select("*")
      .eq("attempt_id", attemptId)
      .single();

    if (error || !data) return null;

    return {
      attemptId: data.attempt_id,
      schemaVersion: data.schema_version,
      calculatedAt: data.calculated_at,
      measurementQuality: data.measurement_quality,
      performanceOverview: data.performance_overview,
      timeIntelligence: data.time_intelligence,
      answerChangeIntelligence: data.answer_change_intelligence,
      speedAccuracyMatrix: data.speed_accuracy_matrix,
      subjectAnalytics: data.subject_analytics,
      topicAnalytics: data.topic_analytics,
      recommendations: data.recommendations,
      parentSummary: data.parent_summary,
    };
  }

  /**
   * Persists an analytics snapshot cache for fast dashboard retrieval.
   */
  async saveSnapshot(
    attemptId: string,
    examinationId: string,
    studentId: string,
    analytics: CompleteAttemptAnalytics
  ): Promise<void> {
    const supabase = await createClient();
    await supabase.from("attempt_analytics_snapshots").upsert(
      {
        attempt_id: attemptId,
        examination_id: examinationId,
        student_id: studentId,
        schema_version: analytics.schemaVersion,
        calculatedAt: analytics.calculatedAt,
        measurement_quality: analytics.measurementQuality,
        performance_overview: analytics.performanceOverview,
        time_intelligence: analytics.timeIntelligence,
        answer_change_intelligence: analytics.answerChangeIntelligence,
        speed_accuracy_matrix: analytics.speedAccuracyMatrix,
        subject_analytics: analytics.subjectAnalytics,
        topic_analytics: analytics.topicAnalytics,
        recommendations: analytics.recommendations,
        parent_summary: analytics.parentSummary,
      },
      { onConflict: "attempt_id" }
    );
  }
}
