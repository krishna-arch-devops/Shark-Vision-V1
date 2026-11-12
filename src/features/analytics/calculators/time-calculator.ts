import { AnalyticsCalculationInput } from "../domain/input-types";
import {
  QuestionTimeAnalysis,
  TimeIntelligenceSummary,
  MeasurementQuality,
} from "../types";

export function calculateTimeIntelligence(
  input: AnalyticsCalculationInput
): TimeIntelligenceSummary {
  const { questions, responses, events } = input;

  // Group events by question
  const questionEventsMap = new Map<string, typeof events>();
  for (const ev of events) {
    if (ev.question_id) {
      if (!questionEventsMap.has(ev.question_id)) {
        questionEventsMap.set(ev.question_id, []);
      }
      questionEventsMap.get(ev.question_id)!.push(ev);
    }
  }

  const responseMap = new Map<string, { selected: string | null; activeMs: number }>();
  for (const r of responses) {
    responseMap.set(r.question_id, {
      selected: r.selected_option,
      activeMs: Number(r.active_time_ms || 0),
    });
  }

  const questionAnalyses: QuestionTimeAnalysis[] = [];
  let totalActiveTimeCorrectMs = 0;
  let totalActiveTimeIncorrectMs = 0;
  let totalActiveTimeUnansweredMs = 0;

  for (const q of questions) {
    const qResp = responseMap.get(q.question_id);
    const totalActiveTimeMs = qResp ? qResp.activeMs : 0;
    const isAttempted = !!(qResp?.selected && qResp.selected.trim() !== "");
    const isCorrect = isAttempted && qResp!.selected!.toUpperCase() === q.snapshot_correct_answer.toUpperCase();

    if (!isAttempted) {
      totalActiveTimeUnansweredMs += totalActiveTimeMs;
    } else if (isCorrect) {
      totalActiveTimeCorrectMs += totalActiveTimeMs;
    } else {
      totalActiveTimeIncorrectMs += totalActiveTimeMs;
    }

    // Inspect events for visits and first selection timing
    const qEvents = questionEventsMap.get(q.question_id) || [];
    // Sort events by sequence num
    qEvents.sort((a, b) => a.client_sequence_num - b.client_sequence_num);

    const openEvents = qEvents.filter(
      (e) => e.event_type === "QUESTION_OPENED" || e.event_type === "QUESTION_REVISITED"
    );
    const leaveEvents = qEvents.filter((e) => e.event_type === "QUESTION_LEFT");

    const visitCount = Math.max(1, openEvents.length || (totalActiveTimeMs > 0 ? 1 : 0));

    // Calculate individual visit durations from payload dwellMs where present
    const visitDurations: number[] = [];
    for (const le of leaveEvents) {
      if (le.payload && typeof (le.payload as any).dwellMs === "number") {
        visitDurations.push((le.payload as any).dwellMs);
      }
    }

    const longestVisitDurationMs =
      visitDurations.length > 0 ? Math.max(...visitDurations) : totalActiveTimeMs;
    const firstVisitDurationMs = visitDurations.length > 0 ? visitDurations[0] : totalActiveTimeMs;
    const averageTimePerVisitMs = Math.round(totalActiveTimeMs / visitCount);

    // Calculate time spent during revisits
    const timeSpentDuringRevisitsMs =
      visitDurations.length > 1
        ? visitDurations.slice(1).reduce((sum, d) => sum + d, 0)
        : 0;

    // Time before first answer selection
    const firstSelectionEvent = qEvents.find((e) => e.event_type === "ANSWER_SELECTED");
    let timeBeforeFirstSelectionMs: number | null = null;
    let activeTimeAfterFirstSelectionMs: number | null = null;

    if (firstSelectionEvent) {
      // Find dwell prior to this event
      const prevLeaveEvents = leaveEvents.filter(
        (e) => e.client_sequence_num < firstSelectionEvent.client_sequence_num
      );
      const dwellBefore = prevLeaveEvents.reduce(
        (sum, e) => sum + (Number((e.payload as any)?.dwellMs) || 0),
        0
      );
      timeBeforeFirstSelectionMs = Math.min(totalActiveTimeMs, dwellBefore);
      activeTimeAfterFirstSelectionMs = Math.max(0, totalActiveTimeMs - timeBeforeFirstSelectionMs);
    }

    questionAnalyses.push({
      questionId: q.question_id,
      totalActiveTimeMs,
      visitCount,
      averageTimePerVisitMs,
      longestVisitDurationMs,
      firstVisitDurationMs,
      timeBeforeFirstSelectionMs,
      activeTimeAfterFirstSelectionMs,
      timeSpentDuringRevisitsMs,
    });
  }

  const measurementQuality: MeasurementQuality =
    events.length > 0 ? "COMPLETE" : responses.length > 0 ? "PARTIAL" : "UNAVAILABLE";

  return {
    questions: questionAnalyses,
    totalActiveTimeCorrectMs,
    totalActiveTimeIncorrectMs,
    totalActiveTimeUnansweredMs,
    measurementQuality,
  };
}
