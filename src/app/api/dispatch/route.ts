import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { mockStore, nextNumericId } from "@/lib/mock-store";
import { buildOrderStops, normalizeOrderForUi } from "@/lib/order-api-utils";

type DispatchStop = {
  id: number;
  orderId: number;
  sequence: number;
  type: string;
  city: string;
  state: string;
  scheduledDate: string | null;
  address: string;
  isCompleted: boolean;
  [key: string]: unknown;
};

type DriverAssignmentView = {
  assignment: { id: number } & Record<string, unknown>;
  order: { id: number } & Record<string, unknown>;
  customer: Record<string, unknown> | null;
  stops: DispatchStop[];
};

type DriverDispatchView = ({ id: number } & Record<string, unknown>) & {
  currentAssignments: DriverAssignmentView[];
  currentTractor: Record<string, unknown> | null;
  currentTrailer: Record<string, unknown> | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCsvFilter = (searchParams: URLSearchParams, ...keys: string[]) => {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (!value) {
      continue;
    }
    return value
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }
  return [] as string[];
};

const normalizeDispatchOrder = (order: Record<string, unknown>) => {
  const normalized = normalizeOrderForUi(order);
  const totalRevenue = toNumber(normalized.totalRevenue ?? normalized.totalRate, 0);
  const miles = toNumber(order.miles ?? normalized.totalMiles, 0);
  const priorityLevel = String(
    normalized.priorityLevel ?? normalized.priority ?? "normal",
  ).toLowerCase();

  return {
    ...normalized,
    status: String(normalized.status ?? order.status ?? "available").toLowerCase(),
    priorityLevel,
    totalRevenue: totalRevenue.toFixed(2),
    miles: String(Math.max(0, Math.round(miles))),
    weight: String(Math.max(toNumber(order.weight, 12000), 0)),
    pieces: Math.max(Math.round(toNumber(order.pieces, 1)), 1),
    customerId: toNumber(order.customerId),
  };
};

