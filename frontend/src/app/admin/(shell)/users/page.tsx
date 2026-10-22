import { UsersPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("users");

export default function Page({ searchParams }: PageProps<"/admin/users">) {
  return <UsersPage searchParams={searchParams} />;
}
