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

    // Use mock customer analytics data
    const customerAnalytics = mockAnalytics.customerAnalytics;

    // Process customer data with additional calculated fields
    const processedCustomers = customerAnalytics.map((customer, index) => {
      // Determine customer tier based on revenue
      let tier: "A" | "B" | "C";
      if (customer.totalRevenue >= 300000) tier = "A";
      else if (customer.totalRevenue >= 150000) tier = "B";
      else tier = "C";

      // Calculate additional metrics
      const averageRevenuePerOrder = customer.totalOrders > 0 ? customer.totalRevenue / customer.totalOrders : 0;
      const totalMargin = customer.totalRevenue * (customer.averageMargin / 100);

      // Mock equipment mix and other data
      const equipmentTypes = ["dry_van", "refrigerated", "flatbed"];
      const primaryEquipment = equipmentTypes[index % equipmentTypes.length];

      return {
        id: customer.customerId,
        rank: index + 1,
        name: customer.customerName,
        code: `C${customer.customerId.toString().padStart(4, "0")}`,
        tier,
        loadCount: customer.totalOrders,
        totalRevenue: customer.totalRevenue,
        totalCost: customer.totalRevenue * 0.8, // Estimate 80% cost ratio
        totalMargin,
        marginPercent: customer.averageMargin,
        totalMiles: customer.totalOrders * (Math.random() * 500 + 300), // Estimated miles
        averageRevenue: averageRevenuePerOrder,
        averageMargin: totalMargin / Math.max(1, customer.totalOrders),
        costToServe: (customer.totalRevenue * 0.8) / Math.max(1, customer.totalOrders),
        completionRate: customer.onTimeRate,
        cancellationRate: Math.random() * 3, // Random 0-3% cancellation
        revenuePerMile: averageRevenuePerOrder / (Math.random() * 500 + 300),
        creditLimit: Math.floor(customer.totalRevenue * 0.5),
        paymentTerms: Math.random() > 0.5 ? "NET_30" : "NET_15",
        outstandingAR: Math.floor(customer.totalRevenue * (Math.random() * 0.1)),
        paymentPerformance: 95 + Math.random() * 5,
        primaryEquipment,
        equipmentMix: {
          dryVan: Math.floor(customer.totalOrders * 0.4),
          reefer: Math.floor(customer.totalOrders * 0.3),
          flatbed: Math.floor(customer.totalOrders * 0.2),
          other: Math.floor(customer.totalOrders * 0.1)
        },
        // Profitability indicators
        isHighValue: customer.totalRevenue >= 250000 && customer.averageMargin >= 15,
        isLowMargin: customer.averageMargin < 12 && customer.totalOrders >= 5,
        hasARIssues: Math.random() < 0.1, // 10% chance of AR issues
        // Trend indicators
        revenueTrend: (Math.random() - 0.5) * 25,
        marginTrend: (Math.random() - 0.5) * 8,
        volumeTrend: (Math.random() - 0.5) * 20,
      };
    });

    // Apply sorting
    const sortedCustomers = processedCustomers.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case "totalRevenue":
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case "totalMargin":
          aValue = a.totalMargin;
          bValue = b.totalMargin;
          break;
        case "marginPercent":
          aValue = a.marginPercent;
          bValue = b.marginPercent;
          break;
        case "loadCount":
          aValue = a.loadCount;
          bValue = b.loadCount;
          break;
        case "completionRate":
          aValue = a.completionRate;
          bValue = b.completionRate;
          break;
        case "paymentPerformance":
          aValue = a.paymentPerformance;
          bValue = b.paymentPerformance;
          break;
        default:
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    // Update ranks after sorting and apply pagination
    const paginatedCustomers = sortedCustomers
      .slice(offset, offset + limit)
      .map((customer, index) => ({
        ...customer,
        rank: offset + index + 1,
      }));

    // Summary statistics
    const summary = {
      totalCustomers: sortedCustomers.length,
      activeCustomers: sortedCustomers.length,
      totalRevenue: sortedCustomers.reduce((sum, customer) => sum + customer.totalRevenue, 0),
      totalMargin: sortedCustomers.reduce((sum, customer) => sum + customer.totalMargin, 0),
      averageMarginPercent: sortedCustomers.length > 0
        ? sortedCustomers.reduce((sum, customer) => sum + customer.marginPercent, 0) / sortedCustomers.length
        : 0,
      averageRevenuePerCustomer: sortedCustomers.length > 0
        ? sortedCustomers.reduce((sum, customer) => sum + customer.totalRevenue, 0) / sortedCustomers.length
        : 0,
      highValueCustomers: sortedCustomers.filter(c => c.isHighValue).length,
      lowMarginCustomers: sortedCustomers.filter(c => c.isLowMargin).length,
      customersWithARIssues: sortedCustomers.filter(c => c.hasARIssues).length,
      topCustomer: sortedCustomers[0] || null,
      totalOutstandingAR: sortedCustomers.reduce((sum, customer) => sum + customer.outstandingAR, 0),
      tierDistribution: {
        A: sortedCustomers.filter(c => c.tier === "A").length,
        B: sortedCustomers.filter(c => c.tier === "B").length,
        C: sortedCustomers.filter(c => c.tier === "C").length,
      }
    };

    return NextResponse.json({
      customers: paginatedCustomers,
      summary,
      pagination: {
        total: sortedCustomers.length,
        limit,
        offset,
        hasMore: (offset + limit) < sortedCustomers.length
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
    console.error("Customer profitability API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer profitability data" },
      { status: 500 }
    );
  }
}