const normalizeDispatchStop = (stop: Record<string, unknown>): DispatchStop => ({
  ...stop,
  id: toNumber(stop.id),
  orderId: toNumber(stop.orderId),
  sequence: toNumber(stop.sequence, 1),
  type: String(stop.type ?? "pickup"),
  city: String(stop.city ?? "Not assigned"),
  state: String(stop.state ?? ""),
  scheduledDate:
    typeof stop.scheduledDate === "string"
      ? stop.scheduledDate
      : typeof stop.scheduledArrival === "string"
        ? stop.scheduledArrival
        : null,
  address: String(stop.address ?? "Not assigned"),
  isCompleted: Boolean(stop.isCompleted),
});

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);
    const driverStatuses = parseCsvFilter(searchParams, "driverStatus");
    const loadStatuses = parseCsvFilter(searchParams, "loadStatus", "status");
    const equipmentTypes = parseCsvFilter(searchParams, "equipmentType");
    const priorityLevels = parseCsvFilter(searchParams, "priorityLevel", "urgency");
    const customerIdFilter = searchParams.get("customerId");
    const regionFilter = searchParams.get("region")?.trim().toUpperCase() || null;
    const filters = {
      driverStatuses,
      loadStatuses,
      equipmentTypes,
      priorityLevels,
      customerId:
        customerIdFilter && Number.isFinite(Number(customerIdFilter))
          ? Number.parseInt(customerIdFilter, 10)
          : null,
      region: regionFilter,
    };

    const orderById = new Map<number, Record<string, unknown>>();
    mockStore.orders.forEach((order) => {
      if (!order.isActive || order.organizationId !== organizationId) {
        return;
      }
      orderById.set(order.id, order as Record<string, unknown>);
    });

    const customerById = new Map<number, Record<string, unknown>>();
    mockStore.customers.forEach((customer) => {
      if (!customer.isActive || customer.organizationId !== organizationId) {
        return;
      }
      customerById.set(customer.id, customer as Record<string, unknown>);
    });

    const tractorById = new Map<number, Record<string, unknown>>();
    mockStore.tractors.forEach((tractor) => {
      if (!tractor.isActive || tractor.organizationId !== organizationId) {
        return;
      }
      tractorById.set(tractor.id, tractor as Record<string, unknown>);
    });

    const trailerById = new Map<number, Record<string, unknown>>();
    mockStore.trailers.forEach((trailer) => {
      if (!trailer.isActive || trailer.organizationId !== organizationId) {
        return;
      }
      trailerById.set(trailer.id, trailer as Record<string, unknown>);
    });

    const activeAssignments = mockStore.assignments.filter((assignment) => {
      if (!assignment.isActive) {
        return false;
      }
      const order = orderById.get(assignment.orderId);
      return Boolean(order);
    });

    const assignmentsByDriver = new Map<number, Array<Record<string, unknown>>>();
    activeAssignments.forEach((assignment) => {
      const key = toNumber(assignment.driverId);
      if (!assignmentsByDriver.has(key)) {
        assignmentsByDriver.set(key, []);
      }
      assignmentsByDriver.get(key)?.push(assignment as Record<string, unknown>);
    });

    const activeDrivers = mockStore.drivers.filter((driver) => {
      if (!driver.isActive || driver.organizationId !== organizationId) {
        return false;
      }
      if (
        filters.driverStatuses.length > 0 &&
        !filters.driverStatuses.includes(String(driver.status).toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    const driversData: DriverDispatchView[] = activeDrivers.map((driver) => {
      const driverId = toNumber(driver.id);
      const driverAssignments = assignmentsByDriver.get(driverId) ?? [];
      const currentAssignments = driverAssignments
        .map((assignment): DriverAssignmentView | null => {
          const orderId = toNumber(assignment.orderId);
          const rawOrder = orderById.get(orderId);
          if (!rawOrder) {
            return null;
          }

          const order = normalizeDispatchOrder(rawOrder);
          const stops = buildOrderStops(rawOrder, mockStore)
            .map((stop) => normalizeDispatchStop(stop))
            .sort((a, b) => a.sequence - b.sequence);
          const customer = customerById.get(toNumber(rawOrder.customerId)) ?? null;

          return {
            assignment: assignment as { id: number } & Record<string, unknown>,
            order: order as { id: number } & Record<string, unknown>,
            customer,
            stops,
          };
        })
        .filter((value): value is DriverAssignmentView => value !== null);

      const primaryAssignment = driverAssignments[0];
      const currentTractor = primaryAssignment
        ? tractorById.get(toNumber(primaryAssignment.tractorId)) ?? null
        : null;
      const currentTrailer = primaryAssignment
        ? trailerById.get(toNumber(primaryAssignment.trailerId)) ?? null
        : null;

      return {
        ...(driver as { id: number } & Record<string, unknown>),
        currentAssignments,
        currentTractor,
        currentTrailer,
      };
    });

    const assignedOrderIds = new Set(
      activeAssignments.map((assignment) => toNumber(assignment.orderId)),
    );

    const unassignedOrdersData = Array.from(orderById.values())
      .filter((order) => {
        const orderId = toNumber(order.id);
        const rawStatus = String(order.status ?? "").toLowerCase();
        if (!["available", "assigned"].includes(rawStatus)) {
          return false;
        }
        if (assignedOrderIds.has(orderId)) {
          return false;
        }

        const normalizedOrder = normalizeDispatchOrder(order);
        if (
          filters.loadStatuses.length > 0 &&
          !filters.loadStatuses.includes(String(normalizedOrder.status).toLowerCase())
        ) {
          return false;
        }
        if (
          filters.equipmentTypes.length > 0 &&
          !filters.equipmentTypes.includes(String(normalizedOrder.equipmentType).toLowerCase())
        ) {
          return false;
        }
        if (
          filters.priorityLevels.length > 0 &&
          !filters.priorityLevels.includes(String(normalizedOrder.priorityLevel).toLowerCase())
        ) {
          return false;
        }
        if (
          typeof filters.customerId === "number" &&
          filters.customerId > 0 &&
          toNumber(order.customerId) !== filters.customerId
        ) {
          return false;
        }

        if (filters.region) {
          const stops = buildOrderStops(order, mockStore);
          const hasRegionMatch = stops.some(
            (stop) => String(stop.state ?? "").toUpperCase() === filters.region,
          );
          if (!hasRegionMatch) {
            return false;
          }
        }

        return true;
      })
      .map((order) => {
        const normalizedOrder = normalizeDispatchOrder(order);
        const stops = buildOrderStops(order, mockStore)
          .map((stop) => normalizeDispatchStop(stop))
          .sort((a, b) => a.sequence - b.sequence);
        const customer = customerById.get(toNumber(order.customerId)) ?? null;

        return {
          ...normalizedOrder,
          customer,
          stops,
        };
      });

    // Sort by priority and creation date
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    unassignedOrdersData.sort((a, b) => {
      const priorityDiff =
        (priorityWeight[String(b.priorityLevel)] ?? 0) -
        (priorityWeight[String(a.priorityLevel)] ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(String(a.createdAt ?? 0)).getTime() -
        new Date(String(b.createdAt ?? 0)).getTime()
      );
    });

    // Get available equipment from mock data
    const availableEquipment = mockStore.tractors
      .filter(
        (t) =>
          t.status === "available" &&
          t.isActive &&
          t.organizationId === organizationId,
      )
      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));

    const availableTrailers = mockStore.trailers
      .filter(
        (t) =>
          t.status === "available" &&
          t.isActive &&
          t.organizationId === organizationId,
      )
      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));

    // Get customers for filter dropdown from mock data
    const customersData = mockStore.customers
      .filter((c) => c.isActive && c.organizationId === organizationId)
      .map(c => ({ id: c.id, name: c.name, code: c.code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      data: {
        drivers: driversData,
        unassignedOrders: unassignedOrdersData,
        availableEquipment,
        availableTrailers,
        customers: customersData,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching dispatch data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dispatch data",
        data: null,
      },
      { status: 500 }
    );
  }
}

