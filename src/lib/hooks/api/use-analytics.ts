import { useQuery } from "@tanstack/react-query";

interface DateRange {
  start: string;
  end: string;
  type: "daily" | "weekly" | "mtd" | "ytd";
}

interface KpiData {
  label: string;
  value: number;
  format: "currency" | "percentage" | "number";
  trend: number;
  sparklineData: { date: string; value: number }[];
  breakdown?: Record<string, number>;
}

interface KpisResponse {
  kpis: Record<string, KpiData>;
  dateRange: DateRange;
  role: string;
  organizationId: number;
}

interface LaneData {
  id: string;
  origin: { city: string; state: string; display: string };
  destination: { city: string; state: string; display: string };
  lane: string;
  loadCount: number;
  totalRevenue: number;
  totalMargin: number;
  marginPercent: number;
  averageRevenue: number;
  averageMargin: number;
  totalMiles: number;
  averageMiles: number;
  revenuePerMile: number;
  primaryCustomer: string;
  equipmentType: string;
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
}

interface LanesResponse {
  lanes: LaneData[];
  summary: {
    totalLanes: number;
    totalLoads: number;
    totalRevenue: number;
    totalMargin: number;
    averageMarginPercent: number;
    topLane: LaneData | null;
    mostProfitableLane: LaneData | null;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  dateRange: DateRange;
}

interface DriverData {
  id: number;
  rank: number;
  name: string;
  employeeId: string;
  status: string;
  loadCount: number;
  totalRevenue: number;
  totalMargin: number;
  marginPercent: number;
  totalMiles: number;
  averageRevenue: number;
  averageMargin: number;
  onTimePercent: number;
  revenuePerMile: number;
  milesPerWeek: number;
  revenuePerWeek: number;
  safetyScore: number;
  totalSettlements: number;
  experienceMonths: number;
  isTopPerformer: boolean;
  needsAttention: boolean;
  revenueTrend: number;
  marginTrend: number;
  onTimeTrend: number;
}

interface DriversResponse {
  drivers: DriverData[];
  summary: {
    totalDrivers: number;
    activeDrivers: number;
    totalRevenue: number;
    totalMiles: number;
    averageMarginPercent: number;
    averageOnTimePercent: number;
    topPerformers: number;
    needsAttention: number;
    topDriver: DriverData | null;
    averageSafetyScore: number;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
  dateRange: DateRange;
}

interface CustomerData {
  id: number;
  rank: number;
  name: string;
  code: string;
  tier: "A" | "B" | "C";
  loadCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercent: number;
  totalMiles: number;
  averageRevenue: number;
  averageMargin: number;
  costToServe: number;
  completionRate: number;
  cancellationRate: number;
  revenuePerMile: number;
  creditLimit: number;
  paymentTerms: string;
  outstandingAR: number;
  paymentPerformance: number;
  primaryEquipment: string;
  equipmentMix: {
    dryVan: number;
    reefer: number;
    flatbed: number;
    other: number;
  };
  isHighValue: boolean;
  isLowMargin: boolean;
  hasARIssues: boolean;
  revenueTrend: number;
  marginTrend: number;
  volumeTrend: number;
}

interface CustomersResponse {
  customers: CustomerData[];
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    totalMargin: number;
    averageMarginPercent: number;
    averageRevenuePerCustomer: number;
    highValueCustomers: number;
    lowMarginCustomers: number;
    customersWithARIssues: number;
    topCustomer: CustomerData | null;
    totalOutstandingAR: number;
    tierDistribution: {
      A: number;
      B: number;
      C: number;
    };
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
  dateRange: DateRange;
}

export function useKpis(
  dateRange: string = "mtd",
  role?: string
) {
  return useQuery<KpisResponse>({
    queryKey: ["analytics", "kpis", dateRange, role],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: dateRange,
        ...(role && { role })
      });

      const response = await fetch(`/api/analytics/kpis?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch KPI data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
}

export function useLaneAnalysis(
  dateRange: string = "mtd",
  limit: number = 25,
  offset: number = 0
) {
  return useQuery<LanesResponse>({
    queryKey: ["analytics", "lanes", dateRange, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: dateRange,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`/api/analytics/lanes?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lane analysis data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDriverPerformance(
  dateRange: string = "mtd",
  sortBy: string = "totalRevenue",
  sortOrder: string = "desc",
  limit: number = 25,
  offset: number = 0
) {
  return useQuery<DriversResponse>({
    queryKey: ["analytics", "drivers", dateRange, sortBy, sortOrder, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: dateRange,
        sortBy,
        sortOrder,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`/api/analytics/drivers?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch driver performance data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerProfitability(
  dateRange: string = "mtd",
  sortBy: string = "totalRevenue",
  sortOrder: string = "desc",
  limit: number = 25,
  offset: number = 0
) {
  return useQuery<CustomersResponse>({
    queryKey: ["analytics", "customers", dateRange, sortBy, sortOrder, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: dateRange,
        sortBy,
        sortOrder,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`/api/analytics/customers?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customer profitability data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}