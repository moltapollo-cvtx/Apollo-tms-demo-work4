import {
  allHistoricalStops,
  allMockOrders,
  mockAssignments,
  mockChargeCodes,
  mockContacts,
  mockCustomers,
  mockDriverCertifications,
  mockDriverQualifications,
  mockDrivers,
  mockInvoiceLineItems,
  mockInvoices,
  mockLocations,
  mockSettlements,
  mockStops,
  mockTractors,
  mockTrailers,
} from "@/lib/mock-data";

type AnyRecord = Record<string, unknown>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const DRIVER_STATUS_VALUES = new Set([
  "available",
  "on_load",
  "off_duty",
  "sleeper",
  "driving",
  "on_break",
]);

const ASSIGNED_STATUS_CYCLE = ["assigned", "dispatched", "in_transit"] as const;
const UNASSIGNED_STATUS_CYCLE = ["available", "assigned", "available"] as const;
const NON_DISPATCH_STATUS_CYCLE = ["completed", "delivered", "invoiced", "pending"] as const;
const PRIORITY_CYCLE = ["urgent", "high", "normal", "low"] as const;
const EQUIPMENT_CYCLE = ["dry_van", "refrigerated", "flatbed", "tanker"] as const;
const COMMODITY_CYCLE = [
  "Consumer Goods",
  "Automotive Parts",
  "Electronics",
  "Food Products",
  "Industrial Equipment",
  "Building Materials",
] as const;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isoDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toDateOnly = (value: unknown) => {
  const normalized = isoDate(value);
  if (!normalized) return null;
  return normalized.split("T")[0];
};

const normalizeDriverStatus = (value: unknown) => {
  const normalized = String(value ?? "available").toLowerCase();
  if (normalized === "on_duty") {
    return "on_load";
  }
  return DRIVER_STATUS_VALUES.has(normalized) ? normalized : "available";
};

const normalizePriority = (value: unknown, index: number) => {
  const normalized = String(value ?? "").toLowerCase();
  if (["urgent", "high", "normal", "low"].includes(normalized)) {
    return normalized;
  }
  return PRIORITY_CYCLE[index % PRIORITY_CYCLE.length];
};

const normalizeOrderRecord = (order: AnyRecord, index: number): AnyRecord => {
  const totalMiles = Math.max(
    Math.round(toNumber(order.totalMiles ?? order.miles, 400 + (index % 9) * 65)),
    120,
  );
  const ratePerMile = Math.max(
    toNumber(order.ratePerMile, 2.35 + (index % 8) * 0.14),
    1.8,
  );
  const totalRate = Number((totalMiles * ratePerMile).toFixed(2));
  const estimatedCost = Number((totalRate * 0.79).toFixed(2));
  const estimatedMargin = Number((totalRate - estimatedCost).toFixed(2));
  const priority = normalizePriority(order.priorityLevel ?? order.priority, index);
  const weight = Math.max(
    Math.round(toNumber(order.weight, 17000 + (index % 15) * 1350)),
    8000,
  );
  const pieces = Math.max(Math.round(toNumber(order.pieces, 8 + (index % 11))), 1);
  const pickupEarliest =
    isoDate(order.pickupEarliest) ??
    new Date(Date.UTC(2026, 0, 2 + (index % 20), 8 + (index % 5), 0, 0)).toISOString();
  const deliveryEarliest =
    isoDate(order.deliveryEarliest) ??
    new Date(new Date(pickupEarliest).getTime() + (1 + (index % 3)) * 24 * 60 * 60 * 1000)
      .toISOString();
  const createdAt =
    isoDate(order.createdAt) ??
    new Date(Date.UTC(2025, 10, 1 + (index % 26), 14, 0, 0)).toISOString();
  const updatedAt = isoDate(order.updatedAt) ?? createdAt;

  return {
    ...order,
    organizationId: toNumber(order.organizationId, 1),
    customerId: toNumber(order.customerId, 1),
    commodity: String(order.commodity ?? COMMODITY_CYCLE[index % COMMODITY_CYCLE.length]),
    equipmentType: String(order.equipmentType ?? EQUIPMENT_CYCLE[index % EQUIPMENT_CYCLE.length]),
    totalMiles,
    miles: String(totalMiles),
    ratePerMile: Number(ratePerMile.toFixed(2)),
    totalRate,
    totalRevenue: totalRate.toFixed(2),
    estimatedCost,
    estimatedMargin,
    marginPercent: Number(((estimatedMargin / Math.max(totalRate, 1)) * 100).toFixed(1)),
    priority,
    priorityLevel: priority,
    weight: String(weight),
    pieces,
    pickupEarliest,
    pickupLatest: isoDate(order.pickupLatest) ?? pickupEarliest,
    deliveryEarliest,
    deliveryLatest: isoDate(order.deliveryLatest) ?? deliveryEarliest,
    customerReferenceNumber:
      order.customerReferenceNumber ??
      `REF-${(3000 + (index * 73) % 7000).toString().padStart(4, "0")}`,
    status: String(order.status ?? "available"),
    assignedDriverId: null,
    assignedTractorId: null,
    assignedTrailerId: null,
    isActive: order.isActive !== false,
    createdAt,
    updatedAt,
  };
};

