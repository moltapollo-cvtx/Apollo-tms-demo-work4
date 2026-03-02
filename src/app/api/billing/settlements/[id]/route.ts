import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const settlement = mockStore.settlements.find((s) => s.id === Number.parseInt(id, 10));

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const driver = mockStore.drivers.find((d) => d.id === settlement.driverId) ?? null;

  return NextResponse.json({
    ...settlement,
    driver: driver
      ? {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          employeeId: driver.employeeId ?? null,
          phone: driver.phone ?? null,
          email: driver.email ?? null,
          payStructure: driver.payStructure ?? null,
        }
      : null,
    items: [],
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockStore.settlements.findIndex((s) => s.id === Number.parseInt(id, 10));

  if (idx === -1) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const current = mockStore.settlements[idx];
  mockStore.settlements[idx] = {
    ...current,
    ...(body.status !== undefined && { status: body.status }),
    ...(body.notes !== undefined && { notes: body.notes }),
    ...(body.grossPay !== undefined && { grossPay: Number(body.grossPay) }),
    ...(body.deductions !== undefined && { deductions: Number(body.deductions) }),
    ...(body.netPay !== undefined && { netPay: Number(body.netPay) }),
    ...(body.status === "paid" && !current.paidAt && { paidAt: now }),
    ...(body.status === "pending" && !current.approvedAt && { approvedAt: now }),
    updatedAt: now,
  };

  return NextResponse.json(mockStore.settlements[idx]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockStore.settlements.findIndex((s) => s.id === Number.parseInt(id, 10));

  if (idx === -1) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  mockStore.settlements[idx] = {
    ...mockStore.settlements[idx],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ message: "Settlement cancelled successfully" });
}
