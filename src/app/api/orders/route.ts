import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { mockStore, nextNumericId } from "@/lib/mock-store";
import {
  buildOrderAssignments,
  buildOrderCharges,
  buildOrderDocuments,
  buildOrderStops,
  buildOrderTrackingEvents,
  computeLoadFlags,
  createReferenceNumber,
  matchesOrderSearch,
  normalizeOrderForUi,
  normalizeOrderStatus,
} from "@/lib/order-api-utils";

type OrderRecord = Record<string, unknown>;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toIso = (value: unknown) => {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const toText = (value: unknown) => String(value ?? "").trim();

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(
      1,
      Number.parseInt(searchParams.get("pageSize") || "25", 10),
    );
    const offset = (page - 1) * pageSize;

    // Filters
    const status = searchParams
      .get("status")
      ?.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const customerId = searchParams.get("customerId");
    const equipmentType = searchParams
      .get("equipmentType")
      ?.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const search = searchParams.get("search");
    const include = searchParams.get("include")?.split(",") || [];

    // Filter mock orders
    const filteredOrders = mockStore.orders.filter((order) => {
      if (!order.isActive) {
        return false;
      }
      if (order.organizationId !== organizationId) {
        return false;
      }

      const normalizedOrder = normalizeOrderForUi(order as unknown as OrderRecord);
      const normalizedStatus = String(normalizedOrder.status);

      // Status filter
      if (status && status.length > 0 && !status.includes(normalizedStatus)) {
        return false;
      }

      // Customer ID filter
      if (customerId && order.customerId !== Number.parseInt(customerId, 10)) {
        return false;
      }

      // Equipment type filter
      if (
        equipmentType &&
        equipmentType.length > 0 &&
        !equipmentType.includes(String(order.equipmentType))
      ) {
        return false;
      }

      // Search filter
      if (search && !matchesOrderSearch(order as unknown as OrderRecord, mockStore, search)) {
        return false;
      }

      return true;
    });

    // Sort by created date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / pageSize);

    // Paginate
    const paginatedOrders = filteredOrders.slice(offset, offset + pageSize);

    // Add included data
    const ordersWithIncludes = paginatedOrders.map((order) => {
      const normalizedOrder = normalizeOrderForUi(order as unknown as OrderRecord);
      const flags = computeLoadFlags(order as unknown as OrderRecord, mockStore);
      const response: Record<string, unknown> = { ...normalizedOrder, ...flags };
      const stops = buildOrderStops(order as unknown as OrderRecord, mockStore);

      // Add customer data if requested
      if (include.includes("customer")) {
        const customer = mockStore.customers.find(
          (c) =>
            c.id === order.customerId &&
            c.organizationId === organizationId &&
            c.isActive,
        );
        if (customer) {
          response.customer = customer;
        }
      }

      // Add stops if requested
      if (include.includes("stops")) {
        response.stops = stops;
      }

      // Add charges if requested
      if (include.includes("charges")) {
        response.charges = buildOrderCharges(order as unknown as OrderRecord);
      }

      // Add assignments if requested
      if (include.includes("assignments")) {
        response.assignments = buildOrderAssignments(
          order as unknown as OrderRecord,
          mockStore,
        );
      }

      // Add tracking if requested
      if (include.includes("trackingEvents")) {
        response.trackingEvents = buildOrderTrackingEvents(
          order as unknown as OrderRecord,
          stops,
        );
      }

      // Add documents if requested
      if (include.includes("documents")) {
        response.documents = buildOrderDocuments(order as unknown as OrderRecord);
      }

      return response;
    });

    return NextResponse.json({
      data: ordersWithIncludes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = (await request.json()) as Record<string, unknown>;

    // Validate required fields
    const requiredFields = ["customerId", "commodity", "equipmentType"];
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

    const customerIdValue = toNumber(body.customerId);
    const customer = mockStore.customers.find(
      (entry) =>
        entry.id === customerIdValue &&
        entry.organizationId === organizationId &&
        entry.isActive,
    );
    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer was not found for your organization",
        },
        { status: 400 },
      );
    }

    // Generate order number if not provided
    if (!body.orderNumber) {
      const lastNumber =
        Math.max(
          ...mockStore.orders.map((o) =>
            Number.parseInt(String(o.orderNumber).replace(/\D/g, ""), 10),
          ),
          0,
        ) || 0;
      const nextNumber = lastNumber + 1;
      body.orderNumber = `0${(10000 + nextNumber).toString()}`;
    }

    const totalMiles = Math.max(toNumber(body.totalMiles, 500), 1);
    const ratePerMile = Math.max(toNumber(body.ratePerMile, 2.5), 0);
    const totalRate =
      toNumber(body.totalRate, 0) > 0
        ? toNumber(body.totalRate, 0)
        : totalMiles * ratePerMile;
    const estimatedCost =
      toNumber(body.estimatedCost, 0) > 0
        ? toNumber(body.estimatedCost, 0)
        : totalRate * 0.8;
    const estimatedMargin =
      toNumber(body.estimatedMargin, 0) > 0
        ? toNumber(body.estimatedMargin, 0)
        : totalRate - estimatedCost;

    const pickupEarliest =
      toIso(body.pickupEarliest) ||
      (toText(body.pickupDate) ? toIso(`${toText(body.pickupDate)}T08:00:00Z`) : null);
    const deliveryEarliest =
      toIso(body.deliveryEarliest) ||
      (toText(body.deliveryDate)
        ? toIso(`${toText(body.deliveryDate)}T16:00:00Z`)
        : null);

    // Create mock order
    const newOrder = {
      id: nextNumericId(mockStore.orders),
      organizationId,
      orderNumber: body.orderNumber,
      customerId: customerIdValue,
      customerReferenceNumber:
        body.customerReferenceNumber || createReferenceNumber(),
      commodity: toText(body.commodity),
      equipmentType: toText(body.equipmentType),
      status: normalizeOrderStatus(body.status),
      totalMiles,
      ratePerMile,
      totalRate,
      estimatedCost,
      estimatedMargin,
      marginPercent:
        totalRate > 0
          ? Number(((estimatedMargin / totalRate) * 100).toFixed(2))
          : 0,
      currency: toText(body.currency) || "USD",
      priority: toText(body.priorityLevel || body.priority) || "normal",
      specialInstructions: toText(body.specialInstructions),
      pickupEarliest,
      pickupLatest: toIso(body.pickupLatest) || pickupEarliest,
      deliveryEarliest,
      deliveryLatest: toIso(body.deliveryLatest) || deliveryEarliest,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStore.orders.unshift(newOrder as never);

    const pickupCity = toText(body.originCity);
    const pickupState = toText(body.originState).toUpperCase();
    const deliveryCity = toText(body.destCity);
    const deliveryState = toText(body.destState).toUpperCase();

    if (pickupCity || pickupState) {
      mockStore.stops.push(
        {
          id: nextNumericId(mockStore.stops),
          orderId: newOrder.id,
          sequence: 1,
          type: "pickup",
          address: `${pickupCity || "Origin"}, ${pickupState || "ST"}`,
          city: pickupCity || "Not assigned",
          state: pickupState || "",
          zipCode: "",
          scheduledDate: pickupEarliest,
          scheduledArrival: pickupEarliest,
          actualArrival: null,
          actualDeparture: null,
          isCompleted: false,
          isActive: true,
          createdAt: newOrder.createdAt,
          updatedAt: newOrder.updatedAt,
        } as never,
      );
    }

    if (deliveryCity || deliveryState) {
      mockStore.stops.push(
        {
          id: nextNumericId(mockStore.stops),
          orderId: newOrder.id,
          sequence: 2,
          type: "delivery",
          address: `${deliveryCity || "Destination"}, ${deliveryState || "ST"}`,
          city: deliveryCity || "Not assigned",
          state: deliveryState || "",
          zipCode: "",
          scheduledDate: deliveryEarliest,
          scheduledArrival: deliveryEarliest,
          actualArrival: null,
          actualDeparture: null,
          isCompleted: false,
          isActive: true,
          createdAt: newOrder.createdAt,
          updatedAt: newOrder.updatedAt,
        } as never,
      );
    }

    const normalizedOrder = normalizeOrderForUi(newOrder as unknown as OrderRecord);
    const responseData: Record<string, unknown> = {
      ...normalizedOrder,
      customer,
      stops: buildOrderStops(newOrder as unknown as OrderRecord, mockStore),
    };

    return NextResponse.json({
      data: responseData,
      success: true,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
      },
      { status: 500 }
    );
  }
}
