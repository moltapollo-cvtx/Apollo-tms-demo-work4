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
          message: "Invalid driver ID",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") || [];

    // Get the driver from mock data
    const driver = mockStore.drivers.find((d) => d.id === id && d.isActive);

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          message: "Driver not found",
        },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = { ...driver };

    // Include qualifications if requested
    if (include.includes("qualifications")) {
      const driverQuals = mockStore.driverQualifications.filter((q) =>
        q.driverId === id && q.isActive
      );

      response.qualifications = driverQuals;
    }

    // Include certifications if requested
    if (include.includes("certifications")) {
      const driverCerts = mockStore.driverCertifications.filter((c) =>
        c.driverId === id && c.isActive
      );

      response.certifications = driverCerts;
    }

    // Include current assignment with related data if requested
    if (include.includes("currentAssignment")) {
      const assignment = mockStore.assignments.find((a) =>
        a.driverId === id && a.isActive
      );

      if (assignment) {
        const order = mockStore.orders.find((o) => o.id === assignment.orderId);
        const tractor = mockStore.tractors.find((t) => t.id === assignment.tractorId);
        const trailer = mockStore.trailers.find((t) => t.id === assignment.trailerId);

        response.currentAssignment = {
          ...assignment,
          ...(order && { order }),
          ...(tractor && { tractor }),
          ...(trailer && { trailer }),
        };
      }
    }

    // Include settlements if requested
    if (include.includes("settlements")) {
      const driverSettlements = mockStore.settlements
        .filter((s) => s.driverId === id && s.isActive)
        .sort((a, b) => new Date(a.periodEnd).getTime() - new Date(b.periodEnd).getTime());

      response.settlements = driverSettlements;
    }

    return NextResponse.json({
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch driver",
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
          message: "Invalid driver ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if driver exists in mock data
    const existingDriverIndex = mockStore.drivers.findIndex((d) => d.id === id && d.isActive);

    if (existingDriverIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Driver not found",
        },
        { status: 404 }
      );
    }

    // Simulate update - in a real implementation, this would update the database
    const updatedDriver = {
      ...mockStore.drivers[existingDriverIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    mockStore.drivers[existingDriverIndex] = updatedDriver as never;

    return NextResponse.json({
      data: updatedDriver,
      success: true,
      message: "Driver updated successfully",
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update driver",
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
          message: "Invalid driver ID",
        },
        { status: 400 }
      );
    }

    // Check if driver exists in mock data
    const existingDriverIndex = mockStore.drivers.findIndex((d) => d.id === id && d.isActive);

    if (existingDriverIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Driver not found",
        },
        { status: 404 }
      );
    }

    // Check for active assignments
    const activeAssignments = mockStore.assignments.filter((a) =>
      a.driverId === id && a.isActive
    );

    if (activeAssignments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete driver with active assignments",
        },
        { status: 400 }
      );
    }

    // Simulate soft delete - in a real implementation, this would update the database
    const deletedDriver = {
      ...mockStore.drivers[existingDriverIndex],
      deletedAt: new Date().toISOString(),
      isActive: false,
    };
    mockStore.drivers[existingDriverIndex] = deletedDriver as never;

    return NextResponse.json({
      data: deletedDriver,
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete driver",
      },
      { status: 500 }
    );
  }
}
