import type { Metadata } from "next";
import { StaffResetPasswordPage } from "@/features/staff-auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Page({ searchParams }: PageProps<"/backoffice/reset-password">) {
  return <StaffResetPasswordPage portal="staff" searchParams={searchParams} />;
}
