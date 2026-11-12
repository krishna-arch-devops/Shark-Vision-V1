import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { profiles, examinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateSpeedAccuracyMatrix } from "@/features/analytics/calculators/speed-accuracy-calculator";

describe("Local End-to-End Exam Engine Lifecycle on PostgreSQL 16", () => {
  let studentId: string;
  let examinationId: string;

  beforeAll(async () => {
    // 1. Verify seeded student Kabir in PostgreSQL
    const [student] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, "student.kabir@sharkvision.com"))
      .limit(1);
    expect(student).toBeDefined();
    studentId = student.id;

    // 2. Verify seeded 50-question mock exam in PostgreSQL
    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.title, "All-India JEE Main & Advanced Grand Benchmark Test - 01"))
      .limit(1);
    expect(exam).toBeDefined();
    examinationId = exam.id;
  });

  it("should verify 50-question mock exam parameters in PostgreSQL", async () => {
    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examinationId))
      .limit(1);

    expect(exam.title).toBe("All-India JEE Main & Advanced Grand Benchmark Test - 01");
    expect(exam.durationMinutes).toBe(180);
    expect(Number(exam.totalMarks)).toBe(200);
    expect(exam.category).toBe("JEE_MAIN");
  });

  it("should calculate speed-accuracy matrix deterministically for 50 questions", () => {
    const mockInput = {
      attemptId: "test-attempt-50",
      durationMinutes: 180,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      submittedAt: new Date().toISOString(),
      questions: Array.from({ length: 50 }, (_, i) => ({
        question_id: `q-${i + 1}`,
        question_order: i + 1,
        marks: 4,
        negative_marks: 1,
        snapshot_text: `Question ${i + 1}`,
        snapshot_options: [],
        snapshot_correct_answer: "A",
        snapshot_benchmark_seconds: 120,
      })),
      responses: Array.from({ length: 50 }, (_, i) => ({
        id: `r-${i + 1}`,
        attempt_id: "test-attempt-50",
        question_id: `q-${i + 1}`,
        selected_option: i % 2 === 0 ? "A" : "B",
        is_marked_for_review: false,
        is_visited: true,
        active_time_ms: (i + 1) * 30000,
        last_visited_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      events: [],
    };

    const matrix = calculateSpeedAccuracyMatrix(mockInput as any);
    expect(matrix).toBeDefined();
    expect(matrix.items.length).toBe(50);
    expect(
      matrix.fastCorrectCount +
        matrix.slowCorrectCount +
        matrix.fastIncorrectCount +
        matrix.slowIncorrectCount
    ).toBe(50);
  });
});
