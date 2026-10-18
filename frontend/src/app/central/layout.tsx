import type { Metadata } from "next";
import { RootHtml } from "@/components/shell/root-html";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Sanchara", template: "%s · Sanchara" },
  description: "Book direct with small accommodation businesses in Sri Lanka.",
};

// Root layout for the central site: directory, guest sign-in, Traveller Dashboard.
export default function CentralLayout({ children }: LayoutProps<"/central">) {
  return <RootHtml>{children}</RootHtml>;
}
