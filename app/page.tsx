import { redirect } from "next/navigation";

/**
 * Root route — redirects to /recipes (the primary page).
 */
export default function RootPage() {
  redirect("/recipes");
}