const createSyntheticOrder = (
  id: number,
  index: number,
  customerIds: number[],
): AnyRecord => {
  const customerId = customerIds[index % Math.max(customerIds.length, 1)] ?? 1;
  const totalMiles = 260 + (index * 97) % 1800;
  const ratePerMile = Number((2.3 + (index % 9) * 0.16).toFixed(2));
  const totalRate = Number((totalMiles * ratePerMile).toFixed(2));
  const estimatedCost = Number((totalRate * 0.8).toFixed(2));
  const estimatedMargin = Number((totalRate - estimatedCost).toFixed(2));
  const priority = PRIORITY_CYCLE[index % PRIORITY_CYCLE.length];
  const pickupEarliest = new Date(
    Date.UTC(2026, 0, 1 + (index % 24), 6 + (index % 8), 0, 0),
  ).toISOString();
  const deliveryEarliest = new Date(
    new Date(pickupEarliest).getTime() + (1 + (index % 4)) * 24 * 60 * 60 * 1000,
  ).toISOString();

  return {
    id,
    organizationId: 1,
    orderNumber: `0${(10000 + id).toString()}`,
    customerId,
    customerReferenceNumber: `AUTO-${(10000 + index).toString()}`,
    commodity: COMMODITY_CYCLE[index % COMMODITY_CYCLE.length],
    equipmentType: EQUIPMENT_CYCLE[index % EQUIPMENT_CYCLE.length],
    status: "available",
    totalMiles,
    miles: String(totalMiles),
    ratePerMile,
    totalRate,
    totalRevenue: totalRate.toFixed(2),
    estimatedCost,
    estimatedMargin,
    marginPercent: Number(((estimatedMargin / Math.max(totalRate, 1)) * 100).toFixed(1)),
    currency: "USD",
    priority,
    priorityLevel: priority,
    specialInstructions: "Seeded practice load for dispatch planning.",
    weight: String(16000 + (index % 18) * 1200),
    pieces: 6 + (index % 16),
    pickupEarliest,
    pickupLatest: pickupEarliest,
    deliveryEarliest,
    deliveryLatest: deliveryEarliest,
    assignedDriverId: null,
    assignedTractorId: null,
    assignedTrailerId: null,
    isActive: true,
    createdAt: new Date(Date.UTC(2025, 11, 1 + (index % 27), 15, 0, 0)).toISOString(),
    updatedAt: new Date(Date.UTC(2025, 11, 2 + (index % 27), 11, 0, 0)).toISOString(),
  };
};

