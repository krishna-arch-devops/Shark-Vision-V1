import { AttemptEvent, AttemptResponse } from "@/types/database";

export interface RawExamSnapshotQuestion {
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  snapshot_text: string;
  snapshot_options: any;
  snapshot_correct_answer: string;
  snapshot_explanation?: string | null;
  snapshot_benchmark_seconds?: number | null;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  topic?: string;
}

export interface AnalyticsCalculationInput {
  attemptId: string;
  durationMinutes: number;
  startedAt: string;
  submittedAt: string | null;
  questions: RawExamSnapshotQuestion[];
  responses: AttemptResponse[];
  events: AttemptEvent[];
}
