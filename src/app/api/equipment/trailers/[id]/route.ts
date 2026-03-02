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
          message: "Invalid trailer ID",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") || [];

    // Find the trailer in mock data
    const trailer = mockStore.trailers.find((t) => t.id === id && t.isActive);

    if (!trailer) {
      return NextResponse.json(
        {
          success: false,
          message: "Trailer not found",
        },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = { ...trailer };

    // Include current assignment with related data if requested
    if (include.includes("currentAssignment") && trailer.assignedTractorId) {
      // Find the assigned tractor
      const assignedTractor = mockStore.tractors.find((tractor) => tractor.id === trailer.assignedTractorId);

      // Find the driver from the assigned tractor
      const assignedDriver = assignedTractor?.currentDriverId ?
        mockStore.drivers.find((driver) => driver.id === assignedTractor.currentDriverId) : null;

      // Find active orders for this trailer
      const activeOrder = mockStore.orders.find((order) =>
        order.assignedTrailerId === trailer.id &&
        ['assigned', 'dispatched', 'in_transit'].includes(order.status)
      );

      if (assignedTractor || activeOrder || assignedDriver) {
        response.currentAssignment = {
          id: trailer.id * 1000 + 1,
          trailerId: trailer.id,
          tractorId: trailer.assignedTractorId,
          driverId: assignedTractor?.currentDriverId || null,
          orderId: activeOrder?.id || null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(activeOrder && { order: activeOrder }),
          ...(assignedDriver && { driver: assignedDriver }),
          ...(assignedTractor && { tractor: assignedTractor }),
        };
      }
    }

    return NextResponse.json({
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching trailer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch trailer",
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
          message: "Invalid trailer ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find the trailer in mock data
    const existingTrailerIndex = mockStore.trailers.findIndex((t) => t.id === id && t.isActive);

    if (existingTrailerIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Trailer not found",
        },
        { status: 404 }
      );
    }

    // Check for duplicate unit number (excluding current trailer)
    if (body.unitNumber && body.unitNumber !== mockStore.trailers[existingTrailerIndex].unitNumber) {
      const duplicateTrailer = mockStore.trailers.find((t) =>
        t.unitNumber === body.unitNumber && t.isActive && t.id !== id
      );

      if (duplicateTrailer) {
        return NextResponse.json(
          {
            success: false,
            message: "Unit number already exists",
          },
          { status: 400 }
        );
      }
    }

    // Create updated trailer (in a real app this would update the database)
    const updatedTrailer = {
      ...mockStore.trailers[existingTrailerIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    mockStore.trailers[existingTrailerIndex] = updatedTrailer as never;

    return NextResponse.json({
      data: updatedTrailer,
      success: true,
      message: "Trailer updated successfully",
    });
  } catch (error) {
    console.error("Error updating trailer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update trailer",
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
          message: "Invalid trailer ID",
        },
        { status: 400 }
      );
    }

    // Find the trailer in mock data
    const existingTrailerIndex = mockStore.trailers.findIndex((t) => t.id === id && t.isActive);

    if (existingTrailerIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Trailer not found",
        },
        { status: 404 }
      );
    }

    // Check for active assignments (active orders)
    const activeOrders = mockStore.orders.filter((order) =>
      order.assignedTrailerId === id &&
      ['assigned', 'dispatched', 'in_transit'].includes(order.status)
    );

    if (activeOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete trailer with active assignments",
        },
        { status: 400 }
      );
    }

    // Create soft-deleted trailer (in a real app this would update the database)
    const deletedTrailer = {
      ...mockStore.trailers[existingTrailerIndex],
      deletedAt: new Date().toISOString(),
      isActive: false,
    };
    mockStore.trailers[existingTrailerIndex] = deletedTrailer as never;

    return NextResponse.json({
      data: deletedTrailer,
      success: true,
      message: "Trailer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting trailer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete trailer",
      },
      { status: 500 }
    );
  }
}
