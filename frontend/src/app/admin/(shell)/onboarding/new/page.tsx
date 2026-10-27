import type { Metadata } from "next";
import { NewCompanyPage } from "@/features/platform-admin";

export const metadata: Metadata = { title: "Create company", description: "Open a company and create the Owner's login." };

export default function Page() {
  return <NewCompanyPage />;
}