const getTractorForDriver = (driverId: number, tractors: AnyRecord[]) => {
  const directMatch = tractors.find(
    (tractor) =>
      toNumber(tractor.id) === driverId &&
      toNumber(tractor.organizationId, 1) === 1 &&
      tractor.isActive !== false,
  );
  if (directMatch) {
    return toNumber(directMatch.id) || null;
  }

  const sortedTractors = tractors
    .filter(
      (tractor) =>
        toNumber(tractor.organizationId, 1) === 1 && tractor.isActive !== false,
    )
    .sort((a, b) => toNumber(a.id) - toNumber(b.id));
  if (sortedTractors.length === 0) {
    return null;
  }

  const tractor = sortedTractors[(driverId - 1) % sortedTractors.length];
  return toNumber(tractor.id) || null;
};

const getTrailerForDriver = (driverId: number, trailers: AnyRecord[]) => {
  const directMatch = trailers.find(
    (trailer) =>
      toNumber(trailer.id) === driverId &&
      toNumber(trailer.organizationId, 1) === 1 &&
      trailer.isActive !== false,
  );
  if (directMatch) {
    return toNumber(directMatch.id) || null;
  }

  const sortedTrailers = trailers
    .filter(
      (trailer) =>
        toNumber(trailer.organizationId, 1) === 1 && trailer.isActive !== false,
    )
    .sort((a, b) => toNumber(a.id) - toNumber(b.id));
  if (sortedTrailers.length === 0) {
    return null;
  }

  const trailer = sortedTrailers[(driverId - 1) % sortedTrailers.length];
  return toNumber(trailer.id) || null;
};

