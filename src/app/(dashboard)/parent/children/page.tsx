import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "My Children",
  description: "Verified student profiles linked to your parent account",
  role: "PARENT",
  emptyTitle: "No Verified Children Found",
  emptyDescription: "Guardian verification requires institutional approval to ensure privacy and security.",
});
