import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Shared <html>/<body> for the four root layouts (central, site, backoffice, admin).
export function RootHtml({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className={`flex min-h-full flex-col ${className ?? ""}`}>{children}</body>
    </html>
  );
}
