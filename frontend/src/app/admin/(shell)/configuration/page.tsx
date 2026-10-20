import { ConfigurationPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("configuration");

export default function Page({ searchParams }: PageProps<"/admin/configuration">) {
  return <ConfigurationPage searchParams={searchParams} />;
}
