import { UsersPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("users");

// Same page as /users with one user open in the detail panel.
export default function Page({ params, searchParams }: PageProps<"/admin/users/[userId]">) {
  return <UsersPage searchParams={searchParams} params={params} />;
}
