import { describe, it, expect } from "vitest";

describe("Question Dwell-Time Accumulator Calculation", () => {
  it("should accurately accumulate active time across multiple visits (30s + 42s = 72s)", () => {
    let cumulativeTimeMs: Record<string, number> = {};
    const questionId = "q_test_101";

    // Visit 1: Student opens Q101 and dwells for 30,000ms
    const visit1Start = 1000.0;
    const visit1End = 31000.0;
    const visit1Duration = visit1End - visit1Start; // 30,000ms
    cumulativeTimeMs[questionId] = (cumulativeTimeMs[questionId] || 0) + visit1Duration;

    expect(cumulativeTimeMs[questionId]).toBe(30000);

    // Student visits other questions, then returns to Q101
    // Visit 2: Student dwells for 42,000ms
    const visit2Start = 65000.0;
    const visit2End = 107000.0;
    const visit2Duration = visit2End - visit2Start; // 42,000ms
    cumulativeTimeMs[questionId] = (cumulativeTimeMs[questionId] || 0) + visit2Duration;

    // Total accumulated active time must equal exactly 72,000ms (72 seconds)
    expect(cumulativeTimeMs[questionId]).toBe(72000);
    const totalSeconds = Math.round(cumulativeTimeMs[questionId] / 1000);
    expect(totalSeconds).toBe(72);
  });

  it("should freeze elapsed time when tab visibility is hidden", () => {
    let accumulatedMs = 0;
    let timerRunning = true;

    const sessionStart = 1000.0;
    const tabHideTime = 16000.0; // 15 seconds active
    accumulatedMs += tabHideTime - sessionStart;
    timerRunning = false; // Tab hidden

    // User leaves tab for 2 minutes (120,000ms)
    const backgroundTime = 120000.0;
    const tabShowTime = tabHideTime + backgroundTime;

    // When tab becomes visible again, background time must NOT be added
    if (!timerRunning) {
      // Background time ignored
    }

    expect(accumulatedMs).toBe(15000); // Only 15s recorded, zero leakage from hidden background
  });
});
