import { NextRequest, NextResponse } from "next/server";
import { mockAuthSession } from "@/lib/mock-data";
import { mockStore, nextNumericId } from "@/lib/mock-store";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function GET(request: NextRequest) {
  try {
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const status = searchParams.get("status") || "";
    const driverId = searchParams.get("driverId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    let settlements = mockStore.settlements.filter((settlement) => {
      if (settlement.organizationId !== session.user.organizationId) return false;
      if (search && !settlement.settlementNumber.toLowerCase().includes(search)) return false;
      if (status && settlement.status !== status) return false;
      if (driverId && settlement.driverId !== Number.parseInt(driverId, 10)) return false;
      if (startDate && new Date(settlement.periodEnd) < new Date(startDate)) return false;
      if (endDate && new Date(settlement.periodEnd) > new Date(endDate)) return false;
      return true;
    });

    settlements = settlements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = settlements.length;
    const data = settlements.slice(offset, offset + limit).map((settlement) => {
      const driver = mockStore.drivers.find((entry) => entry.id === settlement.driverId);
      return {
        ...settlement,
        driver: driver
          ? {
              id: driver.id,
              firstName: driver.firstName,
              lastName: driver.lastName,
              employeeId: driver.employeeId ?? `EMP${String(driver.id).padStart(3, "0")}`,
              phone: driver.phone ?? null,
              email: driver.email ?? null,
              payStructure: driver.payStructure ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const now = new Date().toISOString();
    const driverId = Number(body.driverId ?? body.driver?.id);

    if (!Number.isInteger(driverId) || driverId <= 0) {
      return NextResponse.json({ error: "driverId is required" }, { status: 400 });
    }
    if (!body.periodStart || !body.periodEnd) {
      return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
    }

    const settlement = {
      id: nextNumericId(mockStore.settlements),
      organizationId: session.user.organizationId,
      driverId,
      settlementNumber: `SET-${new Date().getFullYear()}-${String(nextNumericId(mockStore.settlements)).padStart(4, "0")}`,
      periodStart: String(body.periodStart),
      periodEnd: String(body.periodEnd),
      status: body.status || "draft",
      grossPay: toNumber(body.grossPay, 0),
      deductions: toNumber(body.deductions, 0),
      netPay: toNumber(body.netPay, 0),
      notes: body.notes ?? null,
      approvedAt: null,
      paidAt: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    mockStore.settlements.unshift(settlement);

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Error creating settlement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