const seedDispatchPracticeData = ({
  orders,
  drivers,
  assignments,
  tractors,
  trailers,
  customers,
}: {
  orders: AnyRecord[];
  drivers: AnyRecord[];
  assignments: AnyRecord[];
  tractors: AnyRecord[];
  trailers: AnyRecord[];
  customers: AnyRecord[];
}) => {
  const seededDrivers = drivers.map((driver, index) => ({
    ...driver,
    employeeId:
      typeof driver.employeeId === "string" && driver.employeeId.trim().length > 0
        ? driver.employeeId
        : `DRV-${(1001 + index).toString()}`,
    status: normalizeDriverStatus(driver.status),
  }));

  const seededOrders = orders.map((order, index) =>
    normalizeOrderRecord(order, index),
  );

  const activeOrgDrivers = seededDrivers.filter(
    (driver) =>
      driver.isActive !== false && toNumber(driver.organizationId, 1) === 1,
  );

  const loadCountByDriver = activeOrgDrivers.map((_, index) => {
    if (index % 5 === 0) return 4;
    if (index % 2 === 0) return 3;
    return 2;
  });

  const totalAssignedLoads = loadCountByDriver.reduce((sum, count) => sum + count, 0);
  const targetUnassignedLoads = 30;
  const requiredDispatchOrders = totalAssignedLoads + targetUnassignedLoads + 5;

  const existingActiveOrgOrders = seededOrders.filter(
    (order) => order.isActive !== false && toNumber(order.organizationId, 1) === 1,
  );

  if (existingActiveOrgOrders.length < requiredDispatchOrders) {
    const customerIds = customers
      .filter((customer) => customer.isActive !== false)
      .map((customer) => toNumber(customer.id))
      .filter((id) => id > 0);
    let nextOrderId =
      seededOrders.reduce((max, order) => Math.max(max, toNumber(order.id)), 0) + 1;
    const neededCount = requiredDispatchOrders - existingActiveOrgOrders.length;
    for (let index = 0; index < neededCount; index += 1) {
      seededOrders.push(
        createSyntheticOrder(nextOrderId, seededOrders.length + index, customerIds),
      );
      nextOrderId += 1;
    }
  }

  const activeDispatchOrders = seededOrders
    .filter((order) => order.isActive !== false && toNumber(order.organizationId, 1) === 1)
    .sort((a, b) => toNumber(a.id) - toNumber(b.id));

  activeDispatchOrders.forEach((order, index) => {
    const normalized = normalizeOrderRecord(order, index);
    Object.assign(order, normalized, {
      status: "available",
      assignedDriverId: null,
      assignedTractorId: null,
      assignedTrailerId: null,
    });
  });

  const preservedAssignments = assignments.filter((assignment) => {
    const orderId = toNumber(assignment.orderId);
    const order = seededOrders.find((entry) => toNumber(entry.id) === orderId);
    return !order || toNumber(order.organizationId, 1) !== 1;
  });

  let nextAssignmentId =
    Math.max(
      0,
      ...assignments.map((assignment) => toNumber(assignment.id)),
    ) + 1;
  let orderCursor = 0;
  const seededAssignments: AnyRecord[] = [...preservedAssignments];

  const driverStatusCycle = ["on_load", "driving", "available"] as const;
  const tractorToDriver = new Map<number, number>();
  const trailerToTractor = new Map<number, number>();
  const now = Date.now();

  activeOrgDrivers.forEach((driver, driverIndex) => {
    const driverId = toNumber(driver.id);
    const loadsForDriver = loadCountByDriver[driverIndex] ?? 2;
    const tractorId = getTractorForDriver(driverId, tractors);
    const trailerId = getTrailerForDriver(driverId, trailers);
    if (tractorId) {
      tractorToDriver.set(tractorId, driverId);
    }
    if (trailerId && tractorId) {
      trailerToTractor.set(trailerId, tractorId);
    }

    for (let loadIndex = 0; loadIndex < loadsForDriver; loadIndex += 1) {
      const order = activeDispatchOrders[orderCursor];
      if (!order) {
        break;
      }

      const assignedAt = new Date(now - (orderCursor + 1) * 3 * 60 * 60 * 1000).toISOString();
      const assignedStatus =
        ASSIGNED_STATUS_CYCLE[(driverIndex + loadIndex) % ASSIGNED_STATUS_CYCLE.length];

      order.status = assignedStatus;
      order.assignedDriverId = driverId;
      order.assignedTractorId = tractorId;
      order.assignedTrailerId = trailerId;
      order.updatedAt = assignedAt;

      seededAssignments.push({
        id: nextAssignmentId,
        orderId: toNumber(order.id),
        driverId,
        tractorId,
        trailerId,
        assignedBy: "seed",
        isActive: true,
        assignedAt,
        completedAt: null,
        createdAt: assignedAt,
        updatedAt: assignedAt,
      });

      nextAssignmentId += 1;
      orderCursor += 1;
    }

    driver.status = driverStatusCycle[driverIndex % driverStatusCycle.length];
    driver.updatedAt = new Date(now - driverIndex * 30 * 60 * 1000).toISOString();
  });

  for (let index = 0; index < targetUnassignedLoads; index += 1) {
    const order = activeDispatchOrders[orderCursor + index];
    if (!order) {
      break;
    }
    const status = UNASSIGNED_STATUS_CYCLE[index % UNASSIGNED_STATUS_CYCLE.length];
    order.status = status;
    order.assignedDriverId = null;
    order.assignedTractorId = null;
    order.assignedTrailerId = null;
    order.updatedAt = new Date(now - index * 45 * 60 * 1000).toISOString();
  }
  orderCursor += targetUnassignedLoads;

  for (let index = orderCursor; index < activeDispatchOrders.length; index += 1) {
    const order = activeDispatchOrders[index];
    const status = NON_DISPATCH_STATUS_CYCLE[(index - orderCursor) % NON_DISPATCH_STATUS_CYCLE.length];
    order.status = status;
    order.assignedDriverId = null;
    order.assignedTractorId = null;
    order.assignedTrailerId = null;
  }

  const assignedTractorIds = new Set<number>();
  const assignedTrailerIds = new Set<number>();
  seededAssignments.forEach((assignment) => {
    if (assignment.isActive !== false) {
      const tractorId = toNumber(assignment.tractorId);
      const trailerId = toNumber(assignment.trailerId);
      if (tractorId > 0) assignedTractorIds.add(tractorId);
      if (trailerId > 0) assignedTrailerIds.add(trailerId);
    }
  });

  tractors.forEach((tractor) => {
    if (toNumber(tractor.organizationId, 1) !== 1) {
      return;
    }
    const tractorId = toNumber(tractor.id);
    if (tractorId <= 0) return;

    if (assignedTractorIds.has(tractorId)) {
      tractor.status = "assigned";
      tractor.currentDriverId = tractorToDriver.get(tractorId) ?? tractor.currentDriverId ?? null;
    } else {
      tractor.status = "available";
      tractor.currentDriverId = null;
    }
  });

  trailers.forEach((trailer) => {
    if (toNumber(trailer.organizationId, 1) !== 1) {
      return;
    }
    const trailerId = toNumber(trailer.id);
    if (trailerId <= 0) return;

    if (assignedTrailerIds.has(trailerId)) {
      trailer.status = "assigned";
      trailer.assignedTractorId = trailerToTractor.get(trailerId) ?? trailer.assignedTractorId ?? null;
    } else {
      trailer.status = "available";
      trailer.assignedTractorId = null;
    }
  });

  return {
    orders: seededOrders,
    drivers: seededDrivers,
    assignments: seededAssignments,
    tractors,
    trailers,
  };
};

