import type { Metadata } from "next";
import { StaffSignInPage } from "@/features/staff-auth";

export const metadata: Metadata = { title: "Staff sign in" };

export default function Page({ searchParams }: PageProps<"/backoffice/sign-in">) {
  return <StaffSignInPage portal="staff" searchParams={searchParams} />;
}
