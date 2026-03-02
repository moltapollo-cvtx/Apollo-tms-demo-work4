import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chargeCode = mockStore.chargeCodes.find((cc) => cc.id === Number.parseInt(id, 10));

  if (!chargeCode) {
    return NextResponse.json({ error: "Charge code not found" }, { status: 404 });
  }

  return NextResponse.json(chargeCode);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockStore.chargeCodes.findIndex((cc) => cc.id === Number.parseInt(id, 10));

  if (idx === -1) {
    return NextResponse.json({ error: "Charge code not found" }, { status: 404 });
  }

  const body = await request.json();

  mockStore.chargeCodes[idx] = {
    ...mockStore.chargeCodes[idx],
    ...(body.code !== undefined && { code: body.code }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.type !== undefined && { type: body.type }),
    ...(body.defaultRate !== undefined && { defaultRate: parseFloat(body.defaultRate) }),
    ...(body.unit !== undefined && { unit: body.unit }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(mockStore.chargeCodes[idx]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockStore.chargeCodes.findIndex((cc) => cc.id === Number.parseInt(id, 10));

  if (idx === -1) {
    return NextResponse.json({ error: "Charge code not found" }, { status: 404 });
  }

  mockStore.chargeCodes[idx] = {
    ...mockStore.chargeCodes[idx],
    isActive: false,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ message: "Charge code deleted successfully" });
}
