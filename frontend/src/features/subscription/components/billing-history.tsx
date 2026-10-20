import Link from "next/link";
import { formatDateOnly } from "@/lib/format/dates";
import { ToneChip, type ChipTone } from "@/components/ui/tone-chip";
import { EmptyState, FlatCard } from "@/components/ui/widget";
import { invoiceHref } from "../subscription-params";
import type { Invoice, InvoiceStatus } from "../types";
import { moneyText } from "./plan-text";

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: ChipTone }> = {
  paid: { label: "Paid", tone: "success" },
  due: { label: "Due", tone: "info" },
  failed: { label: "Failed", tone: "danger" },
};

const headClass = "px-3 py-3 text-left text-xs font-semibold text-office-muted";
const cellClass = "px-3 py-3 text-sm";

function InvoiceStatusChip({ status }: { status: InvoiceStatus }) {
  const { label, tone } = INVOICE_STATUS[status];
  return (
    <ToneChip tone={tone} dot>
      {label}
    </ToneChip>
  );
}

function InvoiceLink({ invoice }: { invoice: Invoice }) {
  return (
    <Link
      href={invoiceHref(invoice.id)}
      className="focus-ring inline-flex min-h-11 items-center rounded-md text-sm font-medium text-office-link underline-offset-4 hover:underline md:min-h-8"
    >
      View invoice<span className="sr-only"> {invoice.number}</span>
    </Link>
  );
}

// A table from md; the same rows as cards on phones.
export function BillingHistory({ invoices }: { invoices: Invoice[] }) {
  return (
    <FlatCard aria-labelledby="billing-history-title">
      <h2 id="billing-history-title" className="mb-4 text-lg font-semibold">
        Billing history
      </h2>
      {invoices.length === 0 ? (
        <EmptyState>No invoices yet.</EmptyState>
      ) : (
        <>
          <table className="hidden w-full md:table">
            <caption className="sr-only">Invoices, newest first</caption>
            <thead>
              <tr>
                {["Date", "Description", "Amount", "Status", "Invoice"].map((label) => (
                  <th key={label} scope="col" className={headClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border">
                  <th scope="row" className={`${cellClass} text-left font-semibold`}>
                    <time dateTime={invoice.issuedOn}>{formatDateOnly(invoice.issuedOn)}</time>
                  </th>
                  <td className={cellClass}>{invoice.description}</td>
                  <td className={cellClass}>{moneyText(invoice.total, "Amount")}</td>
                  <td className={cellClass}>
                    <InvoiceStatusChip status={invoice.status} />
                  </td>
                  <td className={cellClass}>
                    <InvoiceLink invoice={invoice} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul aria-label="Invoices, newest first" className="space-y-3 md:hidden">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time dateTime={invoice.issuedOn} className="text-sm font-semibold">
                    {formatDateOnly(invoice.issuedOn)}
                  </time>
                  <InvoiceStatusChip status={invoice.status} />
                </div>
                <p className="mt-2 text-sm">{invoice.description}</p>
                <p className="mt-1 text-sm font-semibold">{moneyText(invoice.total, "Amount")}</p>
                <InvoiceLink invoice={invoice} />
              </li>
            ))}
          </ul>
        </>
      )}
    </FlatCard>
  );
}
