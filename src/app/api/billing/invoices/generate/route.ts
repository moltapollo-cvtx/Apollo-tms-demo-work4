import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderIds: number[] = Array.isArray(body.orderIds)
      ? body.orderIds
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    if (orderIds.length === 0) {
      return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    const selectedOrders = mockStore.orders.filter((order) => orderIds.includes(order.id));
    if (selectedOrders.length === 0) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 });
    }

    const distinctCustomerIds = [...new Set(selectedOrders.map((order) => order.customerId))];
    if (distinctCustomerIds.length > 1 && !body.customerId) {
      return NextResponse.json(
        { error: "Cannot generate one invoice for multiple customers" },
        { status: 400 },
      );
    }

    const customerId = Number(body.customerId ?? distinctCustomerIds[0]);
    const customer = mockStore.customers.find((entry) => entry.id === customerId);
    const now = new Date().toISOString();
    const dueDate =
      body.dueDate ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const lineItems = selectedOrders.map((order) => {
      const amount = toNumber(order.totalRevenue ?? order.totalRate, 0);
      return {
        id: nextNumericId(mockStore.invoiceLineItems),
        invoiceId: -1,
        orderId: order.id,
        chargeId: null,
        description: `Freight - ${order.orderNumber} - ${order.commodity ?? "General Freight"}`,
        quantity: 1,
        rate: amount,
        amount,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;
    const paidAmount = 0;
    const balanceAmount = totalAmount;

    const invoice = {
      id: nextNumericId(mockStore.invoices),
      organizationId: 1,
      customerId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(nextNumericId(mockStore.invoices)).padStart(4, "0")}`,
      invoiceDate: now.split("T")[0],
      dueDate,
      status: "draft",
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
    lineItems.forEach((lineItem) => {
      mockStore.invoiceLineItems.push({
        ...lineItem,
        invoiceId: invoice.id,
      });
    });

    return NextResponse.json(
      {
        ...invoice,
        customer: customer
          ? {
              id: customer.id,
              name: customer.name,
              code: customer.code,
            }
          : null,
        lineItems,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

