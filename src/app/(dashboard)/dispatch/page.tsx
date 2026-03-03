"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TrendUp,
  BellRinging,
  Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Import our new dispatch components
import { DriverTimeline } from "@/components/dispatch/driver-timeline";
import { LoadQueue } from "@/components/dispatch/load-queue";
import { DispatchFilters } from "@/components/dispatch/dispatch-filters";
import {
  useDispatchWebSocket,
  type DriverUpdate,
  type LoadUpdate,
  type AssignmentUpdate,
} from "@/hooks/use-dispatch-websocket";

type NotificationType = "driver_update" | "load_update" | "assignment_update";

interface DispatchCustomer {
  id: number;
  name: string;
  code: string;
}

interface DispatchStop {
  id: number;
  type: string;
  city: string;
  state: string;
  sequence: number;
  scheduledDate: string;
  address: string;
  isCompleted?: boolean;
  latitude?: string;
  longitude?: string;
}

interface AssignmentStop {
  id: number;
  type: string;
  city: string;
  state: string;
  sequence: number;
  scheduledDate: string;
  address?: string;
  isCompleted: boolean;
}

interface DispatchOrder {
  id: number;
  customerId: number;
  orderNumber: string;
  commodity: string;
  weight: string;
  pieces: number;
  status: string;
  equipmentType: string;
  priorityLevel: string;
  totalRevenue: string;
  miles: string;
  notes?: string;
  customerReferenceNumber?: string;
  createdAt: string;
  customer: DispatchCustomer;
  stops: DispatchStop[];
}

interface AssignedOrder {
  id: number;
  orderNumber: string;
  commodity: string;
  weight: string;
  priorityLevel: string;
  status: string;
  totalRevenue: string;
  miles: string;
  customerReferenceNumber?: string;
}

interface DispatchAssignment {
  assignment: {
    id: number;
    assignedAt: string;
    dispatchedAt?: string;
  };
  order: AssignedOrder;
  customer: DispatchCustomer;
  stops: AssignmentStop[];
}

interface DispatchDriver {
  id: number;
  firstName: string;
  lastName: string;
  employeeId?: string;
  status: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  hireDate?: string;
  safetyScore?: string;
  cdlState?: string;
  cdlExpiration?: string;
  qualifications?: Array<{
    id: number;
    qualificationType: string;
    expirationDate: string;
    certificateNumber: string;
    isActive: boolean;
  }>;
  certifications?: Array<{
    id: number;
    certificationType: string;
    expirationDate: string;
    certificateNumber: string;
    isActive: boolean;
  }>;
  currentAssignment?: {
    order?: { orderNumber: string };
    tractor?: { unitNumber: string };
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTractor?: {
    id: number;
    unitNumber: string;
    make: string;
    model: string;
    year?: number;
    currentOdometer?: number;
  };
  currentTrailer?: {
    id: number;
    unitNumber: string;
    trailerType: string;
    make?: string;
    model?: string;
  };
  currentAssignments: DispatchAssignment[];
}

interface NotificationRecord {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
}

interface LoadDragData {
  orderId: number;
}

interface DispatchData {
  drivers: DispatchDriver[];
  unassignedOrders: DispatchOrder[];
  availableEquipment: Array<Record<string, unknown>>;
  availableTrailers: Array<Record<string, unknown>>;
  customers: DispatchCustomer[];
}

interface FilterState {
  driverStatus: string[];
  loadStatus: string[];
  equipmentType: string[];
  priorityLevel: string[];
  customerId: string | null;
  region: string | null;
  search: string;
}

const initialFilters: FilterState = {
  driverStatus: [],
  loadStatus: [],
  equipmentType: [],
  priorityLevel: [],
  customerId: null,
  region: null,
  search: "",
};

type PlannerTab = "drivers_timeline" | "unassigned_loads" | "revenue_percentiles";

const plannerTabs: Array<{ value: PlannerTab; label: string }> = [
  { value: "drivers_timeline", label: "Drivers Timeline" },
  { value: "unassigned_loads", label: "Unassigned Loads" },
  { value: "revenue_percentiles", label: "Revenue Percentiles" },
];

const formatDriverStatus = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const parseRevenueAmount = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function DispatchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [plannerTab, setPlannerTab] = useState<PlannerTab>("drivers_timeline");
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dispatchQueryFilters = useMemo(
    () => ({
      driverStatus: filters.driverStatus,
      loadStatus: filters.loadStatus,
      equipmentType: filters.equipmentType,
      priorityLevel: filters.priorityLevel,
      customerId: filters.customerId,
      region: filters.region,
    }),
    [
      filters.customerId,
      filters.driverStatus,
      filters.equipmentType,
      filters.loadStatus,
      filters.priorityLevel,
      filters.region,
    ],
  );

