"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { cn } from "@/lib/utils";
import { AdminNav } from "./admin-nav";
import { ADMIN_ICON_BUTTON, ICON_STROKE, SIDEBAR_BRAND_INSET, SIDEBAR_FULL_ONLY, SIDEBAR_RAIL_CENTER } from "./sidebar-modes";

// auto: icon rail from md, full sidebar from lg. The hamburger pins rail or full.
type SidebarMode = "auto" | "rail" | "full";

const DrawerContext = createContext<{ openDrawer: () => void }>({ openDrawer: () => {} });

// Design: 36px mark, 24px Medium wordmark in text/heading.
const LOGO_CLASS = "gap-3 [&>span]:text-2xl [&>span]:font-medium [&>span]:text-admin-heading [&>svg]:size-9";

function AdminBrand({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Platform Admin overview" className={cn("focus-ring rounded-xl pr-2", className)}>
      <Logo className={LOGO_CLASS} />
    </Link>
  );
}

type AdminSidebarFrameProps = {
  sidebarFooter: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
};

// Platform Admin frame: collapsible sidebar from md, drawer on phones,
// top bar and main content.
export function AdminSidebarFrame({ sidebarFooter, topBar, children }: AdminSidebarFrameProps) {
  const [mode, setMode] = useState<SidebarMode>("auto");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The drawer's opener lives in the top bar, not in a Dialog.Trigger, so
  // remember it and return focus there when the drawer closes.
  const openerRef = useRef<HTMLElement | null>(null);

  function openDrawer() {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDrawerOpen(true);
  }

  // The drawer is phone-only; close it if the window grows past md.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const close = () => {
      if (query.matches) setDrawerOpen(false);
    };
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, []);

  function toggleSidebar() {
    setMode((current) => {
      const isFull = current === "full" || (current === "auto" && window.matchMedia("(min-width: 64rem)").matches);
      return isFull ? "rail" : "full";
    });
  }

  return (
    <DrawerContext.Provider value={{ openDrawer }}>
      <a
        href="#main-content"
        className="focus-ring sr-only z-50 rounded-lg bg-admin-card px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-1">
        <aside
          data-mode={mode}
          aria-label="Sidebar"
          className="group/admin-sidebar sticky top-0 hidden h-dvh w-18 shrink-0 flex-col overflow-y-auto bg-admin-sidebar px-3 py-[18px] md:flex lg:w-66 data-[mode=full]:w-66 data-[mode=rail]:w-18"
        >
          <div className={cn("flex items-center gap-3 pt-1 pb-5", SIDEBAR_BRAND_INSET, SIDEBAR_RAIL_CENTER)}>
            <button type="button" onClick={toggleSidebar} aria-label="Toggle sidebar" className={ADMIN_ICON_BUTTON}>
              <Menu aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[22px]" />
            </button>
            <AdminBrand className={SIDEBAR_FULL_ONLY} />
          </div>
          <AdminNav />
          <div className={cn(SIDEBAR_FULL_ONLY, "mt-auto flex-col pt-4")}>{sidebarFooter}</div>
        </aside>

        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-admin-heading/40 md:hidden" />
            <Dialog.Content
              data-mode="full"
              aria-describedby={undefined}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                openerRef.current?.focus();
              }}
              className="group/admin-sidebar fixed inset-y-0 left-0 z-50 flex w-66 max-w-[85vw] flex-col overflow-y-auto bg-admin-sidebar px-3 py-[18px] shadow-xl md:hidden"
            >
              <Dialog.Title className="sr-only">Platform Admin menu</Dialog.Title>
              <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-5">
                <AdminBrand />
                <Dialog.Close aria-label="Close menu" className={ADMIN_ICON_BUTTON}>
                  <X aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[22px]" />
                </Dialog.Close>
              </div>
              <AdminNav onNavigate={() => setDrawerOpen(false)} />
              <div className="mt-auto pt-4">{sidebarFooter}</div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          {topBar}
          {children}
        </div>
      </div>
    </DrawerContext.Provider>
  );
}

// Hamburger in the top bar; opens the drawer on phones.
export function AdminDrawerButton() {
  const { openDrawer } = useContext(DrawerContext);
  return (
    <button type="button" onClick={openDrawer} aria-label="Open menu" className={cn(ADMIN_ICON_BUTTON, "md:hidden")}>
      <Menu aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[22px]" />
    </button>
  );
}
