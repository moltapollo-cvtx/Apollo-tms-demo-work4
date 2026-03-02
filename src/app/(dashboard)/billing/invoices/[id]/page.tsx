import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/components/billing/invoice-detail";

export const dynamic = "force-dynamic";

export default async function BillingInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    notFound();
  }

  return <InvoiceDetail invoiceId={invoiceId} />;
}
