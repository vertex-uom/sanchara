import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIT_STATUS_TOKENS } from "../status-tokens";

// "● Active" / "● Inactive" pill: dot and text, never colour alone.
export function UnitStatusBadge({ isActive }: { isActive: boolean }) {
  const token = UNIT_STATUS_TOKENS[isActive ? "active" : "inactive"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", token.chip)}>
      <Circle aria-hidden="true" className={cn("size-2 shrink-0", token.dot)} />
      {token.label}
    </span>
  );
}
