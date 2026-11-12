import { AnalyticsCalculationInput } from "../domain/input-types";
import {
  QuestionSpeedAccuracyItem,
  SpeedAccuracyMatrix,
  SpeedAccuracyCategory,
} from "../types";

export function calculateSpeedAccuracyMatrix(
  input: AnalyticsCalculationInput
): SpeedAccuracyMatrix {
  const { questions, responses } = input;

  const responseMap = new Map<string, { selected: string | null; activeMs: number }>();
  for (const r of responses) {
    responseMap.set(r.question_id, {
      selected: r.selected_option,
      activeMs: Number(r.active_time_ms || 0),
    });
  }

  let fastCorrectCount = 0;
  let slowCorrectCount = 0;
  let fastIncorrectCount = 0;
  let slowIncorrectCount = 0;
  let unansweredCount = 0;
  let unknownSpeedCount = 0;

  const items: QuestionSpeedAccuracyItem[] = [];

  for (const q of questions) {
    const qResp = responseMap.get(q.question_id);
    const activeTimeSeconds = qResp ? Math.round(qResp.activeMs / 1000) : 0;
    const isAttempted = !!(qResp?.selected && qResp.selected.trim() !== "");
    const isCorrect =
      isAttempted &&
      qResp!.selected!.trim().toUpperCase() === q.snapshot_correct_answer.trim().toUpperCase();

    const benchmarkSeconds = q.snapshot_benchmark_seconds || null;
    const benchmarkSource = benchmarkSeconds ? "TEACHER" : "NONE";

    let category: SpeedAccuracyCategory = "UNKNOWN";
    let timeDeltaFromBenchmarkSeconds: number | null = null;

    if (!isAttempted) {
      category = "UNANSWERED";
      unansweredCount++;
    } else if (benchmarkSeconds === null) {
      category = "UNKNOWN";
      unknownSpeedCount++;
    } else {
      timeDeltaFromBenchmarkSeconds = activeTimeSeconds - benchmarkSeconds;
      const isFast = activeTimeSeconds <= benchmarkSeconds;

      if (isFast && isCorrect) {
        category = "FAST_CORRECT";
        fastCorrectCount++;
      } else if (!isFast && isCorrect) {
        category = "SLOW_CORRECT";
        slowCorrectCount++;
      } else if (isFast && !isCorrect) {
        category = "FAST_INCORRECT";
        fastIncorrectCount++;
      } else {
        category = "SLOW_INCORRECT";
        slowIncorrectCount++;
      }
    }

    items.push({
      questionId: q.question_id,
      activeTimeSeconds,
      benchmarkSeconds,
      benchmarkSource,
      isCorrect,
      isAttempted,
      category,
      timeDeltaFromBenchmarkSeconds,
    });
  }

  return {
    fastCorrectCount,
    slowCorrectCount,
    fastIncorrectCount,
    slowIncorrectCount,
    unansweredCount,
    unknownSpeedCount,
    items,
  };
}
