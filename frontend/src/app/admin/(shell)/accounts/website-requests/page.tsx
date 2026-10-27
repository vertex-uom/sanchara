import { redirect } from "next/navigation";

// The list itself is a tab of /accounts.
export default function Page() {
  redirect("/accounts?tab=websites");
}
