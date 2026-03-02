import { NextRequest, NextResponse } from "next/server";
import { mockAnalytics } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("range") || "mtd"; // daily, weekly, mtd, ytd
    const requestedRole = searchParams.get("role");
    const role = requestedRole || "admin";

    const now = new Date();

    // Calculate date ranges
    let startDate: Date;
    const endDate = now;

    switch (dateRange) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "mtd":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Use mock analytics data
    const kpis = mockAnalytics.kpis;

    // Generate trend data for sparklines (last 30 days)
    const generateSparklineData = (baseValue: number, variance: number = 0.1) => {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * variance * baseValue;
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(0, baseValue + variation)
        });
      }
      return data;
    };

    // Role-based KPI selection
    const allKpis = {
      revenue: {
        label: `Revenue (${dateRange.toUpperCase()})`,
        value: kpis.totalRevenue,
        format: "currency",
        trend: kpis.revenueGrowth,
        sparklineData: generateSparklineData(kpis.totalRevenue / 30, 0.1)
      },
      margin: {
        label: "Margin %",
        value: kpis.averageMarginPercent,
        format: "percentage",
        trend: kpis.marginGrowth,
        sparklineData: generateSparklineData(kpis.averageMarginPercent, 0.05)
      },
      loadCount: {
        label: "Active Orders",
        value: kpis.activeOrders,
        format: "number",
        trend: 5.8,
        sparklineData: generateSparklineData(kpis.activeOrders, 0.15)
      },
      onTimePercent: {
        label: "On-Time %",
        value: kpis.onTimeDeliveryRate,
        format: "percentage",
        trend: 2.1,
        sparklineData: generateSparklineData(kpis.onTimeDeliveryRate, 0.03)
      },
      fuelEfficiency: {
        label: "Fuel Efficiency (MPG)",
        value: kpis.fuelEfficiency,
        format: "decimal",
        trend: 1.4,
        sparklineData: generateSparklineData(kpis.fuelEfficiency, 0.05)
      },
      availableDrivers: {
        label: "Available Drivers",
        value: kpis.availableDrivers,
        format: "number",
        trend: -3.2,
        sparklineData: generateSparklineData(kpis.availableDrivers, 0.2)
      },
      availableTractors: {
        label: "Available Tractors",
        value: kpis.availableTractors,
        format: "number",
        trend: -1.8,
        sparklineData: generateSparklineData(kpis.availableTractors, 0.25)
      },
      totalMargin: {
        label: "Total Margin",
        value: kpis.totalMargin,
        format: "currency",
        trend: kpis.marginGrowth,
        sparklineData: generateSparklineData(kpis.totalMargin / 30, 0.12)
      },
      totalMiles: {
        label: "Total Miles",
        value: kpis.totalMiles,
        format: "number",
        trend: 7.3,
        sparklineData: generateSparklineData(kpis.totalMiles / 30, 0.1)
      },
      ratePerMile: {
        label: "Avg Rate/Mile",
        value: kpis.averageRatePerMile,
        format: "currency",
        trend: 4.2,
        sparklineData: generateSparklineData(kpis.averageRatePerMile, 0.08)
      }
    };

    // Role-based filtering
    let filteredKpis: Record<string, unknown>;

    switch (role) {
      case "dispatcher":
        filteredKpis = {
          loadCount: allKpis.loadCount,
          onTimePercent: allKpis.onTimePercent,
          availableDrivers: allKpis.availableDrivers,
          availableTractors: allKpis.availableTractors
        };
        break;
      case "accounting":
        filteredKpis = {
          revenue: allKpis.revenue,
          margin: allKpis.margin,
          totalMargin: allKpis.totalMargin,
          ratePerMile: allKpis.ratePerMile
        };
        break;
      case "driver_manager":
        filteredKpis = {
          onTimePercent: allKpis.onTimePercent,
          availableDrivers: allKpis.availableDrivers,
          fuelEfficiency: allKpis.fuelEfficiency,
          totalMiles: allKpis.totalMiles
        };
        break;
      case "safety":
        filteredKpis = {
          onTimePercent: allKpis.onTimePercent,
          fuelEfficiency: allKpis.fuelEfficiency,
          availableDrivers: allKpis.availableDrivers,
          totalMiles: allKpis.totalMiles
        };
        break;
      default: // admin or full access
        filteredKpis = allKpis;
    }

    return NextResponse.json({
      kpis: filteredKpis,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: dateRange
      },
      role,
      organizationId: 1
    });

  } catch (error) {
    console.error("Analytics KPIs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
