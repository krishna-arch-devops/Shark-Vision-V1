import {
  AttemptEvent,
  AttemptResponse,
} from "@/types/database";
import {
  ReconstructedReplayEvent,
  ReplayQuestionDetails,
  ExamReplayData,
} from "../types/replay";

export function reconstructExamTimeline(params: {
  attemptId: string;
  examTitle: string;
  examCategory: string;
  startedAt: string;
  submittedAt: string | null;
  events: AttemptEvent[];
  responses: AttemptResponse[];
  questions: Array<{
    question_id: string;
    question_order: number;
    marks: number;
    negative_marks: number;
    snapshot_text: string;
    snapshot_options: any;
    snapshot_image_url?: string | null;
    snapshot_correct_answer?: string;
    snapshot_explanation?: string | null;
    topic?: string;
    subject_name?: string;
  }>;
  resultsReleased: boolean;
}): ExamReplayData {
  const {
    attemptId,
    examTitle,
    examCategory,
    startedAt,
    submittedAt,
    events,
    responses,
    questions,
    resultsReleased,
  } = params;

  const startMs = new Date(startedAt).getTime();
  const endMs = submittedAt ? new Date(submittedAt).getTime() : Date.now();
  const totalDurationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

  // Map question metadata
  const questionMap: Record<string, ReplayQuestionDetails> = {};
  const questionOrderMap = new Map<string, number>();

  for (const q of questions) {
    questionOrderMap.set(q.question_id, q.question_order);
    questionMap[q.question_id] = {
      questionId: q.question_id,
      questionOrder: q.question_order,
      marks: Number(q.marks),
      negativeMarks: Number(q.negative_marks),
      questionText: q.snapshot_text,
      options: q.snapshot_options,
      imageUrl: q.snapshot_image_url,
      topic: q.topic,
      subjectName: q.subject_name,
      finalAnswer: null,
      isCorrect: null,
      correctAnswer: resultsReleased ? q.snapshot_correct_answer : null,
      explanation: resultsReleased ? q.snapshot_explanation : null,
      totalActiveTimeMs: 0,
      visitCount: 0,
      changeCount: 0,
    };
  }

  // Populate final response outcomes
  for (const r of responses) {
    if (questionMap[r.question_id]) {
      const q = questionMap[r.question_id];
      q.finalAnswer = r.selected_option;
      q.totalActiveTimeMs = Number(r.active_time_ms || 0);

      if (resultsReleased && q.correctAnswer && r.selected_option) {
        q.isCorrect =
          r.selected_option.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      } else if (resultsReleased && !r.selected_option) {
        q.isCorrect = false;
      }
    }
  }

  // Sort events strictly by sequenceNum and timestamp
  const sortedEvents = [...events].sort((a, b) => {
    if (a.client_sequence_num !== b.client_sequence_num) {
      return a.client_sequence_num - b.client_sequence_num;
    }
    return new Date(a.client_timestamp).getTime() - new Date(b.client_timestamp).getTime();
  });

  // Track answer state dynamically as we walk the timeline
  const answerStateMap = new Map<string, string | null>();
  const timelineEvents: ReconstructedReplayEvent[] = [];

  for (const ev of sortedEvents) {
    const evTime = new Date(ev.client_timestamp).getTime();
    const elapsedSeconds = Math.max(0, Math.round((evTime - startMs) / 1000));
    const qOrder = ev.question_id ? questionOrderMap.get(ev.question_id) || null : null;

    let description = "";
    let recordedAnswerAtPoint: string | null = null;
    let dwellMs: number | undefined;

    if (ev.question_id) {
      const qMeta = questionMap[ev.question_id];

      if (ev.event_type === "QUESTION_OPENED") {
        description = `Opened Question ${qOrder}`;
        if (qMeta) qMeta.visitCount += 1;
      } else if (ev.event_type === "QUESTION_REVISITED") {
        description = `Revisited Question ${qOrder}`;
        if (qMeta) qMeta.visitCount += 1;
      } else if (ev.event_type === "QUESTION_LEFT") {
        dwellMs = (ev.payload as any)?.dwellMs;
        const dwellSec = dwellMs ? Math.round(dwellMs / 1000) : 0;
        description = `Left Question ${qOrder} after ${dwellSec}s active dwell`;
      } else if (ev.event_type === "ANSWER_SELECTED") {
        const opt = (ev.payload as any)?.toOption || (ev.payload as any)?.selectedOption;
        answerStateMap.set(ev.question_id, opt);
        recordedAnswerAtPoint = opt;
        description = `Selected Option ${opt} on Question ${qOrder}`;
      } else if (ev.event_type === "ANSWER_CHANGED") {
        const fromOpt = (ev.payload as any)?.fromOption;
        const toOpt = (ev.payload as any)?.toOption;
        answerStateMap.set(ev.question_id, toOpt);
        recordedAnswerAtPoint = toOpt;
        description = `Changed answer from ${fromOpt} to ${toOpt} on Question ${qOrder}`;
        if (qMeta) qMeta.changeCount += 1;
      } else if (ev.event_type === "ANSWER_CLEARED") {
        answerStateMap.set(ev.question_id, null);
        description = `Cleared response on Question ${qOrder}`;
        if (qMeta) qMeta.changeCount += 1;
      } else if (ev.event_type === "QUESTION_MARKED_FOR_REVIEW") {
        description = `Marked Question ${qOrder} for review`;
      } else if (ev.event_type === "QUESTION_UNMARKED_FOR_REVIEW") {
        description = `Unmarked Question ${qOrder} for review`;
      } else if (ev.event_type === "TAB_HIDDEN") {
        description = `Browser tab minimized or switched away from Question ${qOrder}`;
      } else if (ev.event_type === "TAB_VISIBLE") {
        description = `Returned to Question ${qOrder}`;
      }
    } else {
      if (ev.event_type === "EXAM_STARTED") {
        description = "Examination officially started";
      } else if (ev.event_type === "EXAM_SUBMITTED") {
        description = "Submitted examination manually";
      } else if (ev.event_type === "EXAM_AUTO_SUBMITTED") {
        description = "Examination automatically submitted at deadline";
      }
    }

    if (!recordedAnswerAtPoint && ev.question_id) {
      recordedAnswerAtPoint = answerStateMap.get(ev.question_id) || null;
    }

    timelineEvents.push({
      id: ev.id,
      sequenceNum: ev.client_sequence_num,
      eventType: ev.event_type,
      timestamp: ev.client_timestamp,
      elapsedSeconds,
      questionId: ev.question_id || null,
      questionOrder: qOrder,
      topic: ev.question_id ? questionMap[ev.question_id]?.topic : undefined,
      subjectName: ev.question_id ? questionMap[ev.question_id]?.subjectName : undefined,
      recordedAnswerAtPoint: recordedAnswerAtPoint ?? null,
      description: description || ev.event_type.replace(/_/g, " "),
      dwellMs,
      payload: ev.payload,
    });
  }

  return {
    attemptId,
    examTitle,
    examCategory,
    startedAt,
    submittedAt,
    totalDurationSeconds,
    timelineEvents,
    questions: questionMap,
    totalQuestions: questions.length,
    resultsReleased,
  };
}
