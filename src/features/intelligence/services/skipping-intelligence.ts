import { AnalyticsCalculationInput } from "@/features/analytics/domain/input-types";

export interface SkippingIntelligenceReport {
  unansweredCount: number;
  totalTimeOnUnansweredSeconds: number;
  questionsExceedingTargetCount: number;
  timeSpentOnIncorrectSeconds: number;
  questionsRevisitedCount: number;
  timeSpentOnRevisitsSeconds: number;
  abandonedQuestionsCount: number; // Questions visited >= 2 times but left unanswered
  skippingEfficiencyIndex: number; // 0 - 100 percentage based on pacing discipline
  actionableInsights: string[];
}

export function calculateSkippingIntelligence(
  input: AnalyticsCalculationInput
): SkippingIntelligenceReport {
  const { questions, responses, events } = input;

  const responseMap = new Map<string, { selected: string | null; activeMs: number }>();
  for (const r of responses) {
    responseMap.set(r.question_id, {
      selected: r.selected_option,
      activeMs: Number(r.active_time_ms || 0),
    });
  }

  // Group events to check visit counts
  const visitCountMap = new Map<string, number>();
  for (const ev of events) {
    if (ev.question_id && (ev.event_type === "QUESTION_OPENED" || ev.event_type === "QUESTION_REVISITED")) {
      visitCountMap.set(ev.question_id, (visitCountMap.get(ev.question_id) || 0) + 1);
    }
  }

  let unansweredCount = 0;
  let totalTimeOnUnansweredSeconds = 0;
  let questionsExceedingTargetCount = 0;
  let timeSpentOnIncorrectSeconds = 0;
  let questionsRevisitedCount = 0;
  let abandonedQuestionsCount = 0;

  for (const q of questions) {
    const qResp = responseMap.get(q.question_id);
    const activeSec = qResp ? Math.round(qResp.activeMs / 1000) : 0;
    const isAttempted = !!(qResp?.selected && qResp.selected.trim() !== "");
    const visits = visitCountMap.get(q.question_id) || (activeSec > 0 ? 1 : 0);

    if (visits > 1) {
      questionsRevisitedCount++;
    }

    if (!isAttempted) {
      unansweredCount++;
      totalTimeOnUnansweredSeconds += activeSec;
      if (visits >= 2 && activeSec > 30) {
        abandonedQuestionsCount++;
      }
    } else {
      const isCorrect =
        qResp!.selected!.trim().toUpperCase() === q.snapshot_correct_answer.trim().toUpperCase();
      if (!isCorrect) {
        timeSpentOnIncorrectSeconds += activeSec;
      }
    }

    if (q.snapshot_benchmark_seconds && activeSec > q.snapshot_benchmark_seconds) {
      questionsExceedingTargetCount++;
    }
  }

  const actionableInsights: string[] = [];

  if (totalTimeOnUnansweredSeconds >= 180) {
    actionableInsights.push(
      `You invested ${Math.round(totalTimeOnUnansweredSeconds / 60)} minutes across ${unansweredCount} questions that were eventually left blank. Consider skipping earlier to preserve stamina for high-yield questions.`
    );
  }

  if (questionsExceedingTargetCount >= 3) {
    actionableInsights.push(
      `${questionsExceedingTargetCount} questions exceeded their configured target-solving benchmark durations.`
    );
  }

  if (abandonedQuestionsCount >= 1) {
    actionableInsights.push(
      `${abandonedQuestionsCount} questions were revisited multiple times but ultimately abandoned without a final response.`
    );
  }

  if (actionableInsights.length === 0) {
    actionableInsights.push(
      "Clean pacing allocation: No excessive dwell was abandoned on unanswered problems."
    );
  }

  // Calculate an objective efficiency index (penalize excessive dwell on unattempted questions)
  const penalty = Math.min(50, Math.round(totalTimeOnUnansweredSeconds / 20));
  const skippingEfficiencyIndex = Math.max(50, 100 - penalty);

  return {
    unansweredCount,
    totalTimeOnUnansweredSeconds,
    questionsExceedingTargetCount,
    timeSpentOnIncorrectSeconds,
    questionsRevisitedCount,
    timeSpentOnRevisitsSeconds: 0,
    abandonedQuestionsCount,
    skippingEfficiencyIndex,
    actionableInsights,
  };
}
