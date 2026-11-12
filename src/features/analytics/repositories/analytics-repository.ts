import { db } from "@/lib/db";
import { attemptAnalyticsSnapshots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CompleteAttemptAnalytics } from "../types";

export class AnalyticsRepository {
  /**
   * Fetches an existing analytics snapshot if present.
   */
  async getSnapshot(attemptId: string): Promise<CompleteAttemptAnalytics | null> {
    const [data] = await db
      .select()
      .from(attemptAnalyticsSnapshots)
      .where(eq(attemptAnalyticsSnapshots.attemptId, attemptId))
      .limit(1);

    if (!data) return null;

    return {
      attemptId: data.attemptId,
      schemaVersion: data.schemaVersion,
      calculatedAt: data.calculatedAt ? data.calculatedAt.toISOString() : new Date().toISOString(),
      measurementQuality: data.measurementQuality as any,
      performanceOverview: data.performanceOverview as any,
      timeIntelligence: data.timeIntelligence as any,
      answerChangeIntelligence: data.answerChangeIntelligence as any,
      speedAccuracyMatrix: data.speedAccuracyMatrix as any,
      subjectAnalytics: data.subjectAnalytics as any,
      topicAnalytics: data.topicAnalytics as any,
      recommendations: data.recommendations as any,
      parentSummary: data.parentSummary as any,
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
    await db
      .insert(attemptAnalyticsSnapshots)
      .values({
        attemptId,
        examinationId,
        studentId,
        schemaVersion: analytics.schemaVersion,
        calculatedAt: new Date(analytics.calculatedAt),
        measurementQuality: analytics.measurementQuality,
        performanceOverview: analytics.performanceOverview,
        timeIntelligence: analytics.timeIntelligence,
        answerChangeIntelligence: analytics.answerChangeIntelligence,
        speedAccuracyMatrix: analytics.speedAccuracyMatrix,
        subjectAnalytics: analytics.subjectAnalytics,
        topicAnalytics: analytics.topicAnalytics,
        recommendations: analytics.recommendations,
        parentSummary: analytics.parentSummary,
      })
      .onConflictDoUpdate({
        target: attemptAnalyticsSnapshots.attemptId,
        set: {
          schemaVersion: analytics.schemaVersion,
          calculatedAt: new Date(analytics.calculatedAt),
          measurementQuality: analytics.measurementQuality,
          performanceOverview: analytics.performanceOverview,
          timeIntelligence: analytics.timeIntelligence,
          answerChangeIntelligence: analytics.answerChangeIntelligence,
          speedAccuracyMatrix: analytics.speedAccuracyMatrix,
          subjectAnalytics: analytics.subjectAnalytics,
          topicAnalytics: analytics.topicAnalytics,
          recommendations: analytics.recommendations,
          parentSummary: analytics.parentSummary,
        },
      });
  }
}
