import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { mockStore, nextNumericId } from "@/lib/mock-store";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const offset = (page - 1) * pageSize;

    // Filters
    const status = searchParams.get("status")?.split(",");
    const available = searchParams.get("available");
    const search = searchParams.get("search");
    const include = searchParams.get("include")?.split(",") || [];

    // Filter mock tractors
    const filteredTractors = mockStore.tractors.filter((tractor) => {
      // Active filter
      if (!tractor.isActive) {
        return false;
      }
      if (tractor.organizationId !== organizationId) {
        return false;
      }

      // Status filter
      if (status && status.length > 0 && !status.includes(tractor.status)) {
        return false;
      }

      // Available filter
      if (available === "true" && tractor.status !== "available") {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const unitNumber = tractor.unitNumber.toLowerCase();
        const make = tractor.make.toLowerCase();
        const model = tractor.model.toLowerCase();
        const vin = tractor.vin.toLowerCase();
        const licensePlate = tractor.licensePlate.toLowerCase();

        if (!unitNumber.includes(searchLower) &&
            !make.includes(searchLower) &&
            !model.includes(searchLower) &&
            !vin.includes(searchLower) &&
            !licensePlate.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    // Sort by unit number
    filteredTractors.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));

    const total = filteredTractors.length;
    const totalPages = Math.ceil(total / pageSize);

    // Paginate
    const paginatedTractors = filteredTractors.slice(offset, offset + pageSize);

    // Add included data
    const tractorsWithIncludes = paginatedTractors.map((tractor) => {
      const response: Record<string, unknown> = { ...tractor };

      // Add current assignment if requested
      if (include.includes("currentAssignment") && tractor.currentDriverId) {
        // Find the current driver
        const currentDriver = mockStore.drivers.find((driver) => driver.id === tractor.currentDriverId);

        // Find active orders for this tractor
        const activeOrder = mockStore.orders.find((order) =>
          order.assignedTractorId === tractor.id &&
          order.organizationId === organizationId &&
          order.isActive &&
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

      return response;
    });

    return NextResponse.json({
      data: tractorsWithIncludes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching tractors:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tractors",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["unitNumber", "make", "model", "year"];
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
    const existingTractor = mockStore.tractors.find((t) =>
      t.unitNumber === body.unitNumber &&
      t.organizationId === organizationId &&
      t.isActive
    );

    if (existingTractor) {
      return NextResponse.json(
        {
          success: false,
          message: "Unit number already exists",
        },
        { status: 400 }
      );
    }

    // Create mock tractor
    const newTractor = {
      id: nextNumericId(mockStore.tractors),
      organizationId,
      unitNumber: body.unitNumber,
      make: body.make,
      model: body.model,
      year: body.year,
      vin: body.vin || `VIN${Date.now()}`,
      licensePlate: body.licensePlate || `${body.unitNumber}-LP`,
      status: body.status || "available",
      mileage: body.mileage || 0,
      fuelCapacity: body.fuelCapacity || 300.0,
      isActive: true,
      purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: body.purchasePrice || 150000.00,
      currentDriverId: body.currentDriverId || null,
      homeTerminal: body.homeTerminal || "Main Terminal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockStore.tractors.unshift(newTractor as never);

    return NextResponse.json({
      data: newTractor,
      success: true,
      message: "Tractor created successfully",
    });
  } catch (error) {
    console.error("Error creating tractor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create tractor",
      },
      { status: 500 }
    );
  }
}
