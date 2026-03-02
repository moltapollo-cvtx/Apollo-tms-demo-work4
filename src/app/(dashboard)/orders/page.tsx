"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretRight,
  CheckCircle,
  ClipboardText,
  MapPin,
  MagnifyingGlass as Search,
  Plus,
  Truck,
  User,
  X,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { orderKeys, useOrders } from "@/lib/hooks/api/use-orders";
import type { LoadStatus, OrderWithDetails } from "@/types";
import OrderCard from "@/components/orders/OrderCard";
import OrderFilters, { type OrderView } from "@/components/orders/OrderFilters";
import FilterPills, { type ActiveFilter } from "@/components/orders/FilterPills";

type DispatchMatchDriver = {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  status: string;
  homeTerminal?: string | null;
  cdlEndorsements?: string[] | null;
  licenseExpirationDate?: string | null;
  currentAssignments: Array<{ assignment: { id: number } }>;
};

type DispatchAssistData = {
  drivers: DispatchMatchDriver[];
  unassignedOrders: Array<{ id: number }>;
};

type DriverMatch = {
  driver: DispatchMatchDriver;
  score: number;
  feasible: boolean;
  assignmentCount: number;
  statusLabel: string;
  reasons: string[];
};

type ParsedTerminal = {
  city: string | null;
  state: string | null;
};

const statusScoreByDriverStatus: Record<string, number> = {
  available: 42,
  on_duty: 30,
  driving: 16,
  on_load: -25,
  off_duty: -40,
  sleeper: -45,
  on_break: -20,
};

const driverBadgeClassByStatus: Record<string, string> = {
  available: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
  on_duty: "bg-blue-100 text-blue-700 border-blue-200",
  driving: "bg-amber-100 text-amber-700 border-amber-200",
  on_load: "bg-sky-100 text-sky-700 border-sky-200",
  off_duty: "bg-zinc-100 text-zinc-700 border-zinc-200",
  sleeper: "bg-indigo-100 text-indigo-700 border-indigo-200",
  on_break: "bg-orange-100 text-orange-700 border-orange-200",
};

const toTitleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const parseTerminal = (value: string | null | undefined): ParsedTerminal => {
  if (!value) {
    return { city: null, state: null };
  }
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts[0] || null;
  const stateRaw = parts[1] || null;
  return {
    city,
    state: stateRaw ? stateRaw.toUpperCase() : null,
  };
};

const getStop = (order: OrderWithDetails, stopType: "pickup" | "delivery") =>
  order.stops?.find((stop) => String(stop.type).toLowerCase() === stopType) ?? null;

