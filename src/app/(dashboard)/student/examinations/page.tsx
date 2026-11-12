import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "My Examinations",
  description: "Assigned JEE / NEET tests, active tests, and completed attempts",
  role: "STUDENT",
  emptyTitle: "No Scheduled Tests",
  emptyDescription: "Any scheduled mock test, full syllabus test, or part assessment will appear here.",
});
