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

    // Filter mock drivers
    const filteredDrivers = mockStore.drivers.filter((driver) => {
      // Active filter
      if (!driver.isActive) {
        return false;
      }
      if (driver.organizationId !== organizationId) {
        return false;
      }

      // Status filter
      if (status && status.length > 0 && !status.includes(driver.status)) {
        return false;
      }

      // Available filter
      if (available === "true" && driver.status !== "available") {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const firstName = driver.firstName.toLowerCase();
        const lastName = driver.lastName.toLowerCase();
        const email = driver.email.toLowerCase();
        const licenseNumber = driver.licenseNumber.toLowerCase();

        if (!firstName.includes(searchLower) &&
            !lastName.includes(searchLower) &&
            !email.includes(searchLower) &&
            !licenseNumber.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    // Sort by created date (newest first)
    filteredDrivers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filteredDrivers.length;
    const totalPages = Math.ceil(total / pageSize);

    // Paginate
    const paginatedDrivers = filteredDrivers.slice(offset, offset + pageSize);

    // Add included data
    const driversWithIncludes = paginatedDrivers.map((driver) => {
      const response: Record<string, unknown> = { ...driver };

      // Add mock qualifications if requested
      if (include.includes("qualifications")) {
        response.qualifications = [
          {
            id: driver.id * 100 + 1,
            driverId: driver.id,
            qualification: "DOT Medical Card",
            issuedDate: "2024-01-15",
            expirationDate: "2025-01-15",
            isActive: true
          },
          {
            id: driver.id * 100 + 2,
            driverId: driver.id,
            qualification: "Drug Test",
            issuedDate: "2024-02-01",
            expirationDate: "2025-02-01",
            isActive: true
          }
        ];
      }

      // Add mock certifications if requested
      if (include.includes("certifications")) {
        response.certifications = [
          {
            id: driver.id * 100 + 1,
            driverId: driver.id,
            certification: "Defensive Driving",
            issuedDate: "2024-01-01",
            expirationDate: "2026-01-01",
            isActive: true
          }
        ];
      }

      // Add current assignment if requested and driver has one
      if (include.includes("currentAssignment")) {
        const currentOrder = mockStore.orders.find((order) =>
          order.assignedDriverId === driver.id &&
          order.organizationId === organizationId &&
          order.isActive &&
          ['assigned', 'dispatched', 'in_transit'].includes(order.status)
        );

        if (currentOrder) {
          const tractor = mockStore.tractors.find((t) => t.id === currentOrder.assignedTractorId);
          const trailer = mockStore.trailers.find((tr) => tr.id === currentOrder.assignedTrailerId);

          response.currentAssignment = {
            id: driver.id * 100 + 1,
            driverId: driver.id,
            orderId: currentOrder.id,
            tractorId: currentOrder.assignedTractorId,
            trailerId: currentOrder.assignedTrailerId,
            isActive: true,
            assignedAt: new Date(currentOrder.updatedAt).toISOString(),
            order: currentOrder,
            tractor: tractor,
            trailer: trailer
          };
        }
      }

      return response;
    });

    return NextResponse.json({
      data: driversWithIncludes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch drivers",
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
    const requiredFields = ["firstName", "lastName"];
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

    // Generate employee ID if not provided
    if (!body.employeeId) {
      const lastNumber = Math.max(...mockStore.drivers.map((d) => {
        const match = d.email.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })) || 0;
      const nextNumber = lastNumber + 1;
      body.employeeId = `D${nextNumber.toString().padStart(4, "0")}`;
    }

    // Create mock driver
    const newDriver = {
      id: nextNumericId(mockStore.drivers),
      organizationId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || `${body.firstName.toLowerCase()}${body.lastName.toLowerCase()}@apollotms.com`,
      phone: body.phone || "(555) 123-4567",
      licenseNumber: body.licenseNumber || `DL${Math.floor(Math.random() * 1000000000)}`,
      licenseState: body.licenseState || "TX",
      licenseExpirationDate: body.licenseExpirationDate || "2025-12-31",
      cdlClass: body.cdlClass || "A",
      cdlEndorsements: body.cdlEndorsements || ["N"],
      dateOfBirth: body.dateOfBirth || "1985-01-01",
      hireDate: new Date().toISOString().split('T')[0],
      status: body.status || "available",
      homeTerminal: body.homeTerminal || "Dallas, TX",
      emergencyContact: body.emergencyContact || {
        name: "Emergency Contact",
        relationship: "spouse",
        phone: "(555) 987-6543"
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockStore.drivers.unshift(newDriver as never);

    return NextResponse.json({
      data: newDriver,
      success: true,
      message: "Driver created successfully",
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create driver",
      },
      { status: 500 }
    );
  }
}
