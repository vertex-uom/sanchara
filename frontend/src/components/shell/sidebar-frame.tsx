"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { COMPANY_PATHS, propertyPath } from "@/lib/routes/backoffice";
import { cn } from "@/lib/utils";
import { BackofficeNav, FULL_ONLY } from "./backoffice-nav";
import { Logo } from "./logo";

// auto: icon rail from md, full sidebar from lg. The toggle pins rail or full.
type SidebarMode = "auto" | "rail" | "full";

// Website builder steps (and pages under them) are full width; the template form brings its own step rail.
const NO_SIDEBAR_PATHS: string[] = [
  `${COMPANY_PATHS.website}/templates`,
  `${COMPANY_PATHS.website}/assistance`,
  `${COMPANY_PATHS.website}/template-form`,
  `${COMPANY_PATHS.website}/scratch`,
  `${COMPANY_PATHS.website}/preview`,
  `${COMPANY_PATHS.website}/publish`,
  `${COMPANY_PATHS.website}/published`,
];

// Pages with their own top bar (the website preview): no Back Office header either.
const NO_TOP_BAR_PATHS: string[] = [
  `${COMPANY_PATHS.website}/preview`,
  `${COMPANY_PATHS.website}/published`,
  `${COMPANY_PATHS.website}/scratch/builder`,
  `${COMPANY_PATHS.website}/scratch/review`,
  `${COMPANY_PATHS.website}/scratch/preview`,
  `${COMPANY_PATHS.website}/scratch/published`,
];

function matchesAny(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

const DrawerContext = createContext<{
  openDrawer: () => void;
  hasSidebar: boolean;
  propertyId: string;
}>({
  openDrawer: () => {},
  hasSidebar: true,
  propertyId: "",
});

const iconButtonClass =
  "focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-office-icon transition-colors hover:bg-office-nav-active motion-reduce:transition-none";

type SidebarFrameProps = {
  propertyId: string;
  sidebarFooter: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
};

// Back Office frame: sidebar from md, drawer on phones, top bar and content.
export function SidebarFrame({
  propertyId,
  sidebarFooter,
  topBar,
  children,
}: SidebarFrameProps) {
  const [mode, setMode] = useState<SidebarMode>("auto");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const hasSidebar = !matchesAny(pathname, NO_SIDEBAR_PATHS);
  const hasTopBar = !matchesAny(pathname, NO_TOP_BAR_PATHS);

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
      const isFull =
        current === "full" ||
        (current === "auto" && window.matchMedia("(min-width: 64rem)").matches);
      return isFull ? "rail" : "full";
    });
  }

  return (
    <DrawerContext.Provider
      value={{
        openDrawer: () => setDrawerOpen(true),
        hasSidebar,
        propertyId,
      }}
    >
      <a
        href="#main-content"
        className="focus-ring sr-only z-50 rounded-lg bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-1">
        {hasSidebar ? (
          <aside
            data-mode={mode}
            className="group/sidebar sticky top-0 hidden h-dvh w-20 shrink-0 flex-col gap-4 overflow-y-auto bg-office-sidebar p-3 md:flex lg:w-72 data-[mode=full]:w-72 data-[mode=rail]:w-20 print:hidden"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                className={iconButtonClass}
              >
                <Menu aria-hidden="true" className="size-6" />
              </button>
              <Link
                href={propertyPath(propertyId)}
                aria-label="Sanchara Back Office overview"
                className={cn(FULL_ONLY, "focus-ring rounded-xl pr-2")}
              >
                <Logo />
              </Link>
            </div>
            <BackofficeNav propertyId={propertyId} />
            <div className={cn(FULL_ONLY, "mt-auto flex-col")}>
              {sidebarFooter}
            </div>
          </aside>
        ) : null}

        <Dialog.Root
          open={hasSidebar && drawerOpen}
          onOpenChange={setDrawerOpen}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 md:hidden" />
            <Dialog.Content
              data-mode="full"
              aria-describedby={undefined}
              className="group/sidebar fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-office-sidebar p-3 shadow-xl md:hidden"
            >
              <Dialog.Title className="sr-only">Back Office menu</Dialog.Title>
              <div className="flex items-center justify-between gap-2">
                <Logo />
                <Dialog.Close
                  aria-label="Close menu"
                  className={iconButtonClass}
                >
                  <X aria-hidden="true" className="size-6" />
                </Dialog.Close>
              </div>
              <BackofficeNav
                propertyId={propertyId}
                onNavigate={() => setDrawerOpen(false)}
              />
              <div className="mt-auto">{sidebarFooter}</div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          {hasTopBar ? topBar : null}
          {children}
        </div>
      </div>
    </DrawerContext.Provider>
  );
}

// Hamburger in the top bar; opens the drawer on phones. Pages without the
// sidebar show the logo here instead, so the header still leads home.
export function DrawerButton() {
  const { openDrawer, hasSidebar, propertyId } = useContext(DrawerContext);
  if (!hasSidebar) {
    return (
      <Link
        href={propertyPath(propertyId)}
        aria-label="Sanchara Back Office overview"
        className="focus-ring shrink-0 rounded-xl pr-2"
      >
        <Logo />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Open menu"
      className={cn(iconButtonClass, "md:hidden")}
    >
      <Menu aria-hidden="true" className="size-6" />
    </button>
  );
}
