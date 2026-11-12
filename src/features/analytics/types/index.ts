export type MeasurementQuality = "COMPLETE" | "PARTIAL" | "UNAVAILABLE";

export type SpeedAccuracyCategory =
  | "FAST_CORRECT"
  | "SLOW_CORRECT"
  | "FAST_INCORRECT"
  | "SLOW_INCORRECT"
  | "UNANSWERED"
  | "UNKNOWN";

export type AnswerChangeClassification =
  | "NO_CHANGE"
  | "CORRECT_TO_INCORRECT"
  | "INCORRECT_TO_CORRECT"
  | "CORRECT_TO_CORRECT"
  | "INCORRECT_TO_INCORRECT"
  | "CHANGED_TO_UNANSWERED"
  | "UNANSWERED_TO_ANSWERED";

export type TopicProficiency =
  | "STRONG"
  | "IMPROVING"
  | "NEEDS_ATTENTION"
  | "INSUFFICIENT_DATA";

// 1. Performance Overview Contract
export interface PerformanceOverview {
  attemptId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  unansweredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  marksObtained: number;
  maximumMarks: number;
  percentageScore: number;
  accuracyPercentage: number | null; // null if 0 attempted
  durationMinutes: number;
  actualActiveExamTimeMs: number;
  totalRecordedQuestionTimeMs: number;
  averageActiveTimePerAttemptedMs: number;
  medianQuestionTimeMs: number;
  fastestAttemptedQuestion: { questionId: string; activeTimeMs: number } | null;
  slowestAttemptedQuestion: { questionId: string; activeTimeMs: number } | null;
  measurementQuality: MeasurementQuality;
}

// 2. Question-Level Time Intelligence
export interface QuestionTimeAnalysis {
  questionId: string;
  totalActiveTimeMs: number;
  visitCount: number;
  averageTimePerVisitMs: number;
  longestVisitDurationMs: number;
  firstVisitDurationMs: number;
  timeBeforeFirstSelectionMs: number | null;
  activeTimeAfterFirstSelectionMs: number | null;
  timeSpentDuringRevisitsMs: number;
}

export interface TimeIntelligenceSummary {
  questions: QuestionTimeAnalysis[];
  totalActiveTimeCorrectMs: number;
  totalActiveTimeIncorrectMs: number;
  totalActiveTimeUnansweredMs: number;
  measurementQuality: MeasurementQuality;
}

// 3. Question-Level Answer Change Analysis
export interface QuestionAnswerChangeAnalysis {
  questionId: string;
  firstSelectedOption: string | null;
  finalAcceptedOption: string | null;
  changeCount: number;
  clearCount: number;
  changedDuringRevisit: boolean;
  classification: AnswerChangeClassification;
  firstAnswerCorrect: boolean;
  finalAnswerCorrect: boolean;
  firstAnswerScore: number;
  actualFinalScore: number;
  marksDelta: number; // actualFinalScore - firstAnswerScore
}

export interface AnswerChangeSummary {
  questions: QuestionAnswerChangeAnalysis[];
  totalAnswerChanges: number;
  totalAnswerClears: number;
  marksGainedFromChanges: number;
  marksLostFromChanges: number;
  netImpactMarks: number;
  actualTotalScore: number;
  hypotheticalFirstAnswerScore: number;
  retainedFirstAnswerDelta: number; // hypotheticalFirstAnswerScore - actualTotalScore
}

// 4. Speed vs Accuracy Item
export interface QuestionSpeedAccuracyItem {
  questionId: string;
  activeTimeSeconds: number;
  benchmarkSeconds: number | null;
  benchmarkSource: "TEACHER" | "HISTORICAL" | "NONE";
  isCorrect: boolean;
  isAttempted: boolean;
  category: SpeedAccuracyCategory;
  timeDeltaFromBenchmarkSeconds: number | null;
}

export interface SpeedAccuracyMatrix {
  fastCorrectCount: number;
  slowCorrectCount: number;
  fastIncorrectCount: number;
  slowIncorrectCount: number;
  unansweredCount: number;
  unknownSpeedCount: number;
  items: QuestionSpeedAccuracyItem[];
}

// 5. Subject Analytics
export interface SubjectMetric {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalQuestions: number;
  attemptedQuestions: number;
  unansweredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number | null;
  marksObtained: number;
  maximumMarks: number;
  averageActiveTimeMs: number;
  timeOnIncorrectMs: number;
  answerChangeCount: number;
  firstVsFinalMarksImpact: number;
}

// 6. Topic Analytics
export interface TopicMetric {
  topic: string;
  subjectCode?: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number | null;
  averageActiveTimeMs: number;
  timeAboveBenchmarkSeconds: number;
  correctToIncorrectChanges: number;
  incorrectToCorrectChanges: number;
  classification: TopicProficiency;
  evidence: string;
}

// 7. Evidence-Based Recommendation
export interface RecommendationItem {
  ruleId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  explanation: string;
  supportingMetricIds: string[];
  relevantReferences: string[]; // Question IDs or Topics
  suggestedAction: string;
  dataQuality: MeasurementQuality;
}

// 8. Parent-Friendly Summary
export interface ParentSummaryReport {
  summaryParagraphs: string[];
  strengthStatement: string | null;
  attentionStatement: string | null;
  timeManagementObservation: string | null;
  dataSufficiencyNote: string;
}

// 9. Longitudinal Progress Metrics
export interface LongitudinalProgressTrend {
  totalExaminationsAnalyzed: number;
  recentAttempts: Array<{
    attemptId: string;
    examinationTitle: string;
    submittedAt: string;
    percentageScore: number;
    accuracyPercentage: number | null;
    averageTimePerQuestionMs: number;
    isComparable: boolean;
    comparabilityNote?: string;
  }>;
  accuracyTrendDeltaPercentagePoints: number | null; // e.g. +7 percentage points
  speedTrendDeltaSeconds: number | null;
}

// Aggregate Full Analytics Report
export interface CompleteAttemptAnalytics {
  attemptId: string;
  schemaVersion: number;
  calculatedAt: string;
  measurementQuality: MeasurementQuality;
  performanceOverview: PerformanceOverview;
  timeIntelligence: TimeIntelligenceSummary;
  answerChangeIntelligence: AnswerChangeSummary;
  speedAccuracyMatrix: SpeedAccuracyMatrix;
  subjectAnalytics: SubjectMetric[];
  topicAnalytics: TopicMetric[];
  recommendations: RecommendationItem[];
  parentSummary: ParentSummaryReport;
}
