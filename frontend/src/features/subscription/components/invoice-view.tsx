import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { PageHeader } from "@/components/ui/page-header";
import { FlatCard } from "@/components/ui/widget";
import type { Invoice } from "../types";
import { moneyText } from "./plan-text";
import { PrintButton } from "./print-button";

// Read-only invoice laid out for printing; the real API PDF replaces it later.
export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const lines = [
    { label: invoice.description, value: moneyText(invoice.amount, "Amount") },
    // TODO(confirm): v8 has not decided tax on subscription invoices.
    { label: "Tax", value: moneyText(invoice.tax, "Amount") },
  ];
  return (
    <>
      <Link
        href={COMPANY_PATHS.subscription}
        className="focus-ring inline-flex min-h-11 items-center gap-1.5 self-start rounded-md text-sm font-medium text-office-link hover:underline print:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to Subscription &amp; Plan
      </Link>
      <PageHeader title={`Invoice ${invoice.number}`} description={`Issued on ${formatDateOnly(invoice.issuedOn)}`} action={<PrintButton />} />
      <FlatCard aria-label="Invoice details" className="max-w-3xl print:border-0 print:p-0">
        <table className="w-full text-sm">
          <caption className="sr-only">Invoice lines</caption>
          <thead>
            <tr>
              <th scope="col" className="py-2 text-left text-xs font-semibold text-office-muted">
                Description
              </th>
              <th scope="col" className="py-2 text-right text-xs font-semibold text-office-muted">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.label} className="border-t border-border">
                <th scope="row" className="py-3 text-left font-normal">
                  {line.label}
                </th>
                <td className="py-3 text-right">{line.value}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <th scope="row" className="py-3 text-left font-semibold">
                Total
              </th>
              <td className="py-3 text-right font-semibold">{moneyText(invoice.total, "Amount")}</td>
            </tr>
          </tfoot>
        </table>
      </FlatCard>
    </>
  );
}
