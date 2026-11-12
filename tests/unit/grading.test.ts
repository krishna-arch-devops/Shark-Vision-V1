import { describe, it, expect } from "vitest";

describe("Authoritative Server-Side Grading Logic", () => {
  const snapshotQuestions = [
    { question_id: "q1", marks: 4, negative_marks: 1, snapshot_correct_answer: "B" },
    { question_id: "q2", marks: 4, negative_marks: 1, snapshot_correct_answer: "C" },
    { question_id: "q3", marks: 4, negative_marks: 1, snapshot_correct_answer: "A" },
    { question_id: "q4", marks: 4, negative_marks: 1, snapshot_correct_answer: "D" },
  ];

  it("should calculate correct marks, negative deductions, and accuracy percentage", () => {
    // Student responses:
    // q1: "B" (Correct, +4)
    // q2: "A" (Incorrect, -1)
    // q3: null (Unanswered, 0)
    // q4: "D" (Correct, +4)
    const responses = new Map<string, string | null>([
      ["q1", "B"],
      ["q2", "A"],
      ["q3", null],
      ["q4", "D"],
    ]);

    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    let marksObtained = 0;
    let maxMarks = 0;

    for (const q of snapshotQuestions) {
      maxMarks += q.marks;
      const studentAns = responses.get(q.question_id);
      if (studentAns) {
        attemptedCount++;
        if (studentAns === q.snapshot_correct_answer) {
          correctCount++;
          marksObtained += q.marks;
        } else {
          incorrectCount++;
          marksObtained -= q.negative_marks;
        }
      }
    }

    const unansweredCount = snapshotQuestions.length - attemptedCount;
    const accuracy = (correctCount / attemptedCount) * 100;

    expect(correctCount).toBe(2);
    expect(incorrectCount).toBe(1);
    expect(unansweredCount).toBe(1);
    expect(attemptedCount).toBe(3);
    expect(marksObtained).toBe(7); // (+4 -1 +4 = 7)
    expect(maxMarks).toBe(16);
    expect(Number(accuracy.toFixed(2))).toBe(66.67);
  });
});
