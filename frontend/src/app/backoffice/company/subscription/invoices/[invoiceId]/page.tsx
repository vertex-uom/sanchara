import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { Skeleton } from "@/components/ui/widget";
import { getInvoice, InvoiceView } from "@/features/subscription";

export const metadata = { title: "Invoice" };

type InvoiceProps = Pick<PageProps<"/backoffice/company/subscription/invoices/[invoiceId]">, "params">;

// Printable subscription invoice (Owner only).
export default function Page({ params }: PageProps<"/backoffice/company/subscription/invoices/[invoiceId]">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-4 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<Skeleton className="h-64 max-w-3xl rounded-xl" />}>
        <InvoicePage params={params} />
      </Suspense>
    </main>
  );
}

async function InvoicePage({ params }: InvoiceProps) {
  const [{ invoiceId }, user] = await Promise.all([params, getCurrentStaff()]);
  if (!can(user, "subscription.read")) redirect("/forbidden");
  const invoice = await getInvoice(invoiceId);
  if (!invoice) notFound();
  return <InvoiceView invoice={invoice} />;
}
