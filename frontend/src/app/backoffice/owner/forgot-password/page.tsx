import type { Metadata } from "next";
import { StaffForgotPasswordPage } from "@/features/staff-auth";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  return <StaffForgotPasswordPage portal="owner" />;
}
