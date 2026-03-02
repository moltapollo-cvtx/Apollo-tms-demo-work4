import type { LoadStatus } from "@/types";

type MockEntity = Record<string, unknown>;

export interface MockStoreSnapshot {
  stops: MockEntity[];
  assignments: MockEntity[];
  customers: MockEntity[];
  drivers: MockEntity[];
  tractors: MockEntity[];
  trailers: MockEntity[];
}

const statusMap: Record<string, LoadStatus> = {
  pending: "available",
  invoiced: "completed",
  available: "available",
  assigned: "assigned",
  dispatched: "dispatched",
  in_transit: "in_transit",
  at_pickup: "at_pickup",
  at_delivery: "at_delivery",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
  problem: "problem",
};

const toStringSafe = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toNumberSafe = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toBooleanSafe = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};

const toIso = (value: unknown): string | null => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const toDateOnly = (value: unknown): string | null => {
  const iso = toIso(value);
  return iso ? iso.split("T")[0] : null;
};

const parseAddress = (address: string) => {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const stateZipSegment = segments[segments.length - 1] || "";
  const citySegment = segments[segments.length - 2] || "";
  const stateZipMatch = stateZipSegment.match(
    /([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?/,
  );

  return {
    city: citySegment || undefined,
    state: stateZipMatch?.[1]?.toUpperCase(),
    zipCode: stateZipMatch?.[2],
  };
};

const normalizeStop = (
  stop: MockEntity,
  fallbackType: "pickup" | "delivery",
  fallbackSequence: number,
): MockEntity => {
  const address = toStringSafe(stop.address, "Not assigned");
  const parsed = parseAddress(address);
  const scheduledDate = toIso(
    stop.scheduledDate ?? stop.scheduledArrival ?? stop.scheduledDateTime,
  );
  const actualArrival = toIso(stop.actualArrival ?? stop.actualDateTime);
  const actualDeparture = toIso(stop.actualDeparture);
  const rawStatus = toStringSafe(stop.status).toLowerCase();
  const isCompleted =
    toBooleanSafe(stop.isCompleted) ||
    rawStatus === "completed" ||
    Boolean(actualDeparture);

  return {
    id: toNumberSafe(stop.id),
    orderId: toNumberSafe(stop.orderId),
    locationId: stop.locationId ?? null,
    sequence: toNumberSafe(stop.sequence, fallbackSequence),
    type: toStringSafe(stop.type, fallbackType),
    address,
    city: toStringSafe(stop.city, parsed.city || "Not assigned"),
    state: toStringSafe(stop.state, parsed.state || ""),
    zipCode: toStringSafe(stop.zipCode, parsed.zipCode || ""),
    scheduledDate,
    scheduledTimeStart: stop.scheduledTimeStart ?? null,
    scheduledTimeEnd: stop.scheduledTimeEnd ?? null,
    actualArrival,
    actualDeparture,
    contactName: stop.contactName ?? null,
    contactPhone: stop.contactPhone ?? null,
    specialInstructions: stop.specialInstructions ?? stop.notes ?? null,
    isCompleted,
    createdAt: toIso(stop.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(stop.updatedAt) ?? new Date().toISOString(),
  };
};

export const normalizeOrderStatus = (value: unknown): LoadStatus => {
  const status = toStringSafe(value, "available").toLowerCase();
  return statusMap[status] || "available";
};

export const normalizeOrderForUi = (order: MockEntity): MockEntity => {
  const totalRate = toNumberSafe(order.totalRate ?? order.totalRevenue, 0);
  const totalRevenue = toNumberSafe(order.totalRevenue ?? order.totalRate, 0);
  const estimatedMargin = toNumberSafe(order.estimatedMargin ?? order.margin, 0);
  const margin = toNumberSafe(order.margin ?? order.estimatedMargin, 0);

  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    totalRate,
    totalRevenue,
    estimatedMargin,
    margin,
    priorityLevel: toStringSafe(order.priorityLevel ?? order.priority, "normal"),
    notes: order.notes ?? order.specialInstructions ?? null,
  };
};

export const buildOrderStops = (
  order: MockEntity,
  mockStore: MockStoreSnapshot,
): MockEntity[] => {
  const orderId = toNumberSafe(order.id);
  const storedStops = mockStore.stops
    .filter(
      (stop) =>
        toNumberSafe(stop.orderId) === orderId &&
        toBooleanSafe(stop.isActive, true),
    )
    .sort((a, b) => toNumberSafe(a.sequence) - toNumberSafe(b.sequence))
    .map((stop, index) =>
      normalizeStop(
        stop,
        index === 0 ? "pickup" : "delivery",
        index + 1,
      ),
    );

  if (storedStops.length > 0) {
    return storedStops;
  }

  const customer = mockStore.customers.find(
    (entry) => toNumberSafe(entry.id) === toNumberSafe(order.customerId),
  );
  const customerAddress =
    customer && typeof customer.address === "object" && customer.address
      ? (customer.address as Record<string, unknown>)
      : null;

  const pickupAddressParts = {
    street: toStringSafe(customerAddress?.street, "Not assigned"),
    city: toStringSafe(customerAddress?.city, "Not assigned"),
    state: toStringSafe(customerAddress?.state, ""),
    zipCode: toStringSafe(customerAddress?.zipCode, ""),
  };
  const pickupAddress =
    pickupAddressParts.street === "Not assigned"
      ? "Not assigned"
      : `${pickupAddressParts.street}, ${pickupAddressParts.city}, ${pickupAddressParts.state} ${pickupAddressParts.zipCode}`.trim();

  const fallbackStops: MockEntity[] = [
    normalizeStop(
      {
        id: orderId * 100 + 1,
        orderId,
        sequence: 1,
        type: "pickup",
        address: pickupAddress,
        city: pickupAddressParts.city,
        state: pickupAddressParts.state,
        zipCode: pickupAddressParts.zipCode,
        scheduledDate: order.pickupEarliest ?? null,
      },
      "pickup",
      1,
    ),
    normalizeStop(
      {
        id: orderId * 100 + 2,
        orderId,
        sequence: 2,
        type: "delivery",
        address: "Not assigned",
        city: "Not assigned",
        state: "",
        zipCode: "",
        scheduledDate: order.deliveryEarliest ?? null,
      },
      "delivery",
      2,
    ),
  ];

  return fallbackStops;
};

export const buildOrderAssignments = (
  order: MockEntity,
  mockStore: MockStoreSnapshot,
): MockEntity[] => {
  const orderId = toNumberSafe(order.id);
  const assignments = mockStore.assignments.filter(
    (assignment) =>
      toNumberSafe(assignment.orderId) === orderId &&
      toBooleanSafe(assignment.isActive, true),
  );

  if (assignments.length === 0 && !order.assignedDriverId) {
    return [];
  }

  const sourceAssignments =
    assignments.length > 0
      ? assignments
      : [
          {
            id: orderId * 100 + 1,
            orderId,
            driverId: order.assignedDriverId ?? null,
            tractorId: order.assignedTractorId ?? null,
            trailerId: order.assignedTrailerId ?? null,
            isActive: true,
            assignedAt: order.updatedAt ?? order.createdAt ?? new Date().toISOString(),
          },
        ];

  return sourceAssignments.map((assignment) => {
    const driverId = toNumberSafe(assignment.driverId);
    const tractorId = toNumberSafe(assignment.tractorId);
    const trailerId = toNumberSafe(assignment.trailerId);
    const driver = mockStore.drivers.find((entry) => toNumberSafe(entry.id) === driverId);
    const tractor = mockStore.tractors.find((entry) => toNumberSafe(entry.id) === tractorId);
    const trailer = mockStore.trailers.find((entry) => toNumberSafe(entry.id) === trailerId);

    return {
      ...assignment,
      id: toNumberSafe(assignment.id),
      orderId,
      driverId: driverId || null,
      tractorId: tractorId || null,
      trailerId: trailerId || null,
      isActive: toBooleanSafe(assignment.isActive, true),
      assignedAt: toIso(assignment.assignedAt) ?? new Date().toISOString(),
      dispatchedAt: toIso(assignment.dispatchedAt),
      unassignedAt: toIso(assignment.unassignedAt),
      ...(driver ? { driver } : {}),
      ...(tractor ? { tractor } : {}),
      ...(trailer ? { trailer } : {}),
    };
  });
};

export const buildOrderCharges = (order: MockEntity): MockEntity[] => {
  const orderId = toNumberSafe(order.id);
  const totalMiles = Math.max(toNumberSafe(order.totalMiles, 0), 1);
  const totalRate = toNumberSafe(order.totalRate ?? order.totalRevenue, 0);
  const ratePerMile = toNumberSafe(order.ratePerMile, totalRate / totalMiles);
  const estimatedCost = toNumberSafe(order.estimatedCost, totalRate * 0.8);

  const charges: MockEntity[] = [
    {
      id: orderId * 100 + 1,
      orderId,
      description: "Line Haul Transportation",
      quantity: totalMiles,
      rate: ratePerMile,
      amount: totalRate,
      billToCustomer: true,
      payToDriver: false,
      glAccount: "4000",
    },
  ];

  if (estimatedCost > 0) {
    charges.push({
      id: orderId * 100 + 2,
      orderId,
      description: "Estimated Carrier Cost",
      quantity: 1,
      rate: estimatedCost,
      amount: estimatedCost,
      billToCustomer: false,
      payToDriver: true,
      glAccount: "5000",
    });
  }

  return charges;
};

export const buildOrderTrackingEvents = (
  order: MockEntity,
  stops: MockEntity[],
): MockEntity[] => {
  const orderId = toNumberSafe(order.id);
  const status = normalizeOrderStatus(order.status);
  const pickup = stops.find((stop) => toStringSafe(stop.type) === "pickup");
  const delivery = stops.find((stop) => toStringSafe(stop.type) === "delivery");
  const pickupAddress = toStringSafe(pickup?.address, "Origin not assigned");
  const deliveryAddress = toStringSafe(delivery?.address, "Destination not assigned");
  const createdAt = toIso(order.createdAt) ?? new Date().toISOString();
  const updatedAt = toIso(order.updatedAt) ?? createdAt;
  const actualPickup = toIso(order.actualPickupTime);
  const actualDelivery = toIso(order.actualDeliveryTime);

  const events: MockEntity[] = [
    {
      id: orderId * 1000 + 1,
      orderId,
      eventType: "order_created",
      eventTime: createdAt,
      address: pickupAddress,
      source: "system",
      notes: `Order ${toStringSafe(order.orderNumber, `#${orderId}`)} created.`,
    },
  ];

  if (actualPickup) {
    events.push({
      id: orderId * 1000 + 2,
      orderId,
      eventType: "at_pickup",
      eventTime: actualPickup,
      address: pickupAddress,
      source: "driver",
      notes: "Shipment arrived for pickup.",
    });
  }

  if (status !== "available" && status !== "assigned") {
    events.push({
      id: orderId * 1000 + 3,
      orderId,
      eventType: status,
      eventTime: updatedAt,
      address: status === "at_delivery" || status === "delivered" || status === "completed"
        ? deliveryAddress
        : pickupAddress,
      source: "dispatch",
      notes: `Status updated to ${status.replace(/_/g, " ")}.`,
    });
  }

  if (actualDelivery) {
    events.push({
      id: orderId * 1000 + 4,
      orderId,
      eventType: "delivered",
      eventTime: actualDelivery,
      address: deliveryAddress,
      source: "driver",
      notes: "Delivery confirmed at destination.",
    });
  }

  return events.sort(
    (a, b) =>
      new Date(String(b.eventTime || 0)).getTime() -
      new Date(String(a.eventTime || 0)).getTime(),
  );
};

export const buildOrderDocuments = (order: MockEntity): MockEntity[] => {
  const orderId = toNumberSafe(order.id);
  const status = normalizeOrderStatus(order.status);
  const createdAt = toIso(order.createdAt) ?? new Date().toISOString();
  const updatedAt = toIso(order.updatedAt) ?? createdAt;
  const orderNumber = toStringSafe(order.orderNumber, `0${String(orderId).padStart(5, "0")}`);

  const documents: MockEntity[] = [
    {
      id: orderId * 10000 + 1,
      organizationId: toNumberSafe(order.organizationId, 1),
      orderId,
      documentType: "bol",
      fileName: `${orderNumber}-BOL.pdf`,
      mimeType: "application/pdf",
      fileSize: 285_450,
      storagePath: `mock/${orderNumber.toLowerCase()}-bol.pdf`,
      url: "/mock/epod-1.svg",
      isPublic: true,
      createdAt,
      updatedAt,
      isActive: true,
    },
  ];

  if (status === "delivered" || status === "completed") {
    documents.push({
      id: orderId * 10000 + 2,
      organizationId: toNumberSafe(order.organizationId, 1),
      orderId,
      documentType: "pod",
      fileName: `${orderNumber}-POD.pdf`,
      mimeType: "application/pdf",
      fileSize: 192_115,
      storagePath: `mock/${orderNumber.toLowerCase()}-pod.pdf`,
      url: "/mock/epod-2.svg",
      isPublic: true,
      createdAt: updatedAt,
      updatedAt,
      isActive: true,
    });
  }

  return documents;
};

export const matchesOrderSearch = (
  order: MockEntity,
  mockStore: MockStoreSnapshot,
  rawQuery: string,
): boolean => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const customer = mockStore.customers.find(
    (entry) => toNumberSafe(entry.id) === toNumberSafe(order.customerId),
  );
  const stops = buildOrderStops(order, mockStore);
  const routeText = stops
    .map((stop) =>
      [
        toStringSafe(stop.city),
        toStringSafe(stop.state),
        toStringSafe(stop.address),
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ")
    .toLowerCase();

  const haystacks = [
    toStringSafe(order.orderNumber).toLowerCase(),
    toStringSafe(order.commodity).toLowerCase(),
    toStringSafe(order.customerReferenceNumber).toLowerCase(),
    toStringSafe(order.equipmentType).replace(/_/g, " ").toLowerCase(),
    toStringSafe(customer?.name).toLowerCase(),
    routeText,
  ];

  return haystacks.some((value) => value.includes(query));
};

export interface LoadFlags {
  isOverdue: boolean;
  isUrgent: boolean;
  isUnassigned: boolean;
  assignedDriverName: string | null;
  assignedEquipment: string | null;
}

const TERMINAL_STATUSES = new Set(["delivered", "completed", "cancelled"]);

export const computeLoadFlags = (
  order: MockEntity,
  snap: MockStoreSnapshot,
): LoadFlags => {
  const orderId = toNumberSafe(order.id);
  const status = toStringSafe(order.status).toLowerCase();
  const isTerminal = TERMINAL_STATUSES.has(status);

  // --- isUnassigned ---
  const activeAssignment = snap.assignments.find(
    (a) =>
      toNumberSafe(a.orderId) === orderId &&
      toBooleanSafe(a.isActive, true),
  );
  const isUnassigned = !isTerminal && !activeAssignment;

  // --- isOverdue ---
  const now = Date.now();
  const deliveryLatest = toStringSafe(order.deliveryLatest);
  const deliveryEarliest = toStringSafe(order.deliveryEarliest);
  const latestMs = deliveryLatest ? new Date(deliveryLatest).getTime() : NaN;
  const earliestMs = deliveryEarliest ? new Date(deliveryEarliest).getTime() : NaN;
  const isOverdue =
    !isTerminal &&
    ((!Number.isNaN(latestMs) && latestMs < now) ||
      (!Number.isNaN(earliestMs) && earliestMs < now));

  // --- isUrgent ---
  const priority = toStringSafe(order.priorityLevel ?? order.priority).toLowerCase();
  const isUrgent = priority === "urgent" || isOverdue;

  // --- assigned driver name ---
  let assignedDriverName: string | null = null;
  let assignedEquipment: string | null = null;

  if (activeAssignment) {
    const driverId = toNumberSafe(activeAssignment.driverId);
    if (driverId > 0) {
      const driver = snap.drivers.find((d) => toNumberSafe(d.id) === driverId);
      if (driver) {
        assignedDriverName = `${toStringSafe(driver.firstName)} ${toStringSafe(driver.lastName)}`.trim() || null;
      }
    }
    const tractorId = toNumberSafe(activeAssignment.tractorId);
    const trailerId = toNumberSafe(activeAssignment.trailerId);
    const tractor = tractorId > 0
      ? snap.tractors.find((t) => toNumberSafe(t.id) === tractorId)
      : null;
    const trailer = trailerId > 0
      ? snap.trailers.find((t) => toNumberSafe(t.id) === trailerId)
      : null;
    const parts: string[] = [];
    if (tractor) parts.push(toStringSafe(tractor.unitNumber));
    if (trailer) parts.push(toStringSafe(trailer.unitNumber));
    assignedEquipment = parts.length > 0 ? parts.join(" / ") : null;
  }

  return { isOverdue, isUrgent, isUnassigned, assignedDriverName, assignedEquipment };
};

export const createReferenceNumber = () =>
  `REF-${Math.floor(1000 + Math.random() * 9000)}`;

export const toIsoDateInput = (value: unknown) => toDateOnly(value);
