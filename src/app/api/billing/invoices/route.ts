import { NextRequest, NextResponse } from "next/server";
import { mockAuthSession } from "@/lib/mock-data";
import { mockStore, nextNumericId } from "@/lib/mock-store";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function GET(request: NextRequest) {
  try {
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    let invoices = mockStore.invoices.filter((invoice) => {
      if (invoice.organizationId !== session.user.organizationId) return false;
      if (search && !invoice.invoiceNumber.toLowerCase().includes(search)) return false;
      if (status && invoice.status !== status) return false;
      if (customerId && invoice.customerId !== Number.parseInt(customerId, 10)) return false;
      if (startDate && new Date(invoice.invoiceDate) < new Date(startDate)) return false;
      if (endDate && new Date(invoice.invoiceDate) > new Date(endDate)) return false;
      return true;
    });

    invoices = invoices.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = invoices.length;
    const pageInvoices = invoices.slice(offset, offset + limit);

    const data = pageInvoices.map((invoice) => {
      const customer = mockStore.customers.find((entry) => entry.id === invoice.customerId);
      return {
        ...invoice,
        customer: customer
          ? {
              id: customer.id,
              name: customer.name,
              code: customer.code,
              address: customer.address?.street ?? null,
              city: customer.address?.city ?? null,
              state: customer.address?.state ?? null,
              zipCode: customer.address?.zipCode ?? null,
              phone: customer.phone ?? null,
              email: customer.email ?? null,
              paymentTerms: customer.paymentTerms ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const now = new Date().toISOString();
    const subtotal = toNumber(body.subtotal, 0);
    const taxAmount = toNumber(body.taxAmount, 0);
    const totalAmount = toNumber(body.totalAmount, subtotal + taxAmount);
    const paidAmount = toNumber(body.paidAmount, 0);
    const balanceAmount = toNumber(body.balanceAmount, Math.max(0, totalAmount - paidAmount));

    const invoice = {
      id: nextNumericId(mockStore.invoices),
      organizationId: session.user.organizationId,
      customerId: Number.parseInt(String(body.customerId), 10),
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(nextNumericId(mockStore.invoices)).padStart(4, "0")}`,
      invoiceDate: body.invoiceDate || now.split("T")[0],
      dueDate: body.dueDate || null,
      status: body.status || "draft",
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount,
      balanceAmount,
      notes: body.notes ?? null,
      terms: body.terms ?? null,
      sentAt: null,
      paidAt: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    mockStore.invoices.unshift(invoice);

    if (Array.isArray(body.lineItems)) {
      body.lineItems.forEach((lineItem: Record<string, unknown>) => {
        mockStore.invoiceLineItems.push({
          id: nextNumericId(mockStore.invoiceLineItems),
          invoiceId: invoice.id,
          orderId: lineItem.orderId ? Number(lineItem.orderId) : null,
          chargeId: lineItem.chargeId ? Number(lineItem.chargeId) : null,
          description: String(lineItem.description ?? "Charge"),
          quantity: toNumber(lineItem.quantity, 1),
          rate: toNumber(lineItem.rate, 0),
          amount: toNumber(lineItem.amount, 0),
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

