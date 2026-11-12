import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Examination Performance",
  description: "Comprehensive scorecards, percentile breakdown, and subject-wise metrics",
  role: "STUDENT",
  emptyTitle: "Performance Curves Awaiting Submission",
  emptyDescription: "Score distributions and comparative subject stats appear after taking tests.",
});
