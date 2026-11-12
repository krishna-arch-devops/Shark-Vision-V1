import { db } from "@/lib/db";
import {
  examinationAttempts,
  examinations,
  examinationQuestions,
  questions,
  subjects,
  attemptResponses,
  attemptEvents,
  profiles,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
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

    // 1. Fetch attempt and exam master from PostgreSQL
    const [attempt] = await db
      .select({
        id: examinationAttempts.id,
        examinationId: examinationAttempts.examinationId,
        studentId: examinationAttempts.studentId,
        startedAt: examinationAttempts.startedAt,
        submittedAt: examinationAttempts.submittedAt,
        durationMinutes: examinations.durationMinutes,
        studentName: profiles.fullName,
      })
      .from(examinationAttempts)
      .innerJoin(examinations, eq(examinationAttempts.examinationId, examinations.id))
      .innerJoin(profiles, eq(examinationAttempts.studentId, profiles.id))
      .where(eq(examinationAttempts.id, attemptId))
      .limit(1);

    if (!attempt) {
      throw new Error("Examination attempt not found.");
    }

    // 2. Fetch examination questions with subjects from PostgreSQL
    const examQuestions = await db
      .select({
        questionId: examinationQuestions.questionId,
        questionOrder: examinationQuestions.questionOrder,
        marks: examinationQuestions.marks,
        negativeMarks: examinationQuestions.negativeMarks,
        snapshotText: examinationQuestions.snapshotText,
        snapshotOptions: examinationQuestions.snapshotOptions,
        snapshotCorrectAnswer: examinationQuestions.snapshotCorrectAnswer,
        snapshotBenchmarkSeconds: examinationQuestions.snapshotBenchmarkSeconds,
        subjectId: questions.subjectId,
        topic: questions.topic,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(examinationQuestions)
      .innerJoin(questions, eq(examinationQuestions.questionId, questions.id))
      .leftJoin(subjects, eq(questions.subjectId, subjects.id))
      .where(eq(examinationQuestions.examinationId, attempt.examinationId))
      .orderBy(asc(examinationQuestions.questionOrder));

    if (!examQuestions || examQuestions.length === 0) {
      throw new Error("Unable to fetch examination question set.");
    }

    const mappedQuestions = examQuestions.map((eqRow) => ({
      question_id: eqRow.questionId,
      question_order: eqRow.questionOrder,
      marks: Number(eqRow.marks),
      negative_marks: Number(eqRow.negativeMarks),
      snapshot_text: eqRow.snapshotText,
      snapshot_options: eqRow.snapshotOptions as any,
      snapshot_correct_answer: eqRow.snapshotCorrectAnswer,
      snapshot_benchmark_seconds: eqRow.snapshotBenchmarkSeconds || 60,
      subject_id: eqRow.subjectId,
      subject_name: eqRow.subjectName || "Subject",
      subject_code: eqRow.subjectCode || "SUB",
      topic: eqRow.topic,
    }));

    // 3. Fetch candidate's responses from PostgreSQL
    const responses = await db
      .select()
      .from(attemptResponses)
      .where(eq(attemptResponses.attemptId, attemptId));

    // 4. Fetch candidate's behavioral events from PostgreSQL
    const events = await db
      .select()
      .from(attemptEvents)
      .where(eq(attemptEvents.attemptId, attemptId))
      .orderBy(asc(attemptEvents.clientSequenceNum));

    const calcInput: AnalyticsCalculationInput = {
      attemptId,
      durationMinutes: attempt.durationMinutes,
      startedAt: attempt.startedAt ? attempt.startedAt.toISOString() : new Date().toISOString(),
      submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
      questions: mappedQuestions,
      responses: responses.map((r) => ({
        id: r.id,
        attempt_id: r.attemptId,
        question_id: r.questionId,
        selected_option: r.selectedOption,
        is_marked_for_review: r.isMarkedForReview,
        is_visited: r.isVisited,
        active_time_ms: Number(r.activeTimeMs),
        time_spent_seconds: Math.round(Number(r.activeTimeMs) / 1000),
        answer_change_count: 0,
        first_selected_option: null,
        last_interaction_at: null,
        created_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
        updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      })) as any,
      events: events.map((e) => ({
        id: e.id,
        attempt_id: e.attemptId,
        event_type: e.eventType,
        question_id: e.questionId,
        client_sequence_num: e.clientSequenceNum,
        client_timestamp: e.clientTimestamp.toISOString(),
        server_timestamp: e.serverTimestamp.toISOString(),
        payload: e.payload,
        created_at: e.createdAt.toISOString(),
      })) as any,
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

    const studentName = attempt.studentName || "The student";
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
      attempt.examinationId,
      attempt.studentId,
      fullAnalytics
    );

    return fullAnalytics;
  }
}
