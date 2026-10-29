import type { Metadata } from "next";
import { StaffAcceptInvitePage } from "@/features/staff-auth";

export const metadata: Metadata = { title: "Set up your account" };

export default function Page({ searchParams }: PageProps<"/backoffice/accept-invite">) {
  return <StaffAcceptInvitePage portal="staff" searchParams={searchParams} />;
}
