import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { mockStore } from "@/lib/mock-store";
import { computeLoadFlags, normalizeOrderStatus } from "@/lib/order-api-utils";

type MockEntity = Record<string, unknown>;

const toNum = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const ACTIVE_STATUSES = new Set(["in_transit", "dispatched", "assigned", "at_pickup", "at_delivery"]);

export async function GET() {
  try {
    const { organizationId } = await getAuthContext();

    const orgOrders = mockStore.orders.filter(
      (o) => o.isActive !== false && toNum(o.organizationId, 1) === organizationId,
    );

    // --- Active loads ---
    const activeLoads = orgOrders.filter((o) =>
      ACTIVE_STATUSES.has(normalizeOrderStatus(o.status)),
    ).length;

    // --- Revenue (sum of totalRate for all org orders) ---
    const revenue = orgOrders.reduce((sum, o) => sum + toNum(o.totalRate), 0);

    // --- Trucks in service ---
    const orgTractors = mockStore.tractors.filter(
      (t) => t.isActive !== false && toNum(t.organizationId, 1) === organizationId,
    );
    const totalTractors = orgTractors.length;
    const inServiceTractors = orgTractors.filter(
      (t) => String(t.status) !== "maintenance" && String(t.status) !== "out_of_service",
    ).length;

    // --- On-time delivery ---
    const deliveredOrders = orgOrders.filter(
      (o) => normalizeOrderStatus(o.status) === "delivered" || normalizeOrderStatus(o.status) === "completed",
    );
    let onTimeCount = 0;
    for (const order of deliveredOrders) {
      const actualDelivery = order.actualDeliveryTime ?? order.updatedAt;
      const deliveryLatest = order.deliveryLatest;
      if (!actualDelivery || !deliveryLatest) {
        // No data to compare — assume on-time
        onTimeCount += 1;
        continue;
      }
      if (new Date(String(actualDelivery)).getTime() <= new Date(String(deliveryLatest)).getTime()) {
        onTimeCount += 1;
      }
    }
    const onTimeDelivery = deliveredOrders.length > 0
      ? Number(((onTimeCount / deliveredOrders.length) * 100).toFixed(1))
      : 100;

    // --- Needs attention ---
    let overdueCount = 0;
    let urgentCount = 0;
    let unassignedCount = 0;
    for (const order of orgOrders) {
      const flags = computeLoadFlags(order as unknown as MockEntity, mockStore);
      if (flags.isOverdue) overdueCount += 1;
      if (flags.isUrgent) urgentCount += 1;
      if (flags.isUnassigned) unassignedCount += 1;
    }

    // --- Recent activity (last 5 orders by updatedAt) ---
    const recentOrders = [...orgOrders]
      .sort(
        (a, b) =>
          new Date(String(b.updatedAt ?? 0)).getTime() -
          new Date(String(a.updatedAt ?? 0)).getTime(),
      )
      .slice(0, 5);

    const recentActivity = recentOrders.map((order) => {
      const status = normalizeOrderStatus(order.status);
      const orderNumber = String(order.orderNumber ?? `0${(10000 + order.id).toString()}`);
      const customer = mockStore.customers.find(
        (c) => toNum(c.id) === toNum(order.customerId),
      );
      const customerName = customer ? String(customer.name) : "Unknown";
      let text: string;
      switch (status) {
        case "dispatched":
          text = `${orderNumber} dispatched for ${customerName}`;
          break;
        case "in_transit":
          text = `${orderNumber} in transit for ${customerName}`;
          break;
        case "delivered":
          text = `${orderNumber} delivered for ${customerName}`;
          break;
        case "completed":
          text = `${orderNumber} completed for ${customerName}`;
          break;
        case "assigned":
          text = `${orderNumber} assigned for ${customerName}`;
          break;
        default:
          text = `${orderNumber} updated — ${status.replace(/_/g, " ")}`;
      }
      return {
        orderId: toNum(order.id),
        orderNumber,
        text,
        updatedAt: String(order.updatedAt ?? order.createdAt),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        activeLoads,
        revenue,
        trucksInService: { active: inServiceTractors, total: totalTractors },
        onTimeDelivery,
        needsAttention: { overdue: overdueCount, urgent: urgentCount, unassigned: unassignedCount },
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
