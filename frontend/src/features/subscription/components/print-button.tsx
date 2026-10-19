"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// The browser's print dialog also offers "Save as PDF".
export function PrintButton() {
  return (
    <Button type="button" variant="office" onClick={() => window.print()} className="h-11 gap-2 rounded-lg px-4 text-base md:h-10 print:hidden">
      <Printer aria-hidden="true" className="size-5" />
      Print / save as PDF
    </Button>
  );
}