const daysUntil = (dateValue: string | null | undefined) => {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const hasTankerEndorsement = (driver: DispatchMatchDriver) => {
  const endorsements = Array.isArray(driver.cdlEndorsements)
    ? driver.cdlEndorsements.map((value) => String(value).toUpperCase())
    : [];
  return endorsements.includes("N") || endorsements.includes("X");
};

const rankDriversForOrder = (
  drivers: DispatchMatchDriver[],
  order: OrderWithDetails,
): DriverMatch[] => {
  const pickup = getStop(order, "pickup");
  const orderPriority = String(
    (order as Record<string, unknown>).priorityLevel ?? "normal",
  ).toLowerCase();
  const equipmentType = String(order.equipmentType || "").toLowerCase();

  return drivers
    .map((driver) => {
      const statusKey = String(driver.status || "available").toLowerCase();
      const assignmentCount = driver.currentAssignments?.length ?? 0;
      const terminal = parseTerminal(driver.homeTerminal);

      const statusScore = statusScoreByDriverStatus[statusKey] ?? 5;
      const workloadScore = Math.max(-20, 18 - assignmentCount * 10);

      let proximityScore = 0;
      let proximityReason = "Terminal proximity unavailable";
      if (pickup?.state && terminal.state) {
        if (pickup.state.toUpperCase() === terminal.state) {
          proximityScore += 20;
          proximityReason = `Terminal in pickup state (${terminal.state})`;
          if (
            pickup.city &&
            terminal.city &&
            pickup.city.toLowerCase() === terminal.city.toLowerCase()
          ) {
            proximityScore += 12;
            proximityReason = `Terminal in pickup city (${pickup.city})`;
          }
        } else {
          proximityScore += 3;
          proximityReason = `Terminal ${terminal.state} vs pickup ${pickup.state}`;
        }
      }

      let equipmentScore = 8;
      let equipmentReason = "Equipment profile is compatible";
      let isHardBlocked = false;
      if (equipmentType === "tanker") {
        if (hasTankerEndorsement(driver)) {
          equipmentScore = 18;
          equipmentReason = "Has tanker/hazmat endorsement";
        } else {
          equipmentScore = -50;
          equipmentReason = "Missing tanker/hazmat endorsement";
          isHardBlocked = true;
        }
      }

      const cdlDays = daysUntil(driver.licenseExpirationDate);
      let complianceScore = 0;
      let complianceReason = "CDL expiration date unavailable";
      if (cdlDays !== null) {
        if (cdlDays < 0) {
          complianceScore = -60;
          complianceReason = "CDL is expired";
          isHardBlocked = true;
        } else if (cdlDays <= 30) {
          complianceScore = -20;
          complianceReason = `CDL expires in ${cdlDays} days`;
        } else if (cdlDays <= 90) {
          complianceScore = -8;
          complianceReason = `CDL expires in ${cdlDays} days`;
        } else {
          complianceScore = 6;
          complianceReason = `CDL valid for ${cdlDays} days`;
        }
      }

      let priorityBoost = 0;
      if (orderPriority === "urgent") {
        priorityBoost = statusKey === "available" ? 12 : 5;
      } else if (orderPriority === "high") {
        priorityBoost = statusKey === "available" ? 7 : 3;
      }

      const score =
        statusScore +
        workloadScore +
        proximityScore +
        equipmentScore +
        complianceScore +
        priorityBoost;
      const feasible = !isHardBlocked && score > 0;

      return {
        driver,
        score,
        feasible,
        assignmentCount,
        statusLabel: toTitleCase(statusKey),
        reasons: [
          `Availability: ${toTitleCase(statusKey)}`,
          proximityReason,
          `Current active assignments: ${assignmentCount}`,
          equipmentReason,
          complianceReason,
        ],
      };
    })
    .sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      if (a.score !== b.score) return b.score - a.score;
      return a.assignmentCount - b.assignmentCount;
    })
    .slice(0, 5);
};

// Map view tabs to status filters
function getStatusesForView(view: OrderView): LoadStatus[] | undefined {
  switch (view) {
    case "active":
      return ["in_transit", "dispatched", "assigned"];
    case "available":
      return ["available"];
    case "in_transit":
      return ["in_transit"];
    case "completed":
      return ["completed", "delivered"];
    case "all":
    default:
      return undefined;
  }
}

