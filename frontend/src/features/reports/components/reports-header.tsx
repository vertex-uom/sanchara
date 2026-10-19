import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// TODO(confirm): v8 has not defined the PDF export; the button is a disabled placeholder.
export function ReportsHeader({ propertyName, location }: { propertyName: string; location: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Reports</h1>
        <p className="mt-1 text-base text-office-muted">
          {propertyName}
          <span aria-hidden="true" className="mx-2">
            •
          </span>
          <span className="sr-only">, </span>
          {location}
        </p>
      </div>
      <Button
        variant="outline"
        disabled
        title="PDF download is not available yet"
        className="h-11 gap-2 rounded-lg bg-card px-4 text-base font-semibold text-foreground md:h-10"
      >
        <Download aria-hidden="true" className="size-5" />
        Download PDF
        <span className="sr-only"> (not available yet)</span>
      </Button>
    </header>
  );
}
