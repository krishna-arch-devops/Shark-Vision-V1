import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Child Performance",
  description: "Examination scores, subject percentiles, and accuracy benchmarks",
  role: "PARENT",
  emptyTitle: "No Examination Results Available",
  emptyDescription: "When your child completes mock tests, overall marks and subject breakdowns will appear here.",
});
