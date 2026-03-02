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
          message: "Invalid tractor ID",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") || [];

    // Find the tractor in mock data
    const tractor = mockStore.tractors.find((t) => t.id === id && t.isActive);

    if (!tractor) {
      return NextResponse.json(
        {
          success: false,
          message: "Tractor not found",
        },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = { ...tractor };

    // Include current assignment with related data if requested
    if (include.includes("currentAssignment") && tractor.currentDriverId) {
      // Find the current driver
      const currentDriver = mockStore.drivers.find((driver) => driver.id === tractor.currentDriverId);

      // Find active orders for this tractor
      const activeOrder = mockStore.orders.find((order) =>
        order.assignedTractorId === tractor.id &&
        ['assigned', 'dispatched', 'in_transit'].includes(order.status)
      );

      if (currentDriver || activeOrder) {
        response.currentAssignment = {
          id: tractor.id * 1000 + 1,
          tractorId: tractor.id,
          driverId: tractor.currentDriverId,
          orderId: activeOrder?.id || null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(activeOrder && { order: activeOrder }),
          ...(currentDriver && { driver: currentDriver }),
        };
      }
    }

    return NextResponse.json({
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching tractor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tractor",
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
          message: "Invalid tractor ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find the tractor in mock data
    const existingTractorIndex = mockStore.tractors.findIndex((t) => t.id === id && t.isActive);

    if (existingTractorIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Tractor not found",
        },
        { status: 404 }
      );
    }

    // Check for duplicate unit number (excluding current tractor)
    if (body.unitNumber && body.unitNumber !== mockStore.tractors[existingTractorIndex].unitNumber) {
      const duplicateTractor = mockStore.tractors.find((t) =>
        t.unitNumber === body.unitNumber && t.isActive && t.id !== id
      );

      if (duplicateTractor) {
        return NextResponse.json(
          {
            success: false,
            message: "Unit number already exists",
          },
          { status: 400 }
        );
      }
    }

    // Create updated tractor (in a real app this would update the database)
    const updatedTractor = {
      ...mockStore.tractors[existingTractorIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    mockStore.tractors[existingTractorIndex] = updatedTractor as never;

    return NextResponse.json({
      data: updatedTractor,
      success: true,
      message: "Tractor updated successfully",
    });
  } catch (error) {
    console.error("Error updating tractor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update tractor",
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
          message: "Invalid tractor ID",
        },
        { status: 400 }
      );
    }

    // Find the tractor in mock data
    const existingTractorIndex = mockStore.tractors.findIndex((t) => t.id === id && t.isActive);

    if (existingTractorIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Tractor not found",
        },
        { status: 404 }
      );
    }

    // Check for active assignments (active orders)
    const activeOrders = mockStore.orders.filter((order) =>
      order.assignedTractorId === id &&
      ['assigned', 'dispatched', 'in_transit'].includes(order.status)
    );

    if (activeOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete tractor with active assignments",
        },
        { status: 400 }
      );
    }

    // Create soft-deleted tractor (in a real app this would update the database)
    const deletedTractor = {
      ...mockStore.tractors[existingTractorIndex],
      deletedAt: new Date().toISOString(),
      isActive: false,
    };
    mockStore.tractors[existingTractorIndex] = deletedTractor as never;

    return NextResponse.json({
      data: deletedTractor,
      success: true,
      message: "Tractor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tractor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete tractor",
      },
      { status: 500 }
    );
  }
}
