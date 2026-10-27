"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const buttonClass = "h-11 gap-2 rounded-lg bg-card px-4 text-base font-semibold text-foreground md:h-10 print:hidden";

// Opens the browser's print dialog, where "Save as PDF" downloads the report
// (the print styles hide the menus and filters). The page title is swapped
// while it is open because browsers use it as the PDF's file name.
// fileName null: nothing to download on this tab yet.
export function DownloadPdfButton({ fileName }: { fileName: string | null }) {
  if (!fileName) {
    return (
      <Button variant="outline" disabled title="This report has no data to download yet" className={buttonClass}>
        <Download aria-hidden="true" className="size-5" />
        Download PDF
        <span className="sr-only"> (no data to download yet)</span>
      </Button>
    );
  }

  function download() {
    const title = document.title;
    document.title = fileName as string;
    window.addEventListener("afterprint", () => (document.title = title), { once: true });
    window.print();
  }

  return (
    <Button type="button" variant="outline" onClick={download} className={buttonClass}>
      <Download aria-hidden="true" className="size-5" />
      Download PDF
      <span className="sr-only"> (opens the print dialog; choose Save as PDF)</span>
    </Button>
  );
}
