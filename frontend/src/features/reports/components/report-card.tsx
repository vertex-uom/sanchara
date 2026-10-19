import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "@/components/ui/widget";

// Reports cards are flatter than Overview widgets: smaller radius, no shadow.
export function ReportCard({ className, ...props }: ComponentProps<typeof WidgetCard>) {
  return <WidgetCard className={cn("rounded-xl shadow-none", className)} {...props} />;
}
