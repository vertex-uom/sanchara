import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/auth/admin";
import { AdminFooterCard } from "./admin-footer-card";
import { AdminHeader } from "./admin-header";
import { AdminSidebarFrame } from "./admin-sidebar-frame";

// Platform Admin console shell: sidebar, top bar and the page's main region.
export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  return (
    <AdminSidebarFrame sidebarFooter={<AdminFooterCard />} topBar={<AdminHeader user={user} />}>
      {/* Design: 28px gutters, 20px below the 80px top bar. */}
      <main id="main-content" tabIndex={-1} className="flex-1 px-4 pt-3 pb-10 outline-none sm:px-6 md:px-7 md:pt-5">
        {children}
      </main>
    </AdminSidebarFrame>
  );
}
