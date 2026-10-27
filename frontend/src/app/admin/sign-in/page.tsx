import type { Metadata } from "next";
import { AdminSignInPage } from "@/features/platform-admin";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <AdminSignInPage />;
}
