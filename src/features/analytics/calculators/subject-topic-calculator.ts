import { AnalyticsCalculationInput } from "../domain/input-types";
import { SubjectMetric, TopicMetric, TopicProficiency } from "../types";

export function calculateSubjectAnalytics(
  input: AnalyticsCalculationInput
): SubjectMetric[] {
  const { questions, responses, events } = input;

  const responseMap = new Map<string, { selected: string | null; activeMs: number }>();
  for (const r of responses) {
    responseMap.set(r.question_id, {
      selected: r.selected_option,
      activeMs: Number(r.active_time_ms || 0),
    });
  }

  // Count answer changes per question
  const qChangeMap = new Map<string, number>();
  for (const ev of events) {
    if (ev.question_id && (ev.event_type === "ANSWER_CHANGED" || ev.event_type === "ANSWER_CLEARED")) {
      qChangeMap.set(ev.question_id, (qChangeMap.get(ev.question_id) || 0) + 1);
    }
  }

  // Group by Subject
  const subjectGroups = new Map<
    string,
    {
      name: string;
      code: string;
      questions: typeof questions;
    }
  >();

  for (const q of questions) {
    const sId = q.subject_id || "general";
    const sName = q.subject_name || "General";
    const sCode = q.subject_code || "GEN";

    if (!subjectGroups.has(sId)) {
      subjectGroups.set(sId, { name: sName, code: sCode, questions: [] });
    }
    subjectGroups.get(sId)!.questions.push(q);
  }

  const subjectMetrics: SubjectMetric[] = [];

  for (const [subjectId, group] of subjectGroups.entries()) {
    let totalQuestions = group.questions.length;
    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let marksObtained = 0;
    let maximumMarks = 0;
    let totalActiveTimeMs = 0;
    let timeOnIncorrectMs = 0;
    let answerChangeCount = 0;
    let firstVsFinalMarksImpact = 0;

    for (const q of group.questions) {
      const qMarks = Number(q.marks || 4);
      const qNeg = Number(q.negative_marks || 1);
      maximumMarks += qMarks;

      const qResp = responseMap.get(q.question_id);
      const timeMs = qResp ? qResp.activeMs : 0;
      totalActiveTimeMs += timeMs;

      answerChangeCount += qChangeMap.get(q.question_id) || 0;

      const selected = qResp?.selected;
      if (selected && selected.trim() !== "") {
        attemptedQuestions++;
        const isCorrect = selected.trim().toUpperCase() === q.snapshot_correct_answer.trim().toUpperCase();
        if (isCorrect) {
          correctAnswers++;
          marksObtained += qMarks;
        } else {
          incorrectAnswers++;
          marksObtained -= qNeg;
          timeOnIncorrectMs += timeMs;
        }
      }
    }

    const unansweredQuestions = totalQuestions - attemptedQuestions;
    const accuracyPercentage =
      attemptedQuestions > 0
        ? Number(((correctAnswers / attemptedQuestions) * 100).toFixed(2))
        : null;

    const averageActiveTimeMs =
      attemptedQuestions > 0 ? Math.round(totalActiveTimeMs / attemptedQuestions) : 0;

    subjectMetrics.push({
      subjectId,
      subjectName: group.name,
      subjectCode: group.code,
      totalQuestions,
      attemptedQuestions,
      unansweredQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage,
      marksObtained,
      maximumMarks,
      averageActiveTimeMs,
      timeOnIncorrectMs,
      answerChangeCount,
      firstVsFinalMarksImpact,
    });
  }

  return subjectMetrics;
}

export function calculateTopicAnalytics(
  input: AnalyticsCalculationInput
): TopicMetric[] {
  const { questions, responses, events } = input;

  const responseMap = new Map<string, { selected: string | null; activeMs: number }>();
  for (const r of responses) {
    responseMap.set(r.question_id, {
      selected: r.selected_option,
      activeMs: Number(r.active_time_ms || 0),
    });
  }

  // Group by Topic
  const topicGroups = new Map<
    string,
    {
      subjectCode?: string;
      questions: typeof questions;
    }
  >();

  for (const q of questions) {
    const topic = q.topic?.trim() || "Uncategorized";
    if (!topicGroups.has(topic)) {
      topicGroups.set(topic, { subjectCode: q.subject_code, questions: [] });
    }
    topicGroups.get(topic)!.questions.push(q);
  }

  const topicMetrics: TopicMetric[] = [];

  for (const [topic, group] of topicGroups.entries()) {
    let totalQuestions = group.questions.length;
    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let totalActiveTimeMs = 0;
    let timeAboveBenchmarkSeconds = 0;

    for (const q of group.questions) {
      const qResp = responseMap.get(q.question_id);
      const timeMs = qResp ? qResp.activeMs : 0;
      totalActiveTimeMs += timeMs;

      if (q.snapshot_benchmark_seconds) {
        const spentSec = Math.round(timeMs / 1000);
        if (spentSec > q.snapshot_benchmark_seconds) {
          timeAboveBenchmarkSeconds += spentSec - q.snapshot_benchmark_seconds;
        }
      }

      const selected = qResp?.selected;
      if (selected && selected.trim() !== "") {
        attemptedQuestions++;
        const isCorrect = selected.trim().toUpperCase() === q.snapshot_correct_answer.trim().toUpperCase();
        if (isCorrect) {
          correctAnswers++;
        } else {
          incorrectAnswers++;
        }
      }
    }

    const accuracyPercentage =
      attemptedQuestions > 0
        ? Number(((correctAnswers / attemptedQuestions) * 100).toFixed(2))
        : null;

    const averageActiveTimeMs =
      attemptedQuestions > 0 ? Math.round(totalActiveTimeMs / attemptedQuestions) : 0;

    // Topic classification
    let classification: TopicProficiency = "INSUFFICIENT_DATA";
    let evidence = `Evaluated on ${attemptedQuestions} attempted question(s).`;

    if (attemptedQuestions >= 3) {
      if (accuracyPercentage !== null && accuracyPercentage >= 75) {
        classification = "STRONG";
        evidence = `High accuracy of ${accuracyPercentage}% across ${attemptedQuestions} questions.`;
      } else if (accuracyPercentage !== null && accuracyPercentage <= 40) {
        classification = "NEEDS_ATTENTION";
        evidence = `Low accuracy of ${accuracyPercentage}% with ${incorrectAnswers} error(s). Review core concepts.`;
      } else {
        classification = "IMPROVING";
        evidence = `Moderate accuracy of ${accuracyPercentage}%. Consistent practice recommended.`;
      }
    } else {
      evidence = `At least 3 questions in this topic are required for definitive classification (found ${attemptedQuestions}).`;
    }

    topicMetrics.push({
      topic,
      subjectCode: group.subjectCode,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage,
      averageActiveTimeMs,
      timeAboveBenchmarkSeconds,
      correctToIncorrectChanges: 0,
      incorrectToCorrectChanges: 0,
      classification,
      evidence,
    });
  }

  return topicMetrics;
}
