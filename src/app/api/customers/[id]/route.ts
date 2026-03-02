import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") || [];

    // Get the customer from mock data
    const customer = mockStore.customers.find((c) => c.id === id && c.isActive);

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = { ...customer };

    // Include contacts if requested
    if (include.includes("contacts")) {
      const customerContacts = mockStore.contacts
        .filter(c => c.customerId === id)
        .sort((a, b) => {
          // Sort by isPrimary first (true first), then by firstName
          if (a.isPrimary !== b.isPrimary) {
            return a.isPrimary ? -1 : 1;
          }
          return a.firstName.localeCompare(b.firstName);
        });

      response.contacts = customerContacts;
    }

    // Include locations if requested
    if (include.includes("locations")) {
      const customerLocations = mockStore.locations.filter((l) =>
        l.customerId === id && l.isActive
      );

      response.locations = customerLocations;
    }

    // Include orders if requested
    if (include.includes("orders")) {
      const customerOrders = mockStore.orders
        .filter(o => o.customerId === id && o.isActive)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      response.orders = customerOrders;
    }

    // Include invoices if requested
    if (include.includes("invoices")) {
      const customerInvoices = mockStore.invoices
        .filter(i => i.customerId === id && i.status !== "cancelled")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      response.invoices = customerInvoices;
    }

    return NextResponse.json({
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if customer exists in mock data
    const existingCustomerIndex = mockStore.customers.findIndex((c) => c.id === id && c.isActive);

    if (existingCustomerIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // Check for duplicate customer code (excluding current customer)
    if (body.code && body.code !== mockStore.customers[existingCustomerIndex].code) {
      const duplicateCustomer = mockStore.customers.find((c) =>
        c.code === body.code && c.id !== id
      );

      if (duplicateCustomer) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer code already exists",
          },
          { status: 400 }
        );
      }
    }

    // Simulate update - in a real implementation, this would update the database
    // For demo purposes, return the updated data without actually persisting it
    const updatedCustomer = {
      ...mockStore.customers[existingCustomerIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    mockStore.customers[existingCustomerIndex] = updatedCustomer as never;

    return NextResponse.json({
      data: updatedCustomer,
      success: true,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    // Check if customer exists in mock data
    const existingCustomerIndex = mockStore.customers.findIndex((c) => c.id === id && c.isActive);

    if (existingCustomerIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // Check for active orders
    const activeOrders = mockStore.orders.filter((o) =>
      o.customerId === id && o.isActive
    );

    if (activeOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete customer with active orders",
        },
        { status: 400 }
      );
    }

    // Check for unpaid invoices
    const unpaidInvoices = mockStore.invoices.filter((i) =>
      i.customerId === id && i.status !== "paid" && i.status !== "cancelled"
    );

    if (unpaidInvoices.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete customer with unpaid invoices",
        },
        { status: 400 }
      );
    }

    // Simulate soft delete - in a real implementation, this would update the database
    const deletedCustomer = {
      ...mockStore.customers[existingCustomerIndex],
      deletedAt: new Date().toISOString(),
      isActive: false,
    };
    mockStore.customers[existingCustomerIndex] = deletedCustomer as never;

    return NextResponse.json({
      data: deletedCustomer,
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete customer",
      },
      { status: 500 }
    );
  }
}
