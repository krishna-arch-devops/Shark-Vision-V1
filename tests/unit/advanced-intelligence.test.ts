import { describe, it, expect } from "vitest";
import { reconstructExamTimeline } from "@/features/intelligence/services/replay-reconstruction";
import { calculateSkippingIntelligence } from "@/features/intelligence/services/skipping-intelligence";
import { AnalyticsCalculationInput } from "@/features/analytics/domain/input-types";

describe("Advanced Performance Intelligence: Replay & Skipping Tests", () => {
  it("1. Mandatory Exam Replay Test: Timeline correctly ordered with question revisit, initial B, and final D", () => {
    // Input sequence:
    // 00:00 - Exam started
    // 00:10 - Q1 opened
    // 00:35 - B selected
    // 00:50 - Q2 opened
    // 01:40 - Q1 revisited
    // 02:00 - D selected (answer changed from B to D)
    const baseDate = "2026-11-12T10:00:00Z";

    const replay = reconstructExamTimeline({
      attemptId: "att-replay-1",
      examTitle: "JEE Mock Replay",
      examCategory: "JEE_MAIN",
      startedAt: baseDate,
      submittedAt: "2026-11-12T10:10:00Z",
      events: [
        {
          id: "e1",
          attempt_id: "att-replay-1",
          student_id: "stu-1",
          question_id: null,
          event_type: "EXAM_STARTED",
          client_sequence_num: 1,
          idempotency_key: "k1",
          client_timestamp: "2026-11-12T10:00:00Z",
          server_timestamp: "2026-11-12T10:00:00Z",
          payload: {},
          client_session_id: "s1",
          created_at: "2026-11-12T10:00:00Z",
        },
        {
          id: "e2",
          attempt_id: "att-replay-1",
          student_id: "stu-1",
          question_id: "q1",
          event_type: "QUESTION_OPENED",
          client_sequence_num: 2,
          idempotency_key: "k2",
          client_timestamp: "2026-11-12T10:00:10Z",
          server_timestamp: "2026-11-12T10:00:10Z",
          payload: {},
          client_session_id: "s1",
          created_at: "2026-11-12T10:00:10Z",
        },
        {
          id: "e3",
          attempt_id: "att-replay-1",
          student_id: "stu-1",
          question_id: "q1",
          event_type: "ANSWER_SELECTED",
          client_sequence_num: 3,
          idempotency_key: "k3",
          client_timestamp: "2026-11-12T10:00:35Z",
          server_timestamp: "2026-11-12T10:00:35Z",
          payload: { toOption: "B" },
          client_session_id: "s1",
          created_at: "2026-11-12T10:00:35Z",
        },
        {
          id: "e4",
          attempt_id: "att-replay-1",
          student_id: "stu-1",
          question_id: "q2",
          event_type: "QUESTION_OPENED",
          client_sequence_num: 4,
          idempotency_key: "k4",
          client_timestamp: "2026-11-12T10:00:50Z",
          server_timestamp: "2026-11-12T10:00:50Z",
          payload: {},
          client_session_id: "s1",
          created_at: "2026-11-12T10:00:50Z",
        },
        {
          id: "e5",
          attempt_id: "att-replay-1",
          student_id: "stu-1",
          question_id: "q1",
          event_type: "QUESTION_REVISITED",
          client_sequence_num: 5,
          idempotency_key: "k5",
          client_timestamp: "2026-11-12T10:01:40Z",
          server_timestamp: "2026-11-12T10:01:40Z",
          payload: {},
          client_session_id: "s1",
          created_at: "2026-11-12T10:01:40Z",
        },
        {
          id: "e6",
          attempt_id: "att-replay-1",
          student_id: "stu-1",
          question_id: "q1",
          event_type: "ANSWER_CHANGED",
          client_sequence_num: 6,
          idempotency_key: "k6",
          client_timestamp: "2026-11-12T10:02:00Z",
          server_timestamp: "2026-11-12T10:02:00Z",
          payload: { fromOption: "B", toOption: "D" },
          client_session_id: "s1",
          created_at: "2026-11-12T10:02:00Z",
        },
      ],
      responses: [
        {
          id: "r1",
          attempt_id: "att-replay-1",
          question_id: "q1",
          selected_option: "D",
          is_marked_for_review: false,
          is_visited: true,
          active_time_ms: 45000,
          last_visited_at: "2026-11-12T10:02:00Z",
          updated_at: "2026-11-12T10:02:00Z",
        },
      ],
      questions: [
        {
          question_id: "q1",
          question_order: 1,
          marks: 4,
          negative_marks: 1,
          snapshot_text: "Kinematics derivation",
          snapshot_options: [],
          snapshot_correct_answer: "D",
          topic: "Kinematics",
        },
        {
          question_id: "q2",
          question_order: 2,
          marks: 4,
          negative_marks: 1,
          snapshot_text: "Thermodynamics cycle",
          snapshot_options: [],
          snapshot_correct_answer: "A",
          topic: "Thermodynamics",
        },
      ],
      resultsReleased: true,
    });

    expect(replay.timelineEvents.length).toBe(6);
    expect(replay.timelineEvents[0].eventType).toBe("EXAM_STARTED");
    expect(replay.timelineEvents[1].description).toContain("Opened Question 1");
    expect(replay.timelineEvents[2].recordedAnswerAtPoint).toBe("B");
    expect(replay.timelineEvents[4].description).toContain("Revisited Question 1");
    expect(replay.timelineEvents[5].description).toContain("Changed answer from B to D");

    // Final answer on Q1 is D
    expect(replay.questions["q1"].finalAnswer).toBe("D");
    expect(replay.questions["q1"].visitCount).toBe(2);
  });

  it("2. Skipping Intelligence: Detects time invested in unanswered problems and calculates efficiency index", () => {
    const input: AnalyticsCalculationInput = {
      attemptId: "att-skip-1",
      durationMinutes: 60,
      startedAt: "2026-11-12T10:00:00Z",
      submittedAt: "2026-11-12T10:45:00Z",
      questions: [
        {
          question_id: "q1",
          question_order: 1,
          marks: 4,
          negative_marks: 1,
          snapshot_text: "Q1",
          snapshot_options: [],
          snapshot_correct_answer: "A",
          snapshot_benchmark_seconds: 60,
        },
        {
          question_id: "q2",
          question_order: 2,
          marks: 4,
          negative_marks: 1,
          snapshot_text: "Q2",
          snapshot_options: [],
          snapshot_correct_answer: "B",
          snapshot_benchmark_seconds: 60,
        },
      ],
      responses: [
        {
          id: "r1",
          attempt_id: "att-skip-1",
          question_id: "q1",
          selected_option: null, // Unanswered!
          is_marked_for_review: false,
          is_visited: true,
          active_time_ms: 190000, // Spent > 3 minutes (190s) without answering
          last_visited_at: "2026-11-12T10:10:00Z",
          updated_at: "2026-11-12T10:10:00Z",
        },
        {
          id: "r2",
          attempt_id: "att-skip-1",
          question_id: "q2",
          selected_option: "B", // Answered
          is_marked_for_review: false,
          is_visited: true,
          active_time_ms: 45000,
          last_visited_at: "2026-11-12T10:20:00Z",
          updated_at: "2026-11-12T10:20:00Z",
        },
      ],
      events: [
        {
          id: "e1",
          attempt_id: "att-skip-1",
          student_id: "s1",
          question_id: "q1",
          event_type: "QUESTION_OPENED",
          client_sequence_num: 1,
          idempotency_key: "k1",
          client_timestamp: "2026-11-12T10:00:00Z",
          server_timestamp: "2026-11-12T10:00:00Z",
          payload: {},
          client_session_id: "s1",
          created_at: "2026-11-12T10:00:00Z",
        },
        {
          id: "e2",
          attempt_id: "att-skip-1",
          student_id: "s1",
          question_id: "q1",
          event_type: "QUESTION_REVISITED",
          client_sequence_num: 2,
          idempotency_key: "k2",
          client_timestamp: "2026-11-12T10:05:00Z",
          server_timestamp: "2026-11-12T10:05:00Z",
          payload: {},
          client_session_id: "s1",
          created_at: "2026-11-12T10:05:00Z",
        },
      ],
    };

    const skipping = calculateSkippingIntelligence(input);
    expect(skipping.unansweredCount).toBe(1);
    expect(skipping.totalTimeOnUnansweredSeconds).toBe(190);
    expect(skipping.abandonedQuestionsCount).toBe(1); // Revisited >= 2 times but left blank
    expect(skipping.actionableInsights.length).toBeGreaterThan(0);
    expect(skipping.actionableInsights[0]).toContain("minutes across 1 questions that were eventually left blank");
  });
});
