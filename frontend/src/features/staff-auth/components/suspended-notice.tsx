import type { ReactNode } from "react";
import { Ban } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { SignOutButton } from "./sign-out-button";

// Full-page notice for a suspended company's staff (outside the Back Office shell).
export function SuspendedNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-office-sidebar px-4 py-10 outline-none">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <section aria-labelledby="suspended-title" className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <span aria-hidden="true" className="mb-4 flex size-11 items-center justify-center rounded-full bg-office-danger-soft text-office-danger-text">
            <Ban className="size-5" />
          </span>
          <h1 id="suspended-title" className="text-xl font-semibold text-foreground">
            {title}
          </h1>
          <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-office-label">{children}</div>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
