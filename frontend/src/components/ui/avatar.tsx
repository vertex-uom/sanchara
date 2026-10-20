import { initials } from "@/lib/format/names";
import { cn } from "@/lib/utils";

const TONES = [
  "bg-office-tint-teal text-office-primary",
  "bg-office-tint-violet text-office-ink-violet",
  "bg-office-tint-blue text-office-ink-blue",
  "bg-office-tint-orange text-office-ink-orange",
];

// Colour follows the person's id, so the same person looks the same on every page.
function tone(id: string) {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return TONES[sum % TONES.length];
}

// Initials avatar; decorative, so the name must be shown next to it.
export function Avatar({ id, name, className }: { id: string; name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", tone(id), className)}
    >
      {initials(name)}
    </span>
  );
}
