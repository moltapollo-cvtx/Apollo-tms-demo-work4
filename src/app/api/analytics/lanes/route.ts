import { NextRequest, NextResponse } from "next/server";
import { mockAnalytics } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("range") || "mtd";
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    // Use mock lane analytics data
    const laneAnalytics = mockAnalytics.laneAnalytics;

    // Process lane data with additional calculated fields
    const processedLanes = laneAnalytics.map((lane, index) => {
      // Split lane string to get origin and destination
      const [origin, destination] = lane.lane.split(' → ');
      const [originCity, originState] = origin.split(', ');
      const [destinationCity, destinationState] = destination.split(', ');

      // Calculate additional metrics
      const totalMargin = lane.totalRevenue * 0.22; // Assume 22% margin
      const marginPercent = 22;
      const averageMargin = totalMargin / Math.max(1, lane.volume);
      const averageMiles = 800 + Math.random() * 1000; // Random miles between 800-1800
      const totalMiles = lane.volume * averageMiles;
      const revenuePerMile = lane.avgRate;

      // Mock equipment type and customer
      const equipmentTypes = ["dry_van", "refrigerated", "flatbed"];
      const equipmentType = equipmentTypes[index % equipmentTypes.length];
      const customers = ["Multiple", "Primary Customer A", "Primary Customer B"];
      const primaryCustomer = customers[index % customers.length];

      // Generate realistic coordinates based on major US cities
      const cityCoords: Record<string, { lat: number, lng: number }> = {
        'Dallas': { lat: 32.7767, lng: -96.7970 },
        'Los Angeles': { lat: 34.0522, lng: -118.2437 },
        'Chicago': { lat: 41.8781, lng: -87.6298 },
        'Miami': { lat: 25.7617, lng: -80.1918 },
        'Atlanta': { lat: 33.7490, lng: -84.3880 },
        'Phoenix': { lat: 33.4484, lng: -112.0740 },
        'Denver': { lat: 39.7392, lng: -104.9903 },
        'Seattle': { lat: 47.6062, lng: -122.3321 },
        'Kansas City': { lat: 39.0997, lng: -94.5786 },
        'Nashville': { lat: 36.1627, lng: -86.7816 }
      };

      const originCoords = cityCoords[originCity] || { lat: 39.8283, lng: -98.5795 };
      const destinationCoords = cityCoords[destinationCity] || { lat: 39.8283, lng: -98.5795 };

      return {
        id: `${originCity}-${originState}-${destinationCity}-${destinationState}-${index}`,
        origin: {
          city: originCity,
          state: originState,
          display: `${originCity}, ${originState}`
        },
        destination: {
          city: destinationCity,
          state: destinationState,
          display: `${destinationCity}, ${destinationState}`
        },
        lane: lane.lane,
        loadCount: lane.volume,
        totalRevenue: lane.totalRevenue,
        totalMargin,
        marginPercent,
        averageRevenue: lane.totalRevenue / lane.volume,
        averageMargin,
        totalMiles,
        averageMiles,
        revenuePerMile,
        primaryCustomer,
        equipmentType,
        originCoords,
        destinationCoords,
        // Additional analytics
        avgRate: lane.avgRate,
        volumeTrend: (Math.random() - 0.5) * 20, // -10% to +10%
        revenueTrend: (Math.random() - 0.5) * 25, // -12.5% to +12.5%
        rateTrend: (Math.random() - 0.5) * 15, // -7.5% to +7.5%
      };
    });

    // Apply pagination
    const paginatedLanes = processedLanes.slice(offset, offset + limit);

    // Summary statistics
    const summary = {
      totalLanes: processedLanes.length,
      totalLoads: processedLanes.reduce((sum, lane) => sum + lane.loadCount, 0),
      totalRevenue: processedLanes.reduce((sum, lane) => sum + lane.totalRevenue, 0),
      totalMargin: processedLanes.reduce((sum, lane) => sum + lane.totalMargin, 0),
      averageMarginPercent: processedLanes.length > 0
        ? processedLanes.reduce((sum, lane) => sum + lane.marginPercent, 0) / processedLanes.length
        : 0,
      topLane: processedLanes[0] || null,
      mostProfitableLane: processedLanes.reduce((best, current) =>
        current.marginPercent > (best?.marginPercent || 0) ? current : best,
        processedLanes[0]
      ) || null,
      averageRevenuePerMile: processedLanes.length > 0
        ? processedLanes.reduce((sum, lane) => sum + lane.revenuePerMile, 0) / processedLanes.length
        : 0,
      totalMiles: processedLanes.reduce((sum, lane) => sum + lane.totalMiles, 0)
    };

    return NextResponse.json({
      lanes: paginatedLanes,
      summary,
      pagination: {
        total: processedLanes.length,
        limit,
        offset,
        hasMore: (offset + limit) < processedLanes.length
      },
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: dateRange
      }
    });

  } catch (error) {
    console.error("Lane analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lane analysis data" },
      { status: 500 }
    );
  }
}