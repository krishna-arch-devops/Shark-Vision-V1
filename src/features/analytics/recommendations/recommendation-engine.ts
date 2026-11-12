import {
  PerformanceOverview,
  AnswerChangeSummary,
  SpeedAccuracyMatrix,
  TopicMetric,
  RecommendationItem,
  MeasurementQuality,
} from "../types";

export function generateRecommendations(params: {
  performance: PerformanceOverview;
  answerChanges: AnswerChangeSummary;
  speedAccuracy: SpeedAccuracyMatrix;
  topics: TopicMetric[];
  quality: MeasurementQuality;
}): RecommendationItem[] {
  const { performance, answerChanges, speedAccuracy, topics, quality } = params;
  const recommendations: RecommendationItem[] = [];

  // RULE 1: High time investment on incorrect questions (Slow Incorrect)
  if (speedAccuracy.slowIncorrectCount >= 2) {
    const slowIncorrectQuestions = speedAccuracy.items
      .filter((i) => i.category === "SLOW_INCORRECT")
      .map((i) => i.questionId);

    recommendations.push({
      ruleId: "RULE_SLOW_INCORRECT_ATTENTION",
      priority: "HIGH",
      title: "Review High Time-Investment Mistakes",
      explanation: `You spent more time than benchmark on ${speedAccuracy.slowIncorrectCount} questions that ended up incorrect. These represent significant time and mark leaks.`,
      supportingMetricIds: ["slowIncorrectCount", "timeAboveBenchmarkSeconds"],
      relevantReferences: slowIncorrectQuestions,
      suggestedAction: "Analyze the solution steps for these questions to identify where conceptual slowdown occurred.",
      dataQuality: quality,
    });
  }

  // RULE 2: Correct to Incorrect Answer Changes
  const correctToIncorrectItems = answerChanges.questions.filter(
    (q) => q.classification === "CORRECT_TO_INCORRECT"
  );
  if (correctToIncorrectItems.length >= 1) {
    recommendations.push({
      ruleId: "RULE_ANSWER_CHANGE_PENALTY",
      priority: "HIGH",
      title: "Second-Guessing Instinct Analysis",
      explanation: `You changed ${correctToIncorrectItems.length} question(s) from an initially correct answer to an incorrect one, losing ${answerChanges.marksLostFromChanges} marks.`,
      supportingMetricIds: ["marksLostFromChanges", "retainedFirstAnswerDelta"],
      relevantReferences: correctToIncorrectItems.map((q) => q.questionId),
      suggestedAction: "Only revise marked answers during review if you uncover an explicit calculation flaw rather than uncertainty.",
      dataQuality: quality,
    });
  }

  // RULE 3: Topic Weakness with Sufficient Observations
  const weakTopics = topics.filter((t) => t.classification === "NEEDS_ATTENTION");
  if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    recommendations.push({
      ruleId: "RULE_TOPIC_PRACTICE_PRIORITY",
      priority: "MEDIUM",
      title: `Prioritize Practice in ${topWeak.topic}`,
      explanation: `Observed accuracy in ${topWeak.topic} is ${topWeak.accuracyPercentage}% (${topWeak.correctAnswers}/${topWeak.attemptedQuestions} correct).`,
      supportingMetricIds: ["accuracyPercentage", "incorrectAnswers"],
      relevantReferences: [topWeak.topic],
      suggestedAction: `Work through foundational chapter exercises in ${topWeak.topic} before attempting timed tests.`,
      dataQuality: quality,
    });
  }

  // RULE 4: Low Overall Accuracy / High Negative Marking
  if (
    performance.accuracyPercentage !== null &&
    performance.accuracyPercentage < 50 &&
    performance.attemptedQuestions >= 5
  ) {
    recommendations.push({
      ruleId: "RULE_NEGATIVE_MARKING_DISCIPLINE",
      priority: "MEDIUM",
      title: "Eliminate Blind Guesswork",
      explanation: `Accuracy of ${performance.accuracyPercentage}% suggests answering without complete elimination of choices, leading to ${performance.incorrectAnswers} negative marks.`,
      supportingMetricIds: ["accuracyPercentage", "incorrectAnswers"],
      relevantReferences: [],
      suggestedAction: "Leave questions unanswered if you cannot eliminate at least two plausible options.",
      dataQuality: quality,
    });
  }

  // Fallback: If no urgent flags, provide positive discipline reinforcement
  if (recommendations.length === 0) {
    recommendations.push({
      ruleId: "RULE_BASELINE_CONTINUITY",
      priority: "LOW",
      title: "Maintain Examination Rhythm",
      explanation: "No critical time traps or damaging answer revisions detected in this assessment.",
      supportingMetricIds: ["accuracyPercentage"],
      relevantReferences: [],
      suggestedAction: "Continue practicing full-length mock tests to build speed consistency.",
      dataQuality: quality,
    });
  }

  // Cap to top 3 prioritized recommendations
  return recommendations.slice(0, 3);
}
