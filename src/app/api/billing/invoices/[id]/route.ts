import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = mockStore.invoices.find((inv) => inv.id === Number.parseInt(id, 10));

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const customer = mockStore.customers.find((c) => c.id === invoice.customerId) ?? null;
  const lineItems = mockStore.invoiceLineItems
    .filter((li) => li.invoiceId === invoice.id && li.isActive)
    .map((item) => {
      const order = item.orderId
        ? mockStore.orders.find((entry) => entry.id === item.orderId)
        : null;
      return {
        id: item.id,
        orderId: item.orderId,
        chargeId: item.chargeId ?? null,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        order: order
          ? {
              id: order.id,
              orderNumber: order.orderNumber,
              commodity: order.commodity ?? null,
            }
          : null,
      };
    });

  return NextResponse.json({
    ...invoice,
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          code: customer.code ?? null,
          address: customer.address?.street ?? null,
          city: customer.address?.city ?? null,
          state: customer.address?.state ?? null,
          zipCode: customer.address?.zipCode ?? null,
          phone: customer.phone ?? null,
          email: customer.email ?? null,
          paymentTerms: customer.paymentTerms ?? null,
        }
      : null,
    lineItems,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockStore.invoices.findIndex((inv) => inv.id === Number.parseInt(id, 10));

  if (idx === -1) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const current = mockStore.invoices[idx];
  mockStore.invoices[idx] = {
    ...current,
    ...(body.status !== undefined && { status: body.status }),
    ...(body.notes !== undefined && { notes: body.notes }),
    ...(body.terms !== undefined && { terms: body.terms }),
    ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
    ...(body.paidAmount !== undefined && { paidAmount: Number(body.paidAmount) }),
    ...(body.balanceAmount !== undefined && { balanceAmount: Number(body.balanceAmount) }),
    ...(body.status === "sent" && !current.sentAt && { sentAt: now }),
    ...(body.status === "paid" && !current.paidAt && { paidAt: now }),
    updatedAt: now,
  };

  return NextResponse.json(mockStore.invoices[idx]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockStore.invoices.findIndex((inv) => inv.id === Number.parseInt(id, 10));

  if (idx === -1) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  mockStore.invoices[idx] = {
    ...mockStore.invoices[idx],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ message: "Invoice cancelled successfully" });
}