const viewLabels: Record<OrderView, string> = {
  active: "Active",
  available: "Available",
  in_transit: "In Transit",
  completed: "Completed",
  all: "All",
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPageContent />
    </Suspense>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-28 rounded-2xl" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Initialize state from URL params for back-navigation preservation
  const initialView = (searchParams.get("view") as OrderView) || "active";
  const initialSearch = searchParams.get("q") || "";

  const [view, setView] = useState<OrderView>(initialView);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [assigningDriverId, setAssigningDriverId] = useState<number | null>(null);
  const [newOrder, setNewOrder] = useState({
    customer: "",
    originCity: "",
    originState: "",
    destCity: "",
    destState: "",
    equipmentType: "dry_van",
    commodity: "",
    weight: "",
    pickupDate: "",
    rate: "",
  });

  const pageSize = 12; // 3 cols x 4 rows

  // Build API filters
  const statusFilters = getStatusesForView(view);
  const filters = useMemo(
    () => ({
      search: searchQuery || undefined,
      status: statusFilters,
      page: currentPage,
      pageSize,
      include: ["customer", "stops"],
    }),
    [searchQuery, statusFilters, currentPage, pageSize],
  );

  const { data, isLoading, error } = useOrders(filters);

  const { data: dispatchAssist, isLoading: isDispatchLoading, error: dispatchError } =
    useQuery<DispatchAssistData>({
      queryKey: ["dispatch", "orders-assist"],
      queryFn: async () => {
        const response = await fetch("/api/dispatch");
        if (!response.ok) {
          throw new Error("Failed to load dispatch intelligence");
        }
        const result = (await response.json()) as { data: DispatchAssistData };
        return result.data;
      },
      refetchInterval: 30000,
    });

  const assignmentMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: number; driverId: number }) => {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "assign",
          orderId,
          driverId,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { message?: string };
        throw new Error(errorPayload.message || "Failed to assign driver");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Driver assigned",
        description: `Order #${variables.orderId} was assigned successfully.`,
      });
      setSelectedOrderId(null);
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.details() });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Assignment failed",
        description: mutationError.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setAssigningDriverId(null);
    },
  });

  const totalOrders = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;
  const orders = useMemo(() => data?.data || [], [data?.data]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const unassignedOrderIds = useMemo(
    () => new Set((dispatchAssist?.unassignedOrders || []).map((order) => order.id)),
    [dispatchAssist?.unassignedOrders],
  );

  const isUnassignedOrder = useCallback(
    (order: OrderWithDetails) => {
      if (unassignedOrderIds.has(order.id)) {
        return true;
      }
      const assignedDriverId = (order as Record<string, unknown>).assignedDriverId;
      const hasAssignedDriver =
        typeof assignedDriverId === "number"
          ? assignedDriverId > 0
          : Boolean(assignedDriverId);
      return order.status === "available" && !hasAssignedDriver;
    },
    [unassignedOrderIds],
  );

  const matchedDrivers = useMemo(() => {
    if (!selectedOrder) return [];
    return rankDriversForOrder(dispatchAssist?.drivers || [], selectedOrder);
  }, [dispatchAssist?.drivers, selectedOrder]);

  const handleAssignDriver = useCallback(
    (driver: DispatchMatchDriver) => {
      if (!selectedOrder) return;
      const confirmed = window.confirm(
        `Assign ${driver.firstName} ${driver.lastName} to ${selectedOrder.orderNumber}?`,
      );
      if (!confirmed) return;
      setAssigningDriverId(driver.id);
      assignmentMutation.mutate({
        orderId: selectedOrder.id,
        driverId: driver.id,
      });
    },
    [assignmentMutation, selectedOrder],
  );

  // Update URL when view/search changes
  const handleViewChange = useCallback(
    (newView: OrderView) => {
      setView(newView);
      setCurrentPage(1);
      const params = new URLSearchParams();
      if (newView !== "active") params.set("view", newView);
      if (searchQuery) params.set("q", searchQuery);
      const qs = params.toString();
      router.replace(`/orders${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchQuery],
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
      const params = new URLSearchParams();
      if (view !== "active") params.set("view", view);
      if (query) params.set("q", query);
      const qs = params.toString();
      router.replace(`/orders${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, view],
  );

  const handleOrderCardSelect = useCallback(
    (order: OrderWithDetails) => {
      if (isUnassignedOrder(order)) {
        setSelectedOrderId(order.id);
        return;
      }
      router.push(`/orders/${order.id}`);
    },
    [isUnassignedOrder, router],
  );

  // Build active filter pills
  const activeFilters: ActiveFilter[] = [];
  if (view !== "all") {
    activeFilters.push({
      key: "view",
      label: "View",
      value: viewLabels[view],
    });
  }
  if (searchQuery) {
    activeFilters.push({
      key: "search",
      label: "Search",
      value: searchQuery,
    });
  }

  const handleRemoveFilter = (key: string) => {
    if (key === "view") {
      handleViewChange("all");
    } else if (key === "search") {
      handleSearchChange("");
    }
  };

  const handleClearAll = () => {
    setView("all");
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedOrderId(null);
    router.replace("/orders", { scroll: false });
  };

  const handleCreateOrder = () => {
    const orderNum = `0${(10000 + Math.floor(Math.random() * 90000)).toString()}`;
    setShowNewOrderForm(false);
    setOrderToast(orderNum);
    setNewOrder({
      customer: "",
      originCity: "",
      originState: "",
      destCity: "",
      destState: "",
      equipmentType: "dry_van",
      commodity: "",
      weight: "",
      pickupDate: "",
      rate: "",
    });
    setTimeout(() => setOrderToast(null), 4000);
  };

  // Empty state message
  const emptyMessage = searchQuery
    ? `No orders match "${searchQuery}". Try different terms.`
    : `No ${view === "all" ? "" : viewLabels[view].toLowerCase() + " "}orders. Check other views.`;

  const selectedPickup = selectedOrder ? getStop(selectedOrder, "pickup") : null;
  const selectedDelivery = selectedOrder ? getStop(selectedOrder, "delivery") : null;
  const selectedPriority = String(
    (selectedOrder as (Record<string, unknown> & { priorityLevel?: string }) | null)
      ?.priorityLevel ?? "normal",
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage loads from booking through delivery.
          </p>
        </div>
        <Button
          onClick={() => setShowNewOrderForm(true)}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {orderToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 top-20 z-50 w-[340px] rounded-2xl border border-primary/20 bg-card p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-apollo-lime-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Order Created
                </p>
                <p className="text-xs text-muted-foreground">
                  {orderToast} has been created and is ready for dispatch.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Order Modal */}
      <AnimatePresence>
        {showNewOrderForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowNewOrderForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Create New Order
                </h2>
                <button
                  onClick={() => setShowNewOrderForm(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Customer
                  </label>
                  <input
                    type="text"
                    value={newOrder.customer}
                    onChange={(e) =>
                      setNewOrder((p) => ({ ...p, customer: e.target.value }))
                    }
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Origin City
                    </label>
                    <input
                      type="text"
                      value={newOrder.originCity}
                      onChange={(e) =>
                        setNewOrder((p) => ({
                          ...p,
                          originCity: e.target.value,
                        }))
                      }
                      placeholder="Dallas"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Origin State
                    </label>
                    <input
                      type="text"
                      value={newOrder.originState}
                      onChange={(e) =>
                        setNewOrder((p) => ({
                          ...p,
                          originState: e.target.value,
                        }))
                      }
                      placeholder="TX"
                      maxLength={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Destination City
                    </label>
                    <input
                      type="text"
                      value={newOrder.destCity}
                      onChange={(e) =>
                        setNewOrder((p) => ({
                          ...p,
                          destCity: e.target.value,
                        }))
                      }
                      placeholder="Houston"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Dest State
                    </label>
                    <input
                      type="text"
                      value={newOrder.destState}
                      onChange={(e) =>
                        setNewOrder((p) => ({
                          ...p,
                          destState: e.target.value,
                        }))
                      }
                      placeholder="TX"
                      maxLength={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Commodity
                    </label>
                    <input
                      type="text"
                      value={newOrder.commodity}
                      onChange={(e) =>
                        setNewOrder((p) => ({
                          ...p,
                          commodity: e.target.value,
                        }))
                      }
                      placeholder="General freight"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Weight (lbs)
                    </label>
                    <input
                      type="text"
                      value={newOrder.weight}
                      onChange={(e) =>
                        setNewOrder((p) => ({ ...p, weight: e.target.value }))
                      }
                      placeholder="42,000"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={newOrder.pickupDate}
                      onChange={(e) =>
                        setNewOrder((p) => ({
                          ...p,
                          pickupDate: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Rate ($)
                    </label>
                    <input
                      type="text"
                      value={newOrder.rate}
                      onChange={(e) =>
                        setNewOrder((p) => ({ ...p, rate: e.target.value }))
                      }
                      placeholder="2,500.00"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewOrderForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={!newOrder.customer || !newOrder.originCity}
                  >
                    Create Order
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & View Tabs */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        <OrderFilters
          view={view}
          onViewChange={handleViewChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          totalOrders={totalOrders}
        />
        <FilterPills
          filters={activeFilters}
          onRemove={handleRemoveFilter}
          onClearAll={activeFilters.length > 1 ? handleClearAll : undefined}
        />
      </div>

      <div
        className={cn(
          "grid gap-5",
          selectedOrder ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
        )}
      >
        <div className="space-y-4">
          {/* Order Cards Grid */}
          {isLoading ? (
            <div
              className={cn(
                "grid gap-4",
                selectedOrder
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="pt-3 border-t border-border">
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
              <p className="text-sm text-red-600">
                Failed to load orders. Please try again.
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                {searchQuery ? (
                  <Search className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <ClipboardText className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowNewOrderForm(true)}
                  className="inline-flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Create Order
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-4",
                  selectedOrder
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {orders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    onSelect={handleOrderCardSelect}
                    selected={selectedOrderId === order.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground font-mono px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedOrder && (
          <aside className="space-y-4">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Dispatch Assistant
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSelectedOrderId(null)}
                  aria-label="Close dispatch assistant"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>
                      {selectedPickup?.city || "Origin"}{selectedPickup?.state ? `, ${selectedPickup.state}` : ""}
                      {" -> "}
                      {selectedDelivery?.city || "Destination"}{selectedDelivery?.state ? `, ${selectedDelivery.state}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span className="capitalize">
                    {(selectedOrder.equipmentType || "equipment").replace(/_/g, " ")}
                  </span>
                  <span>•</span>
                  <span>Priority: {selectedPriority}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Top feasible drivers
                </p>

                {isDispatchLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="rounded-xl border border-border p-3 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-7 w-full" />
                      </div>
                    ))}
                  </div>
                ) : dispatchError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50/40 p-3">
                    <p className="text-xs text-red-700">
                      Dispatch intelligence is unavailable right now.
                    </p>
                  </div>
                ) : matchedDrivers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                      No feasible drivers are currently available for this load.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {matchedDrivers.map((candidate) => (
                      <div
                        key={candidate.driver.id}
                        className={cn(
                          "rounded-xl border p-3",
                          candidate.feasible
                            ? "border-border bg-background"
                            : "border-amber-200 bg-amber-50/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {candidate.driver.firstName} {candidate.driver.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {candidate.driver.employeeId}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-mono">
                            {candidate.score}
                          </Badge>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            className={cn(
                              "border text-xs",
                              driverBadgeClassByStatus[
                                String(candidate.driver.status || "").toLowerCase()
                              ] || "bg-slate-100 text-slate-700 border-slate-200",
                            )}
                          >
                            {candidate.statusLabel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {candidate.assignmentCount} active load
                            {candidate.assignmentCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {candidate.reasons.slice(0, 3).map((reason) => (
                            <p
                              key={`${candidate.driver.id}-${reason}`}
                              className="text-xs text-muted-foreground flex items-start gap-1.5"
                            >
                              <CaretRight className="h-3 w-3 mt-[1px] shrink-0" />
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          variant={candidate.feasible ? "primary" : "outline"}
                          onClick={() => handleAssignDriver(candidate.driver)}
                          disabled={!candidate.feasible || assignmentMutation.isPending}
                          loading={
                            assignmentMutation.isPending &&
                            assigningDriverId === candidate.driver.id
                          }
                        >
                          {candidate.feasible ? (
                            <>
                              <User className="h-3.5 w-3.5" />
                              Assign to Load
                            </>
                          ) : (
                            "Not Feasible"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
