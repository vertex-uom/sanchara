import { adminPageMetadata, ContactMessagesPage } from "@/features/platform-admin";

export const metadata = adminPageMetadata("contact-messages");

export default function Page({ searchParams }: PageProps<"/admin/contact-messages">) {
  return <ContactMessagesPage searchParams={searchParams} />;
}
