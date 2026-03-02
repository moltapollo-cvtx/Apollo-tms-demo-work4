import { NextRequest, NextResponse } from "next/server";
import { mockArAging, mockInvoices, mockCustomers, mockAuthSession } from "@/lib/mock-data";

export async function GET(_request: NextRequest) {
  try {
    // For demo purposes, use the mock session instead of real auth
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use pre-calculated mock AR aging data
    const summary = mockArAging.reduce((acc, customer) => {
      acc.current += customer.current;
      acc.past30 += customer.days30;
      acc.past60 += customer.days60;
      acc.past90 += customer.days90;
      acc.past120 += customer.over90;
      acc.totalOutstanding += customer.total;
      return acc;
    }, {
      current: 0,
      past30: 0,
      past60: 0,
      past90: 0,
      past120: 0,
      totalOutstanding: 0,
      invoiceCount: 0
    });

    // Get customer breakdown (already calculated in mock data)
    const customerBreakdown = mockArAging.map(customer => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerCode: mockCustomers.find(c => c.id === customer.customerId)?.code || "",
      current: customer.current,
      past30: customer.days30,
      past60: customer.days60,
      past90: customer.days90,
      past120: customer.over90,
      totalOutstanding: customer.total,
      invoiceCount: 1 // Simplified for demo
    }));

    // Get some sample overdue invoices from mock data
    const today = new Date();
    const overdueInvoices = mockInvoices
      .filter(invoice => {
        if (invoice.status === "paid" || invoice.status === "cancelled") return false;
        if (invoice.totalAmount <= 0) return false;
        const dueDate = new Date(invoice.dueDate);
        return dueDate < today;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 20)
      .map(invoice => {
        const customer = mockCustomers.find(c => c.id === invoice.customerId);
        const daysOverdue = Math.floor((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.createdAt, // use createdAt as invoice date for demo
          dueDate: invoice.dueDate,
          balanceAmount: invoice.totalAmount, // use totalAmount as balance for demo
          daysOverdue,
          customer: customer ? {
            id: customer.id,
            name: customer.name,
            code: customer.code,
          } : null,
        };
      });

    // Count invoices for summary
    summary.invoiceCount = mockInvoices.filter(i =>
      i.status !== "paid" && i.status !== "cancelled" && i.totalAmount > 0
    ).length;

    return NextResponse.json({
      summary,
      customerBreakdown,
      overdueInvoices,
    });
  } catch (error) {
    console.error("Error fetching AR aging data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}