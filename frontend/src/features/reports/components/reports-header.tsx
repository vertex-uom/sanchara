import { PageHeader } from "@/components/ui/page-header";
import { DownloadPdfButton } from "./download-pdf-button";

type ReportsHeaderProps = { propertyName: string; location: string; pdfFileName: string | null };

export function ReportsHeader({ propertyName, location, pdfFileName }: ReportsHeaderProps) {
  return <PageHeader title="Reports" place={{ name: propertyName, location }} action={<DownloadPdfButton fileName={pdfFileName} />} />;
}