const normalizeInvoice = (invoice: AnyRecord) => {
  const totalAmount = toNumber(invoice.totalAmount ?? invoice.amount, 0);
  const paidAmount = toNumber(
    invoice.paidAmount ??
      (invoice.status === "paid" ? totalAmount : 0),
    0,
  );
  const taxAmount = toNumber(invoice.taxAmount ?? invoice.tax, 0);
  const subtotal = toNumber(
    invoice.subtotal ?? invoice.amount ?? totalAmount - taxAmount,
    0,
  );

  return {
    id: toNumber(invoice.id),
    organizationId: toNumber(invoice.organizationId, 1),
    customerId: toNumber(invoice.customerId),
    invoiceNumber: String(invoice.invoiceNumber ?? `INV-${Date.now()}`),
    invoiceDate: String(
      toDateOnly(invoice.invoiceDate ?? invoice.createdAt) ??
        new Date().toISOString().split("T")[0],
    ),
    dueDate: toDateOnly(invoice.dueDate),
    status: String(invoice.status ?? "draft"),
    subtotal,
    taxAmount,
    totalAmount,
    paidAmount,
    balanceAmount: toNumber(
      invoice.balanceAmount ?? Math.max(0, totalAmount - paidAmount),
      0,
    ),
    notes: (invoice.notes as string | null | undefined) ?? null,
    terms:
      (invoice.terms as string | null | undefined) ??
      (invoice.paymentTerms as string | null | undefined) ??
      null,
    sentAt: isoDate(invoice.sentAt ?? invoice.sentDate),
    paidAt: isoDate(invoice.paidAt ?? invoice.paidDate),
    isActive: invoice.isActive !== false,
    createdAt:
      String(invoice.createdAt ?? new Date().toISOString()),
    updatedAt:
      String(invoice.updatedAt ?? new Date().toISOString()),
  };
};

const normalizeInvoiceLineItem = (lineItem: AnyRecord) => ({
  id: toNumber(lineItem.id),
  invoiceId: toNumber(lineItem.invoiceId),
  orderId: lineItem.orderId ? toNumber(lineItem.orderId) : null,
  chargeId: lineItem.chargeId
    ? toNumber(lineItem.chargeId)
    : lineItem.chargeCodeId
      ? toNumber(lineItem.chargeCodeId)
      : null,
  description: String(lineItem.description ?? "Charge"),
  quantity: toNumber(lineItem.quantity, 1),
  rate: toNumber(lineItem.rate ?? lineItem.amount, 0),
  amount: toNumber(lineItem.amount, 0),
  isActive: lineItem.isActive !== false,
  createdAt: String(lineItem.createdAt ?? new Date().toISOString()),
  updatedAt: String(lineItem.updatedAt ?? new Date().toISOString()),
});

