import {
  AnalyticsCalculationInput,
  RawExamSnapshotQuestion,
} from "../domain/input-types";
import { PerformanceOverview, MeasurementQuality } from "../types";

export function calculatePerformanceOverview(
  input: AnalyticsCalculationInput
): PerformanceOverview {
  const { attemptId, durationMinutes, startedAt, submittedAt, questions, responses, events } = input;

  const totalQuestions = questions.length;
  const responseMap = new Map<string, string | null>();
  const activeTimeMap = new Map<string, number>();

  for (const r of responses) {
    responseMap.set(r.question_id, r.selected_option);
    activeTimeMap.set(r.question_id, Number(r.active_time_ms || 0));
  }

  let attemptedQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let marksObtained = 0;
  let maximumMarks = 0;

  const attemptedTimes: Array<{ questionId: string; activeTimeMs: number }> = [];

  for (const q of questions) {
    const qMarks = Number(q.marks || 4);
    const qNeg = Number(q.negative_marks || 1);
    maximumMarks += qMarks;

    const selected = responseMap.get(q.question_id);
    const timeMs = activeTimeMap.get(q.question_id) || 0;

    if (selected && selected.trim() !== "") {
      attemptedQuestions++;
      attemptedTimes.push({ questionId: q.question_id, activeTimeMs: timeMs });

      if (selected.trim().toUpperCase() === q.snapshot_correct_answer.trim().toUpperCase()) {
        correctAnswers++;
        marksObtained += qMarks;
      } else {
        incorrectAnswers++;
        marksObtained -= qNeg;
      }
    }
  }

  const unansweredQuestions = totalQuestions - attemptedQuestions;

  // Percentage Score can be negative if negative marking exceeds positive marks
  const percentageScore =
    maximumMarks > 0 ? Number(((marksObtained / maximumMarks) * 100).toFixed(2)) : 0;

  // Accuracy: Correct / Attempted * 100 (explicit null when 0 attempted)
  const accuracyPercentage =
    attemptedQuestions > 0
      ? Number(((correctAnswers / attemptedQuestions) * 100).toFixed(2))
      : null;

  // Total recorded question dwell time
  const totalRecordedQuestionTimeMs = Array.from(activeTimeMap.values()).reduce(
    (sum, t) => sum + t,
    0
  );

  // Actual wall exam elapsed time
  const startTs = new Date(startedAt).getTime();
  const endTs = submittedAt ? new Date(submittedAt).getTime() : Date.now();
  const actualActiveExamTimeMs = Math.max(0, endTs - startTs);

  // Attempted question times calculations
  const totalAttemptedTimeMs = attemptedTimes.reduce((sum, item) => sum + item.activeTimeMs, 0);
  const averageActiveTimePerAttemptedMs =
    attemptedQuestions > 0 ? Math.round(totalAttemptedTimeMs / attemptedQuestions) : 0;

  // Median question time
  let medianQuestionTimeMs = 0;
  if (attemptedTimes.length > 0) {
    const sorted = [...attemptedTimes].sort((a, b) => a.activeTimeMs - b.activeTimeMs);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      medianQuestionTimeMs = Math.round((sorted[mid - 1].activeTimeMs + sorted[mid].activeTimeMs) / 2);
    } else {
      medianQuestionTimeMs = sorted[mid].activeTimeMs;
    }
  }

  // Fastest and slowest attempted questions
  let fastestAttemptedQuestion: { questionId: string; activeTimeMs: number } | null = null;
  let slowestAttemptedQuestion: { questionId: string; activeTimeMs: number } | null = null;

  if (attemptedTimes.length > 0) {
    const sorted = [...attemptedTimes].sort((a, b) => a.activeTimeMs - b.activeTimeMs);
    fastestAttemptedQuestion = sorted[0];
    slowestAttemptedQuestion = sorted[sorted.length - 1];
  }

  // Quality indicator based on event completeness
  let measurementQuality: MeasurementQuality = "COMPLETE";
  if (events.length === 0 && totalRecordedQuestionTimeMs === 0) {
    measurementQuality = "UNAVAILABLE";
  } else if (events.length < attemptedQuestions) {
    measurementQuality = "PARTIAL";
  }

  return {
    attemptId,
    totalQuestions,
    attemptedQuestions,
    unansweredQuestions,
    correctAnswers,
    incorrectAnswers,
    marksObtained,
    maximumMarks,
    percentageScore,
    accuracyPercentage,
    durationMinutes,
    actualActiveExamTimeMs,
    totalRecordedQuestionTimeMs,
    averageActiveTimePerAttemptedMs,
    medianQuestionTimeMs,
    fastestAttemptedQuestion,
    slowestAttemptedQuestion,
    measurementQuality,
  };
}
