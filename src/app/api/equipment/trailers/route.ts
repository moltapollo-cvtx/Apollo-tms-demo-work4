import { NextRequest, NextResponse } from "next/server";
import { mockStore, nextNumericId } from "@/lib/mock-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const offset = (page - 1) * pageSize;

    // Filters
    const status = searchParams.get("status")?.split(",");
    const equipmentType = searchParams.get("equipmentType")?.split(",");
    const available = searchParams.get("available");
    const search = searchParams.get("search");
    const include = searchParams.get("include")?.split(",") || [];

    // Filter mock trailers
    const filteredTrailers = mockStore.trailers.filter((trailer) => {
      // Active filter
      if (!trailer.isActive) {
        return false;
      }

      // Status filter
      if (status && status.length > 0 && !status.includes(trailer.status)) {
        return false;
      }

      // Equipment type filter
      if (equipmentType && equipmentType.length > 0 && !equipmentType.includes(trailer.type)) {
        return false;
      }

      // Available filter
      if (available === "true" && trailer.status !== "available") {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const unitNumber = trailer.unitNumber.toLowerCase();
        const make = trailer.make.toLowerCase();
        const model = trailer.model.toLowerCase();
        const licensePlate = trailer.licensePlate.toLowerCase();

        if (!unitNumber.includes(searchLower) &&
            !make.includes(searchLower) &&
            !model.includes(searchLower) &&
            !licensePlate.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    // Sort by unit number
    filteredTrailers.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));

    const total = filteredTrailers.length;
    const totalPages = Math.ceil(total / pageSize);

    // Paginate
    const paginatedTrailers = filteredTrailers.slice(offset, offset + pageSize);

    // Add included data
    const trailersWithIncludes = paginatedTrailers.map((trailer) => {
      const response: Record<string, unknown> = { ...trailer };

      // Add current assignment if requested
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

      return response;
    });

    return NextResponse.json({
      data: trailersWithIncludes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching trailers:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch trailers",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["unitNumber", "type", "make", "model", "year"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `Field '${field}' is required`,
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate unit number in mock data
    const existingTrailer = mockStore.trailers.find((t) =>
      t.unitNumber === body.unitNumber && t.isActive
    );

    if (existingTrailer) {
      return NextResponse.json(
        {
          success: false,
          message: "Unit number already exists",
        },
        { status: 400 }
      );
    }

    // Create mock trailer
    const newTrailer = {
      id: nextNumericId(mockStore.trailers),
      organizationId: 1,
      unitNumber: body.unitNumber,
      type: body.type,
      make: body.make,
      model: body.model,
      year: body.year,
      vin: body.vin || `VIN${Date.now()}`,
      licensePlate: body.licensePlate || `${body.unitNumber}-LP`,
      status: body.status || "available",
      length: body.length || 53,
      width: body.width || 8.5,
      height: body.height || body.type === 'flatbed' ? 5.0 : 13.5,
      capacity: body.capacity || (body.type === 'refrigerated' ? 43000 : 45000),
      isActive: true,
      purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: body.purchasePrice || (body.type === 'refrigerated' ? 65000.00 : body.type === 'flatbed' ? 48000.00 : 52000.00),
      currentLocation: body.currentLocation || "Main Terminal",
      assignedTractorId: body.assignedTractorId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockStore.trailers.unshift(newTrailer as never);

    return NextResponse.json({
      data: newTrailer,
      success: true,
      message: "Trailer created successfully",
    });
  } catch (error) {
    console.error("Error creating trailer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create trailer",
      },
      { status: 500 }
    );
  }
}
