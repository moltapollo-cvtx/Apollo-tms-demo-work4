import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import {
  buildOrderAssignments,
  buildOrderCharges,
  buildOrderDocuments,
  buildOrderStops,
  buildOrderTrackingEvents,
  normalizeOrderForUi,
} from "@/lib/order-api-utils";

type OrderRecord = Record<string, unknown>;

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
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") || [];

    // Get the order
    const order = mockStore.orders.find((o) => o.id === id && o.isActive);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    const normalizedOrder = normalizeOrderForUi(order as unknown as OrderRecord);
    const response: Record<string, unknown> = { ...normalizedOrder };
    const stops = buildOrderStops(order as unknown as OrderRecord, mockStore);

    // Include customer if requested
    if (include.includes("customer")) {
      const customer = mockStore.customers.find((c) => c.id === order.customerId);
      if (customer) {
        response.customer = customer;
      }
    }

    // Include stops if requested
    if (include.includes("stops")) {
      response.stops = stops;
    }

    // Include charges if requested
    if (include.includes("charges")) {
      response.charges = buildOrderCharges(order as unknown as OrderRecord);
    }

    // Include assignments with related data if requested
    if (include.includes("assignments")) {
      response.assignments = buildOrderAssignments(
        order as unknown as OrderRecord,
        mockStore,
      );
    }

    // Include tracking if requested
    if (include.includes("trackingEvents")) {
      response.trackingEvents = buildOrderTrackingEvents(
        order as unknown as OrderRecord,
        stops,
      );
    }

    // Include documents if requested
    if (include.includes("documents")) {
      response.documents = buildOrderDocuments(order as unknown as OrderRecord);
    }

    return NextResponse.json({
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order",
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
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if order exists
    const orderIndex = mockStore.orders.findIndex((o) => o.id === id && o.isActive);

    if (orderIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Create updated order (in real app, this would update the database)
    const updatedOrder = {
      ...mockStore.orders[orderIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    mockStore.orders[orderIndex] = updatedOrder as never;

    return NextResponse.json({
      data: updatedOrder,
      success: true,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order",
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
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    // Check if order exists
    const orderIndex = mockStore.orders.findIndex((o) => o.id === id && o.isActive);

    if (orderIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Create soft-deleted order (in real app, this would update the database)
    const deletedOrder = {
      ...mockStore.orders[orderIndex],
      deletedAt: new Date().toISOString(),
      isActive: false,
    };

    mockStore.orders[orderIndex] = deletedOrder as never;

    return NextResponse.json({
      data: deletedOrder,
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete order",
      },
      { status: 500 }
    );
  }
}