  // Fetch dispatch data
  const { data: dispatchData, isLoading, error } = useQuery<DispatchData>({
    queryKey: ["dispatch", dispatchQueryFilters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (dispatchQueryFilters.driverStatus.length > 0) params.set("driverStatus", dispatchQueryFilters.driverStatus.join(","));
      if (dispatchQueryFilters.loadStatus.length > 0) params.set("loadStatus", dispatchQueryFilters.loadStatus.join(","));
      if (dispatchQueryFilters.equipmentType.length > 0) params.set("equipmentType", dispatchQueryFilters.equipmentType.join(","));
      if (dispatchQueryFilters.priorityLevel.length > 0) params.set("priorityLevel", dispatchQueryFilters.priorityLevel.join(","));
      if (dispatchQueryFilters.customerId) params.set("customerId", dispatchQueryFilters.customerId);
      if (dispatchQueryFilters.region) params.set("region", dispatchQueryFilters.region);

      const response = await fetch(`/api/dispatch?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dispatch data");
      }
      const result = (await response.json()) as { data: DispatchData };
      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Assignment mutation
  const assignmentMutation = useMutation({
    mutationFn: async ({ action, orderId, driverId, tractorId, trailerId }: {
      action: "assign" | "unassign";
      orderId: number;
      driverId?: number;
      tractorId?: number;
      trailerId?: number;
    }) => {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, orderId, driverId, tractorId, trailerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Assignment failed");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Success",
        description: variables.action === "assign" ? "Load assigned successfully" : "Load unassigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const notification: NotificationRecord = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setNotifications((prev) => [notification, ...prev.slice(0, 9)]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((entry) => entry.id !== notification.id));
    }, 5000);
  }, []);

  // WebSocket handlers
  const handleDriverUpdate = useCallback((update: DriverUpdate) => {
    addNotification("driver_update", `Driver ${update.driverId} status updated to ${update.status}`);
    queryClient.invalidateQueries({ queryKey: ["dispatch"] });
  }, [addNotification, queryClient]);

  const handleLoadUpdate = useCallback((update: LoadUpdate) => {
    addNotification("load_update", `Load ${update.orderId} status updated to ${update.status}`);
    queryClient.invalidateQueries({ queryKey: ["dispatch"] });
  }, [addNotification, queryClient]);

  const handleAssignmentUpdate = useCallback((update: AssignmentUpdate) => {
    addNotification("assignment_update", `Load assignment ${update.action}: Driver ${update.driverId} <-> Order ${update.orderId}`);
    queryClient.invalidateQueries({ queryKey: ["dispatch"] });
  }, [addNotification, queryClient]);

  // WebSocket connection
  const { connectionStatus, lastUpdate, isConnected } = useDispatchWebSocket({
    enabled: true,
    onDriverUpdate: handleDriverUpdate,
    onLoadUpdate: handleLoadUpdate,
    onAssignmentUpdate: handleAssignmentUpdate,
  });

  // Handle drag and drop load assignment
  const handleDropLoad = useCallback(async (driverId: number, loadData: LoadDragData) => {
    try {
      await assignmentMutation.mutateAsync({
        action: "assign",
        orderId: loadData.orderId,
        driverId,
      });
    } catch {
      // Error handled by mutation
    }
  }, [assignmentMutation]);

  // Navigate to driver profile from timeline
  const handleDriverClick = useCallback((driverId: number) => {
    router.push(`/drivers/${driverId}`);
  }, [router]);

  // Handle load selection
  const handleOrderSelect = useCallback((orderId: number) => {
    router.push(`/orders/${orderId}`);
  }, [router]);

  const handleOrderToggleSelect = useCallback((orderId: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string, orderIds: number[]) => {
    toast({
      title: "Bulk Action",
      description: `${action} applied to ${orderIds.length} loads`,
    });
    setSelectedOrderIds([]);
    // Implement actual bulk actions here
  }, [toast]);

  // Filter data based on search and other filters
  const filteredDrivers = useMemo(() => {
    const drivers = dispatchData?.drivers ?? [];
    return drivers.filter((driver) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
        if (
          !fullName.includes(searchLower) &&
          !(driver.employeeId?.toLowerCase().includes(searchLower) ?? false) &&
          !(driver.email?.toLowerCase().includes(searchLower) ?? false)
        ) {
          return false;
        }
      }

      if (filters.driverStatus.length > 0 && !filters.driverStatus.includes(driver.status)) {
        return false;
      }

      return true;
    });
  }, [dispatchData?.drivers, filters.driverStatus, filters.search]);

  const filteredOrders = useMemo(() => {
    const orders = dispatchData?.unassignedOrders ?? [];
    return orders.filter((order) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !order.orderNumber.toLowerCase().includes(searchLower) &&
          !order.commodity.toLowerCase().includes(searchLower) &&
          !order.customer?.name.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.loadStatus.length > 0 && !filters.loadStatus.includes(order.status)) {
        return false;
      }

      if (filters.equipmentType.length > 0 && !filters.equipmentType.includes(order.equipmentType)) {
        return false;
      }

      if (filters.priorityLevel.length > 0 && !filters.priorityLevel.includes(order.priorityLevel)) {
        return false;
      }

      if (filters.customerId && order.customerId.toString() !== filters.customerId) {
        return false;
      }

      return true;
    });
  }, [
    dispatchData?.unassignedOrders,
    filters.customerId,
    filters.equipmentType,
    filters.loadStatus,
    filters.priorityLevel,
    filters.search,
  ]);

  const revenuePercentiles = useMemo(() => {
    const ranked = filteredDrivers
      .map((driver) => {
        const assignmentCount = driver.currentAssignments.length;
        const totalRevenue = driver.currentAssignments.reduce(
          (sum, assignment) => sum + parseRevenueAmount(assignment.order.totalRevenue),
          0,
        );
        const averageRevenue = assignmentCount > 0 ? totalRevenue / assignmentCount : 0;
        return {
          id: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          employeeId: driver.employeeId,
          status: driver.status,
          assignmentCount,
          totalRevenue,
          averageRevenue,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((entry, index, array) => {
        const fleetSize = array.length;
        const percentile = fleetSize <= 1 ? 100 : Math.round(((fleetSize - index) / fleetSize) * 100);
        const beatsPercent = fleetSize <= 1 ? 100 : Math.round(((fleetSize - index - 1) / (fleetSize - 1)) * 100);
        return {
          ...entry,
          rank: index + 1,
          percentile,
          beatsPercent,
        };
      });

    const fleetTotalRevenue = ranked.reduce((sum, driver) => sum + driver.totalRevenue, 0);
    const fleetAverageRevenue = ranked.length > 0 ? fleetTotalRevenue / ranked.length : 0;
    const highestRevenue = ranked[0]?.totalRevenue ?? 0;

    return {
      ranked,
      fleetTotalRevenue,
      fleetAverageRevenue,
      highestRevenue,
    };
  }, [filteredDrivers]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Warning className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Error loading dispatch data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["dispatch"] })}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Visual Planner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag-and-drop load assignment, driver timelines, and revenue coverage insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-apollo-cyan-500" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {connectionStatus}
            </span>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground font-mono">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-apollo-cyan-500" />
              <span>{filteredDrivers.filter(d => d.status === "available").length} Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>{filteredDrivers.filter(d => d.status === "on_load").length} On Load</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>{filteredOrders.filter(o => o.priorityLevel === "urgent").length} Urgent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DispatchFilters
        customers={dispatchData?.customers || []}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-1">
          {notifications.slice(0, 3).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-2 rounded-lg border border-apollo-cyan-200 bg-apollo-cyan-50 px-3 py-2 text-sm dark:border-apollo-cyan-800 dark:bg-apollo-cyan-950/20"
            >
              <BellRinging className="h-4 w-4 text-apollo-cyan-600" />
              <span className="text-apollo-cyan-800 dark:text-apollo-cyan-200">{notification.message}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex w-full flex-wrap items-center gap-1 rounded-xl bg-muted/50 p-1">
          {plannerTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPlannerTab(tab.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                plannerTab === tab.value
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {plannerTab === "drivers_timeline" && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 sm:p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <DriverTimeline
                  drivers={filteredDrivers}
                  onDriverClick={handleDriverClick}
                  onOrderClick={handleOrderSelect}
                  onDropLoad={handleDropLoad}
                />
              )}
            </div>
          </div>
        )}

        {plannerTab === "unassigned_loads" && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 sm:p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <LoadQueue
                  orders={filteredOrders}
                  selectedOrderIds={selectedOrderIds}
                  onOrderSelect={handleOrderSelect}
                  onOrderToggleSelect={handleOrderToggleSelect}
                  onBulkAction={handleBulkAction}
                />
              )}
            </div>
          </div>
        )}

        {plannerTab === "revenue_percentiles" && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="space-y-6 p-4 sm:p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 rounded-lg bg-muted" />
                    </div>
                  ))}
                </div>
              ) : revenuePercentiles.ranked.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No drivers available for percentile comparison with current filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fleet Revenue (Current)</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground font-mono">
                        {formatCurrency(revenuePercentiles.fleetTotalRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Average Per Driver</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground font-mono">
                        {formatCurrency(revenuePercentiles.fleetAverageRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Driver Revenue</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground font-mono">
                        {formatCurrency(revenuePercentiles.highestRevenue)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {revenuePercentiles.ranked.map((driver) => {
                      const barWidth =
                        revenuePercentiles.highestRevenue > 0
                          ? Math.max(4, (driver.totalRevenue / revenuePercentiles.highestRevenue) * 100)
                          : 4;

                      return (
                        <div key={driver.id} className="rounded-xl border border-border bg-background p-4">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,1fr)_170px_170px_170px_1fr] lg:items-center">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  #{driver.rank}
                                </Badge>
                                <p className="truncate font-semibold text-foreground">{driver.driverName}</p>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {driver.employeeId} • {formatDriverStatus(driver.status)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Booked Revenue</p>
                              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                                {formatCurrency(driver.totalRevenue)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg / Load</p>
                              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                                {formatCurrency(driver.averageRevenue)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignments</p>
                              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                                {driver.assignmentCount}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Percentile</span>
                                <span className="font-medium text-foreground">{driver.percentile}th</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-apollo-cyan-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendUp className="h-3 w-3 text-apollo-cyan-600" />
                                Beats {driver.beatsPercent}% of filtered fleet
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
