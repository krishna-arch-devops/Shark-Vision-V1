import { AttemptEvent, QuestionOptionItem } from "@/types/database";

export interface ReconstructedReplayEvent {
  id: string;
  sequenceNum: number;
  eventType: string;
  timestamp: string;
  elapsedSeconds: number; // Seconds since exam start
  questionId: string | null;
  questionOrder: number | null;
  topic?: string;
  subjectName?: string;
  recordedAnswerAtPoint: string | null;
  description: string;
  dwellMs?: number;
  payload?: Record<string, unknown>;
}

export interface ReplayQuestionDetails {
  questionId: string;
  questionOrder: number;
  marks: number;
  negativeMarks: number;
  questionText: string;
  options: QuestionOptionItem[];
  imageUrl?: string | null;
  topic?: string;
  subjectName?: string;
  finalAnswer: string | null;
  isCorrect?: boolean | null; // null if unreleased
  correctAnswer?: string | null; // null if unreleased
  explanation?: string | null; // null if unreleased
  totalActiveTimeMs: number;
  visitCount: number;
  changeCount: number;
}

export interface ExamReplayData {
  attemptId: string;
  examTitle: string;
  examCategory: string;
  startedAt: string;
  submittedAt: string | null;
  totalDurationSeconds: number;
  timelineEvents: ReconstructedReplayEvent[];
  questions: Record<string, ReplayQuestionDetails>;
  totalQuestions: number;
  resultsReleased: boolean;
}
