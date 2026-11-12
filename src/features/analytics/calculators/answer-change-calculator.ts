import { AnalyticsCalculationInput } from "../domain/input-types";
import {
  QuestionAnswerChangeAnalysis,
  AnswerChangeSummary,
  AnswerChangeClassification,
} from "../types";

export function calculateAnswerChangeIntelligence(
  input: AnalyticsCalculationInput
): AnswerChangeSummary {
  const { questions, responses, events } = input;

  const responseMap = new Map<string, string | null>();
  for (const r of responses) {
    responseMap.set(r.question_id, r.selected_option);
  }

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

  const questionAnalyses: QuestionAnswerChangeAnalysis[] = [];

  let totalAnswerChanges = 0;
  let totalAnswerClears = 0;
  let marksGainedFromChanges = 0;
  let marksLostFromChanges = 0;

  let actualTotalScore = 0;
  let hypotheticalFirstAnswerScore = 0;

  for (const q of questions) {
    const qMarks = Number(q.marks || 4);
    const qNeg = Number(q.negative_marks || 1);
    const correctKey = q.snapshot_correct_answer.trim().toUpperCase();

    const finalAcceptedOption = responseMap.get(q.question_id) || null;
    const finalClean = finalAcceptedOption ? finalAcceptedOption.trim().toUpperCase() : null;
    const finalAnswerCorrect = finalClean === correctKey;

    // Actual score on this question
    let actualFinalScore = 0;
    if (finalClean) {
      actualFinalScore = finalAnswerCorrect ? qMarks : -qNeg;
    }
    actualTotalScore += actualFinalScore;

    // Inspect events for answer selection history
    const qEvents = questionEventsMap.get(q.question_id) || [];
    qEvents.sort((a, b) => a.client_sequence_num - b.client_sequence_num);

    let firstSelectedOption: string | null = null;
    let changeCount = 0;
    let clearCount = 0;
    let changedDuringRevisit = false;

    // Track visit state
    let visitIndex = 1;

    for (const ev of qEvents) {
      if (ev.event_type === "QUESTION_REVISITED") {
        visitIndex++;
      } else if (ev.event_type === "ANSWER_SELECTED") {
        if (!firstSelectedOption) {
          const opt = (ev.payload as any)?.toOption || (ev.payload as any)?.selectedOption;
          if (opt) firstSelectedOption = String(opt).trim().toUpperCase();
        }
      } else if (ev.event_type === "ANSWER_CHANGED") {
        changeCount++;
        totalAnswerChanges++;
        if (visitIndex > 1) {
          changedDuringRevisit = true;
        }
      } else if (ev.event_type === "ANSWER_CLEARED") {
        clearCount++;
        totalAnswerClears++;
        if (visitIndex > 1) {
          changedDuringRevisit = true;
        }
      }
    }

    // If first selection was never captured through an explicit event, use final option
    if (!firstSelectedOption && finalClean) {
      firstSelectedOption = finalClean;
    }

    const firstClean = firstSelectedOption ? firstSelectedOption.trim().toUpperCase() : null;
    const firstAnswerCorrect = firstClean === correctKey;

    // Hypothetical score if candidate retained first choice
    let firstAnswerScore = 0;
    if (firstClean) {
      firstAnswerScore = firstAnswerCorrect ? qMarks : -qNeg;
    }
    hypotheticalFirstAnswerScore += firstAnswerScore;

    // Net delta on this question (actual - first)
    const marksDelta = actualFinalScore - firstAnswerScore;
    if (marksDelta > 0) {
      marksGainedFromChanges += marksDelta;
    } else if (marksDelta < 0) {
      marksLostFromChanges += Math.abs(marksDelta);
    }

    // Classification
    let classification: AnswerChangeClassification = "NO_CHANGE";
    if (changeCount > 0 || clearCount > 0 || firstClean !== finalClean) {
      if (firstClean && !finalClean) {
        classification = "CHANGED_TO_UNANSWERED";
      } else if (!firstClean && finalClean) {
        classification = "UNANSWERED_TO_ANSWERED";
      } else if (firstAnswerCorrect && !finalAnswerCorrect) {
        classification = "CORRECT_TO_INCORRECT";
      } else if (!firstAnswerCorrect && finalAnswerCorrect) {
        classification = "INCORRECT_TO_CORRECT";
      } else if (firstAnswerCorrect && finalAnswerCorrect) {
        classification = "CORRECT_TO_CORRECT";
      } else {
        classification = "INCORRECT_TO_INCORRECT";
      }
    }

    questionAnalyses.push({
      questionId: q.question_id,
      firstSelectedOption: firstClean,
      finalAcceptedOption: finalClean,
      correctAnswer: correctKey,
      questionText: q.snapshot_text,
      options: q.snapshot_options,
      explanation: q.snapshot_explanation,
      topic: q.topic,
      changeCount,
      clearCount,
      changedDuringRevisit,
      classification,
      firstAnswerCorrect,
      finalAnswerCorrect,
      firstAnswerScore,
      actualFinalScore,
      marksDelta,
    });
  }

  const netImpactMarks = marksGainedFromChanges - marksLostFromChanges;
  const retainedFirstAnswerDelta = hypotheticalFirstAnswerScore - actualTotalScore;

  return {
    questions: questionAnalyses,
    totalAnswerChanges,
    totalAnswerClears,
    marksGainedFromChanges,
    marksLostFromChanges,
    netImpactMarks,
    actualTotalScore,
    hypotheticalFirstAnswerScore,
    retainedFirstAnswerDelta,
  };
}
