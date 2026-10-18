import { cn } from "@/lib/utils";

// Placeholder mark (palm over a wave) until the real logo asset exists.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" aria-hidden="true" className="size-10 shrink-0">
        <circle cx="20" cy="20" r="20" className="fill-(--logo-mark)" />
        <g fill="none" stroke="white" strokeLinecap="round" strokeWidth="2">
          <path d="M20 27c0-5 1-9 4-12" />
          <path d="M24 15c-3-2-7-2-9 0M24 15c1-3 4-5 7-4M24 15c3-1 6 0 7 3M24 15c-1 3-4 5-6 5" />
          <path d="M9 30c3 0 4-2 7-2s4 2 7 2 4-2 7-2" />
        </g>
      </svg>
      <span className="text-xl font-semibold tracking-tight">Sanchara</span>
    </span>
  );
}
