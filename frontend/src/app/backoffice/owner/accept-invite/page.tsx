import type { Metadata } from "next";
import { StaffAcceptInvitePage } from "@/features/staff-auth";

export const metadata: Metadata = { title: "Set up your account" };

export default function Page({ searchParams }: PageProps<"/backoffice/owner/accept-invite">) {
  return <StaffAcceptInvitePage portal="owner" searchParams={searchParams} />;
}
