import { AdminUsersPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("admin-users");

export default function Page({ searchParams }: PageProps<"/admin/admin-users">) {
  return <AdminUsersPage searchParams={searchParams} />;
}
