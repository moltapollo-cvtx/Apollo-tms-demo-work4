import { NextRequest, NextResponse } from "next/server";
import { mockAnalytics } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("range") || "mtd";
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "totalRevenue";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const now = new Date();

    // Calculate date range
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

    // Use mock driver analytics data
    const driverAnalytics = mockAnalytics.driverAnalytics;

    // Process driver data with additional calculated fields
    const processedDrivers = driverAnalytics.map((driver, index) => {
      // Calculate additional metrics
      const totalMargin = driver.totalRevenue * 0.22; // Assume 22% margin
      const marginPercent = 22; // Fixed for demo
      const averageRevenue = driver.totalRevenue / Math.max(1, driver.completedOrders);
      const averageMargin = totalMargin / Math.max(1, driver.completedOrders);
      const revenuePerMile = driver.totalRevenue / Math.max(1, driver.totalMiles);
      const milesPerWeek = driver.totalMiles / 4; // Assume monthly data over 4 weeks
      const revenuePerWeek = driver.totalRevenue / 4;

      // Mock additional data
      const safetyScore = 75 + Math.random() * 25; // 75-100 safety score
      const experienceMonths = Math.floor(Math.random() * 60) + 6; // 6-66 months
      const status = ["available", "driving", "on_duty", "off_duty"][Math.floor(Math.random() * 4)];

      return {
        id: driver.driverId,
        rank: index + 1,
        name: driver.driverName,
        employeeId: `D${driver.driverId.toString().padStart(4, "0")}`,
        status,
        loadCount: driver.completedOrders,
        totalRevenue: driver.totalRevenue,
        totalMargin,
        marginPercent,
        totalMiles: driver.totalMiles,
        averageRevenue,
        averageMargin,
        onTimePercent: driver.onTimeRate,
        revenuePerMile,
        milesPerWeek,
        revenuePerWeek,
        fuelEfficiency: driver.fuelEfficiency,
        safetyScore,
        totalSettlements: driver.totalRevenue * 0.6, // Assume 60% goes to driver
        experienceMonths,
        // Performance indicators
        isTopPerformer: driver.onTimeRate >= 95 && safetyScore >= 85,
        needsAttention: driver.onTimeRate < 85 || safetyScore < 70,
        // Trend indicators
        revenueTrend: (Math.random() - 0.5) * 20,
        marginTrend: (Math.random() - 0.5) * 10,
        onTimeTrend: (Math.random() - 0.5) * 6,
      };
    });

    // Apply sorting
    const sortedDrivers = processedDrivers.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case "totalRevenue":
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case "totalMiles":
          aValue = a.totalMiles;
          bValue = b.totalMiles;
          break;
        case "marginPercent":
          aValue = a.marginPercent;
          bValue = b.marginPercent;
          break;
        case "onTimePercent":
          aValue = a.onTimePercent;
          bValue = b.onTimePercent;
          break;
        case "loadCount":
          aValue = a.loadCount;
          bValue = b.loadCount;
          break;
        case "safetyScore":
          aValue = a.safetyScore;
          bValue = b.safetyScore;
          break;
        case "fuelEfficiency":
          aValue = a.fuelEfficiency;
          bValue = b.fuelEfficiency;
          break;
        default:
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    // Update ranks after sorting and apply pagination
    const paginatedDrivers = sortedDrivers
      .slice(offset, offset + limit)
      .map((driver, index) => ({
        ...driver,
        rank: offset + index + 1,
      }));

    // Summary statistics
    const summary = {
      totalDrivers: sortedDrivers.length,
      activeDrivers: sortedDrivers.filter(d => d.status !== "off_duty").length,
      totalRevenue: sortedDrivers.reduce((sum, driver) => sum + driver.totalRevenue, 0),
      totalMiles: sortedDrivers.reduce((sum, driver) => sum + driver.totalMiles, 0),
      averageMarginPercent: sortedDrivers.length > 0
        ? sortedDrivers.reduce((sum, driver) => sum + driver.marginPercent, 0) / sortedDrivers.length
        : 0,
      averageOnTimePercent: sortedDrivers.length > 0
        ? sortedDrivers.reduce((sum, driver) => sum + driver.onTimePercent, 0) / sortedDrivers.length
        : 0,
      topPerformers: sortedDrivers.filter(d => d.isTopPerformer).length,
      needsAttention: sortedDrivers.filter(d => d.needsAttention).length,
      topDriver: sortedDrivers[0] || null,
      averageSafetyScore: sortedDrivers.length > 0
        ? sortedDrivers.reduce((sum, driver) => sum + driver.safetyScore, 0) / sortedDrivers.length
        : 0,
      averageFuelEfficiency: sortedDrivers.length > 0
        ? sortedDrivers.reduce((sum, driver) => sum + driver.fuelEfficiency, 0) / sortedDrivers.length
        : 0
    };

    return NextResponse.json({
      drivers: paginatedDrivers,
      summary,
      pagination: {
        total: sortedDrivers.length,
        limit,
        offset,
        hasMore: (offset + limit) < sortedDrivers.length
      },
      sorting: {
        sortBy,
        sortOrder
      },
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: dateRange
      }
    });

  } catch (error) {
    console.error("Driver performance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver performance data" },
      { status: 500 }
    );
  }
}