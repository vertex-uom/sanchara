import type { Metadata } from "next";
import { RootHtml } from "@/components/shell/root-html";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Platform Admin", template: "%s · Sanchara Admin" },
  robots: { index: false, follow: false },
};

// Root layout for Platform Administration (WEMIXT staff). No booking or guest data.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RootHtml className="admin-theme">{children}</RootHtml>;
}
