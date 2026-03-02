import { NextRequest, NextResponse } from "next/server";
import { mockAuthSession } from "@/lib/mock-data";
import { mockStore, nextNumericId } from "@/lib/mock-store";

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, use the mock session instead of real auth
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const isActive = searchParams.get("isActive");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter mock charge codes
    const filteredChargeCodes = mockStore.chargeCodes.filter((chargeCode) => {
      // Organization filter
      if (chargeCode.organizationId !== session.user.organizationId) return false;

      // Search filter (check code and description)
      if (search) {
        const searchLower = search.toLowerCase();
        const codeMatch = chargeCode.code.toLowerCase().includes(searchLower);
        const descMatch = chargeCode.description.toLowerCase().includes(searchLower);
        if (!codeMatch && !descMatch) return false;
      }

      // Category filter (using type instead of category)
      if (category && chargeCode.type !== category) return false;

      // Active filter
      if (isActive !== null && isActive !== "") {
        if (chargeCode.isActive !== (isActive === "true")) return false;
      }

      return true;
    });

    // Sort by creation date (newest first)
    filteredChargeCodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = filteredChargeCodes.length;
    const results = filteredChargeCodes.slice(offset, offset + limit);

    return NextResponse.json({
      data: results,
      total: total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching charge codes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // For demo purposes, use the mock session instead of real auth
    const session = mockAuthSession;
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Simulate creating a new charge code
    const newChargeCode = {
      id: nextNumericId(mockStore.chargeCodes),
      organizationId: session.user.organizationId,
      code: body.code,
      description: body.description,
      type: body.category || body.type || "general", // map category to type
      defaultRate: body.defaultRate || 0,
      unit: body.unit || "each",
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.chargeCodes.unshift(newChargeCode as never);

    return NextResponse.json(newChargeCode, { status: 201 });
  } catch (error) {
    console.error("Error creating charge code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
