import type { Metadata } from "next";
import { RootHtml } from "@/components/shell/root-html";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Back Office", template: "%s · Sanchara Back Office" },
  robots: { index: false, follow: false },
};

// Root layout for the Back Office (Owner, Manager, Front Desk).
export default function BackofficeLayout({ children }: LayoutProps<"/backoffice">) {
  return <RootHtml>{children}</RootHtml>;
}
