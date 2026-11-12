import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "My Batches",
  description: "Batches assigned to you by institution administration",
  role: "TEACHER",
  emptyTitle: "No Batches Assigned",
  emptyDescription: "Contact your institution administrator to get assigned to active JEE or NEET student batches.",
});
