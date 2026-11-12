import {
  PerformanceOverview,
  AnswerChangeSummary,
  SpeedAccuracyMatrix,
  SubjectMetric,
  ParentSummaryReport,
} from "../types";

export function generateParentSummary(params: {
  studentName: string;
  performance: PerformanceOverview;
  answerChanges: AnswerChangeSummary;
  speedAccuracy: SpeedAccuracyMatrix;
  subjects: SubjectMetric[];
}): ParentSummaryReport {
  const { studentName, performance, answerChanges, speedAccuracy, subjects } = params;

  const summaryParagraphs: string[] = [];

  // 1. Overall Completion & Accuracy in plain English
  summaryParagraphs.push(
    `${studentName} completed the examination, scoring ${performance.marksObtained} marks out of a total possible ${performance.maximumMarks}.`
  );

  if (performance.attemptedQuestions > 0) {
    summaryParagraphs.push(
      `Out of ${performance.totalQuestions} questions, ${studentName} attempted ${performance.attemptedQuestions} and answered ${performance.correctAnswers} correctly (${performance.accuracyPercentage}% accuracy).`
    );
  } else {
    summaryParagraphs.push(
      `None of the ${performance.totalQuestions} questions were attempted in this test session.`
    );
  }

  // 2. Identify Strongest and Attention Subjects
  let strengthStatement: string | null = null;
  let attentionStatement: string | null = null;

  const validSubjects = subjects.filter((s) => s.attemptedQuestions > 0);
  if (validSubjects.length > 0) {
    const sortedByAcc = [...validSubjects].sort(
      (a, b) => (b.accuracyPercentage || 0) - (a.accuracyPercentage || 0)
    );
    const best = sortedByAcc[0];
    const weakest = sortedByAcc[sortedByAcc.length - 1];

    if (best.accuracyPercentage !== null && best.accuracyPercentage >= 60) {
      strengthStatement = `${studentName} showed strongest conceptual accuracy in ${best.subjectName} (${best.accuracyPercentage}%).`;
    }

    if (weakest.accuracyPercentage !== null && weakest.accuracyPercentage < 50) {
      attentionStatement = `Additional guided revision is recommended in ${weakest.subjectName} (${weakest.accuracyPercentage}% accuracy).`;
    }
  }

  // 3. Time Management Observation
  let timeManagementObservation: string | null = null;
  if (speedAccuracy.slowIncorrectCount > 0) {
    timeManagementObservation = `${studentName} spent extra time on ${speedAccuracy.slowIncorrectCount} questions that were answered incorrectly. Working on quicker question-skipping will save valuable exam minutes.`;
  } else if (performance.attemptedQuestions > 0) {
    const avgSec = Math.round(performance.averageActiveTimePerAttemptedMs / 1000);
    timeManagementObservation = `${studentName} maintained steady pace discipline, averaging ${avgSec} seconds per question.`;
  }

  // 4. Data Sufficiency
  const dataSufficiencyNote =
    "This summary is generated from verified time-stamped examination responses. Consistent test practice over multiple examinations provides more comprehensive growth trends.";

  return {
    summaryParagraphs,
    strengthStatement,
    attentionStatement,
    timeManagementObservation,
    dataSufficiencyNote,
  };
}