// POST endpoint for assignment operations (drag-and-drop)
export async function POST(request: NextRequest) {
  try {
    const { organizationId, userId } = await getAuthContext();
    const body = await request.json();
    const { action, orderId, driverId, tractorId, trailerId } = body;

    if (action === "assign") {
      // Validate required fields
      if (!orderId || !driverId) {
        return NextResponse.json(
          {
            success: false,
            message: "Order ID and Driver ID are required",
          },
          { status: 400 }
        );
      }

      // Simulate assignment creation - in a real implementation, this would update the database
      const existingAssignment = mockStore.assignments.find(
        (assignment) => {
          if (assignment.orderId !== orderId || !assignment.isActive) {
            return false;
          }
          const order = mockStore.orders.find((entry) => entry.id === assignment.orderId);
          return !!order && order.organizationId === organizationId && order.isActive;
        },
      );
      if (existingAssignment) {
        return NextResponse.json(
          {
            success: false,
            message: "Order already has an active assignment",
          },
          { status: 400 },
        );
      }

      const orderIndex = mockStore.orders.findIndex(
        (order) =>
          order.id === orderId &&
          order.isActive &&
          order.organizationId === organizationId,
      );
      if (orderIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: "Order not found",
          },
          { status: 404 },
        );
      }

      const driverIndex = mockStore.drivers.findIndex(
        (driver) =>
          driver.id === driverId &&
          driver.isActive &&
          driver.organizationId === organizationId,
      );
      if (driverIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: "Driver not found",
          },
          { status: 404 },
        );
      }

      const assignedTractorId =
        typeof tractorId === "number"
          ? tractorId
          : mockStore.tractors.find(
              (tractor) =>
                tractor.currentDriverId === driverId &&
                tractor.organizationId === organizationId &&
                tractor.isActive,
            )?.id ?? null;
      const assignedTrailerId =
        typeof trailerId === "number" ? trailerId : null;

      const now = new Date().toISOString();
      const newAssignment = {
        id: nextNumericId(mockStore.assignments),
        orderId,
        driverId,
        tractorId: assignedTractorId,
        trailerId: assignedTrailerId,
        assignedBy: userId,
        isActive: true,
        assignedAt: now,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      mockStore.assignments.push(newAssignment as never);

      mockStore.orders[orderIndex] = {
        ...mockStore.orders[orderIndex],
        assignedDriverId: driverId,
        assignedTractorId: assignedTractorId,
        assignedTrailerId: assignedTrailerId,
        status: "assigned",
        updatedAt: now,
      } as never;

      mockStore.drivers[driverIndex] = {
        ...mockStore.drivers[driverIndex],
        status: "on_load",
        updatedAt: now,
      } as never;

      if (assignedTractorId) {
        const tractorIndex = mockStore.tractors.findIndex(
          (tractor) =>
            tractor.id === assignedTractorId &&
            tractor.isActive &&
            tractor.organizationId === organizationId,
        );
        if (tractorIndex !== -1) {
          mockStore.tractors[tractorIndex] = {
            ...mockStore.tractors[tractorIndex],
            status: "assigned",
            currentDriverId: driverId,
            updatedAt: now,
          } as never;
        }
      }

      if (assignedTrailerId) {
        const trailerIndex = mockStore.trailers.findIndex(
          (trailer) =>
            trailer.id === assignedTrailerId &&
            trailer.isActive &&
            trailer.organizationId === organizationId,
        );
        if (trailerIndex !== -1) {
          mockStore.trailers[trailerIndex] = {
            ...mockStore.trailers[trailerIndex],
            status: "assigned",
            assignedTractorId: assignedTractorId,
            updatedAt: now,
          } as never;
        }
      }

      return NextResponse.json({
        data: newAssignment,
        success: true,
        message: "Load assigned successfully",
      });
    }

    if (action === "unassign") {
      if (!orderId) {
        return NextResponse.json(
          {
            success: false,
            message: "Order ID is required",
          },
          { status: 400 }
        );
      }

      // Find active assignment in mock data
      const activeAssignmentIndex = mockStore.assignments.findIndex((a) =>
        a.orderId === orderId &&
        a.isActive &&
        mockStore.orders.some(
          (order) =>
            order.id === a.orderId &&
            order.isActive &&
            order.organizationId === organizationId,
        )
      );

      if (activeAssignmentIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: "No active assignment found",
          },
          { status: 404 }
        );
      }

      // Simulate unassignment - in a real implementation, this would update the database
      // Check if driver has other active assignments
      const activeAssignment = mockStore.assignments[activeAssignmentIndex];
      const now = new Date().toISOString();
      mockStore.assignments[activeAssignmentIndex] = {
        ...activeAssignment,
        isActive: false,
        completedAt: now,
        updatedAt: now,
      } as never;

      const orderIndex = mockStore.orders.findIndex(
        (order) =>
          order.id === orderId &&
          order.isActive &&
          order.organizationId === organizationId,
      );
      if (orderIndex !== -1) {
        mockStore.orders[orderIndex] = {
          ...mockStore.orders[orderIndex],
          assignedDriverId: null,
          assignedTractorId: null,
          assignedTrailerId: null,
          status: "available",
          updatedAt: now,
        } as never;
      }

      const hasOtherAssignments = mockStore.assignments.some(
        (assignment) =>
          assignment.driverId === activeAssignment.driverId &&
          assignment.isActive &&
          assignment.id !== activeAssignment.id &&
          mockStore.orders.some(
            (order) =>
              order.id === assignment.orderId &&
              order.isActive &&
              order.organizationId === organizationId,
          ),
      );
      if (!hasOtherAssignments) {
        const driverIndex = mockStore.drivers.findIndex(
          (driver) =>
            driver.id === activeAssignment.driverId &&
            driver.isActive &&
            driver.organizationId === organizationId,
        );
        if (driverIndex !== -1) {
          mockStore.drivers[driverIndex] = {
            ...mockStore.drivers[driverIndex],
            status: "available",
            updatedAt: now,
          } as never;
        }
      }

      return NextResponse.json({
        success: true,
        message: "Load unassigned successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error handling dispatch assignment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process assignment",
      },
      { status: 500 }
    );
  }
}
