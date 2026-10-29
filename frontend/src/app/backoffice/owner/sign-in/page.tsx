import type { Metadata } from "next";
import { StaffSignInPage } from "@/features/staff-auth";

export const metadata: Metadata = { title: "Owner sign in" };

export default function Page({ searchParams }: PageProps<"/backoffice/owner/sign-in">) {
  return <StaffSignInPage portal="owner" searchParams={searchParams} />;
}
