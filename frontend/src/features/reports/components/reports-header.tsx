import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

// TODO(confirm): v8 has not defined the PDF export; the button is a disabled placeholder.
export function ReportsHeader({ propertyName, location }: { propertyName: string; location: string }) {
  return (
    <PageHeader
      title="Reports"
      place={{ name: propertyName, location }}
      action={
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
      }
    />
  );
}
