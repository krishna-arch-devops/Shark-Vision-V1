import { describe, it, expect } from "vitest";
import { calculatePerformanceOverview } from "@/features/analytics/calculators/performance-calculator";
import { calculateTimeIntelligence } from "@/features/analytics/calculators/time-calculator";
import { calculateAnswerChangeIntelligence } from "@/features/analytics/calculators/answer-change-calculator";
import { calculateSpeedAccuracyMatrix } from "@/features/analytics/calculators/speed-accuracy-calculator";
import {
  calculateSubjectAnalytics,
  calculateTopicAnalytics,
} from "@/features/analytics/calculators/subject-topic-calculator";
import { generateRecommendations } from "@/features/analytics/recommendations/recommendation-engine";
import { generateParentSummary } from "@/features/analytics/services/parent-summary-service";
import { AnalyticsCalculationInput } from "@/features/analytics/domain/input-types";

describe("Analytics Engine Pure Calculators", () => {
  const baseInput: AnalyticsCalculationInput = {
    attemptId: "att-101",
    durationMinutes: 60,
    startedAt: "2026-11-12T10:00:00Z",
    submittedAt: "2026-11-12T10:45:00Z",
    questions: [
      {
        question_id: "q1",
        question_order: 1,
        marks: 4,
        negative_marks: 1,
        snapshot_text: "Kinematics displacement",
        snapshot_options: [],
        snapshot_correct_answer: "B",
        snapshot_benchmark_seconds: 90,
        subject_id: "sub_phy",
        subject_name: "Physics",
        subject_code: "PHY",
        topic: "Kinematics",
      },
      {
        question_id: "q2",
        question_order: 2,
        marks: 4,
        negative_marks: 1,
        snapshot_text: "Thermodynamics heat engine",
        snapshot_options: [],
        snapshot_correct_answer: "C",
        snapshot_benchmark_seconds: 120,
        subject_id: "sub_phy",
        subject_name: "Physics",
        subject_code: "PHY",
        topic: "Thermodynamics",
      },
      {
        question_id: "q3",
        question_order: 3,
        marks: 4,
        negative_marks: 1,
        snapshot_text: "Chemical bonding",
        snapshot_options: [],
        snapshot_correct_answer: "A",
        snapshot_benchmark_seconds: null, // No benchmark available
        subject_id: "sub_chem",
        subject_name: "Chemistry",
        subject_code: "CHE",
        topic: "Chemical Bonding",
      },
    ],
    responses: [
      {
        id: "r1",
        attempt_id: "att-101",
        question_id: "q1",
        selected_option: "B", // Correct (+4)
        is_marked_for_review: false,
        is_visited: true,
        active_time_ms: 72000, // 72 seconds
        last_visited_at: "2026-11-12T10:15:00Z",
        updated_at: "2026-11-12T10:15:00Z",
      },
      {
        id: "r2",
        attempt_id: "att-101",
        question_id: "q2",
        selected_option: "A", // Incorrect (-1)
        is_marked_for_review: false,
        is_visited: true,
        active_time_ms: 150000, // 150 seconds (Benchmark 120s => Slow Incorrect)
        last_visited_at: "2026-11-12T10:30:00Z",
        updated_at: "2026-11-12T10:30:00Z",
      },
      {
        id: "r3",
        attempt_id: "att-101",
        question_id: "q3",
        selected_option: null, // Unanswered (0)
        is_marked_for_review: true,
        is_visited: true,
        active_time_ms: 25000,
        last_visited_at: "2026-11-12T10:40:00Z",
        updated_at: "2026-11-12T10:40:00Z",
      },
    ],
    events: [
      {
        id: "ev1",
        attempt_id: "att-101",
        student_id: "stu-1",
        question_id: "q1",
        event_type: "ANSWER_SELECTED",
        client_sequence_num: 1,
        idempotency_key: "k1",
        client_timestamp: "2026-11-12T10:02:00Z",
        server_timestamp: "2026-11-12T10:02:00Z",
        payload: { selectedOption: "B" },
        client_session_id: "s1",
        created_at: "2026-11-12T10:02:00Z",
      },
      {
        id: "ev2",
        attempt_id: "att-101",
        student_id: "stu-1",
        question_id: "q1",
        event_type: "ANSWER_CHANGED",
        client_sequence_num: 2,
        idempotency_key: "k2",
        client_timestamp: "2026-11-12T10:05:00Z",
        server_timestamp: "2026-11-12T10:05:00Z",
        payload: { fromOption: "B", toOption: "C" },
        client_session_id: "s1",
        created_at: "2026-11-12T10:05:00Z",
      },
      {
        id: "ev3",
        attempt_id: "att-101",
        student_id: "stu-1",
        question_id: "q1",
        event_type: "ANSWER_CHANGED",
        client_sequence_num: 3,
        idempotency_key: "k3",
        client_timestamp: "2026-11-12T10:08:00Z",
        server_timestamp: "2026-11-12T10:08:00Z",
        payload: { fromOption: "C", toOption: "B" },
        client_session_id: "s1",
        created_at: "2026-11-12T10:08:00Z",
      },
    ],
  };

  it("1. Performance Calculator handles marks, negatives, accuracy, and avoids divide-by-zero", () => {
    const perf = calculatePerformanceOverview(baseInput);

    expect(perf.totalQuestions).toBe(3);
    expect(perf.attemptedQuestions).toBe(2);
    expect(perf.unansweredQuestions).toBe(1);
    expect(perf.correctAnswers).toBe(1);
    expect(perf.incorrectAnswers).toBe(1);
    expect(perf.marksObtained).toBe(3); // (+4 - 1 = 3)
    expect(perf.maximumMarks).toBe(12);
    expect(perf.percentageScore).toBe(25.0);
    expect(perf.accuracyPercentage).toBe(50.0);
  });

  it("2. Mandatory Answer-Change Test: B -> C -> B sequence with 2 changes and 0 net impact", () => {
    const ac = calculateAnswerChangeIntelligence(baseInput);

    const q1 = ac.questions.find((q) => q.questionId === "q1")!;
    expect(q1.firstSelectedOption).toBe("B");
    expect(q1.finalAcceptedOption).toBe("B");
    expect(q1.changeCount).toBe(2);
    expect(q1.marksDelta).toBe(0);
    expect(q1.classification).toBe("CORRECT_TO_CORRECT");
    expect(ac.retainedFirstAnswerDelta).toBe(0);
  });

  it("3. Mandatory Benchmark Test: 150s vs 120s benchmark = 30s above benchmark and SLOW_INCORRECT", () => {
    const matrix = calculateSpeedAccuracyMatrix(baseInput);

    const q2 = matrix.items.find((i) => i.questionId === "q2")!;
    expect(q2.category).toBe("SLOW_INCORRECT");
    expect(q2.activeTimeSeconds).toBe(150);
    expect(q2.benchmarkSeconds).toBe(120);
    expect(q2.timeDeltaFromBenchmarkSeconds).toBe(30);

    // Q3 without benchmark must be UNKNOWN
    const q3 = matrix.items.find((i) => i.questionId === "q3")!;
    expect(q3.category).toBe("UNANSWERED"); // Since unattempted
  });

  it("4. Speed-versus-accuracy classification classifies unattempted without benchmark as UNANSWERED and attempted without benchmark as UNKNOWN", () => {
    const testInput: AnalyticsCalculationInput = {
      ...baseInput,
      responses: [
        {
          ...baseInput.responses[2],
          selected_option: "B", // attempted
        },
      ],
    };
    const matrix = calculateSpeedAccuracyMatrix(testInput);
    const q3 = matrix.items.find((i) => i.questionId === "q3")!;
    expect(q3.category).toBe("UNKNOWN");
  });

  it("5. Subject and Topic aggregations reconcile correctly with examination totals", () => {
    const subjects = calculateSubjectAnalytics(baseInput);
    const totalSubjectMarks = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
    expect(totalSubjectMarks).toBe(3);

    const topics = calculateTopicAnalytics(baseInput);
    const kinematics = topics.find((t) => t.topic === "Kinematics")!;
    expect(kinematics.classification).toBe("INSUFFICIENT_DATA"); // < 3 attempts
  });

  it("6. Evidence-based recommendations are deterministic without LLM", () => {
    const perf = calculatePerformanceOverview(baseInput);
    const ac = calculateAnswerChangeIntelligence(baseInput);
    const speed = calculateSpeedAccuracyMatrix(baseInput);
    const topics = calculateTopicAnalytics(baseInput);

    const recs = generateRecommendations({
      performance: perf,
      answerChanges: ac,
      speedAccuracy: speed,
      topics,
      quality: "COMPLETE",
    });

    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].ruleId).toBeDefined();
    expect(recs[0].priority).toBeDefined();
    expect(recs[0].suggestedAction).toBeDefined();
  });

  it("7. Parent Summary renders plain-English descriptions without technical jargon", () => {
    const perf = calculatePerformanceOverview(baseInput);
    const ac = calculateAnswerChangeIntelligence(baseInput);
    const speed = calculateSpeedAccuracyMatrix(baseInput);
    const subjects = calculateSubjectAnalytics(baseInput);

    const summary = generateParentSummary({
      studentName: "Aarav",
      performance: perf,
      answerChanges: ac,
      speedAccuracy: speed,
      subjects,
    });

    expect(summary.summaryParagraphs[0]).toContain("Aarav completed the examination, scoring 3 marks out of a total possible 12.");
    expect(summary.dataSufficiencyNote).toBeDefined();
  });
});