const normalizeSettlement = (settlement: AnyRecord) => {
  const periodEnd =
    toDateOnly(settlement.periodEnd ?? settlement.weekEnding) ??
    new Date().toISOString().split("T")[0];
  const periodEndDate = new Date(periodEnd);
  const periodStartDate = new Date(periodEndDate);
  periodStartDate.setDate(periodStartDate.getDate() - 6);

  return {
    id: toNumber(settlement.id),
    organizationId: toNumber(settlement.organizationId, 1),
    driverId: toNumber(settlement.driverId),
    settlementNumber: String(
      settlement.settlementNumber ?? `SET-${Date.now()}`,
    ),
    periodStart:
      toDateOnly(settlement.periodStart) ??
      periodStartDate.toISOString().split("T")[0],
    periodEnd,
    status: ["draft", "pending", "paid", "cancelled"].includes(
      String(settlement.status ?? ""),
    )
      ? String(settlement.status)
      : "pending",
    grossPay: toNumber(
      settlement.grossPay ??
        settlement.driverPay ??
        settlement.grossRevenue,
      0,
    ),
    deductions: toNumber(settlement.deductions, 0),
    netPay: toNumber(settlement.netPay, 0),
    notes: (settlement.notes as string | null | undefined) ?? null,
    approvedAt: isoDate(settlement.approvedAt),
    paidAt: isoDate(settlement.paidAt ?? settlement.paidDate),
    isActive: settlement.isActive !== false,
    createdAt: String(settlement.createdAt ?? new Date().toISOString()),
    updatedAt: String(settlement.updatedAt ?? new Date().toISOString()),
  };
};

const seededInvoices = clone(mockInvoices).map((invoice) =>
  normalizeInvoice(invoice as unknown as AnyRecord),
);
const seededInvoiceLineItems = clone(mockInvoiceLineItems).map((lineItem) =>
  normalizeInvoiceLineItem(lineItem as unknown as AnyRecord),
);
const seededSettlements = clone(mockSettlements).map((settlement) =>
  normalizeSettlement(settlement as unknown as AnyRecord),
);
const seededCustomers = clone(mockCustomers) as AnyRecord[];
const seededTractors = clone(mockTractors) as AnyRecord[];
const seededTrailers = clone(mockTrailers) as AnyRecord[];
const seededDispatchData = seedDispatchPracticeData({
  orders: clone(allMockOrders) as AnyRecord[],
  drivers: clone(mockDrivers) as AnyRecord[],
  assignments: clone(mockAssignments) as AnyRecord[],
  tractors: seededTractors,
  trailers: seededTrailers,
  customers: seededCustomers,
});

export const mockStore = {
  orders: seededDispatchData.orders,
  drivers: seededDispatchData.drivers,
  customers: seededCustomers,
  tractors: seededDispatchData.tractors,
  trailers: seededDispatchData.trailers,
  assignments: seededDispatchData.assignments,
  stops: clone([...mockStops, ...allHistoricalStops]),
  invoices: seededInvoices,
  invoiceLineItems: seededInvoiceLineItems,
  settlements: seededSettlements,
  chargeCodes: clone(mockChargeCodes),
  contacts: clone(mockContacts),
  locations: clone(mockLocations),
  driverQualifications: clone(mockDriverQualifications),
  driverCertifications: clone(mockDriverCertifications),
};

export const nextNumericId = (
  collection: Array<{ id?: number | null }>,
): number => {
  const maxId = collection.reduce((max, item) => {
    const id = typeof item.id === "number" ? item.id : 0;
    return id > max ? id : max;
  }, 0);
  return maxId + 1;
};
