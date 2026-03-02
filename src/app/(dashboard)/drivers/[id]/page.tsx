"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  DotsThree,
  Phone,
  EnvelopeOpen,
  MapPin,
  IdentificationBadge as Certificate,
  Truck,
  CurrencyDollar as DollarSign,
  ShieldCheck,
  FileText,
  GearSix as Gear,
  Gauge,
  Drop,
  Timer,
} from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { driverKeys, useDeleteDriver, useDriver, useUpdateDriver } from "@/lib/hooks/api/use-drivers";
import { orderKeys } from "@/lib/hooks/api/use-orders";
import type { DriverStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Tab Components
import DriverQualificationsTab from "@/components/drivers/driver-qualifications-tab";
import DriverLoadsTab from "@/components/drivers/driver-loads-tab";
import DriverPayTab from "@/components/drivers/driver-pay-tab";
import DriverSafetyTab from "@/components/drivers/driver-safety-tab";
import DriverDocumentsTab from "@/components/drivers/driver-documents-tab";
import DriverPreferencesTab from "@/components/drivers/driver-preferences-tab";
import DriverFuelEnergyTab from "@/components/drivers/driver-fuel-energy-tab";
import DriverIdlingTab from "@/components/drivers/driver-idling-tab";

const getStatusBadge = (status: DriverStatus) => {
  const statusConfig = {
    available: { color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200", label: "Available" },
    on_load: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "On Load" },
    off_duty: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Off Duty" },
    sleeper: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Sleeper" },
    driving: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Driving" },
    on_break: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "On Break" },
  };

  const config = statusConfig[status] || statusConfig.available;
  return (
    <Badge className={cn("border font-mono text-xs", config.color)}>
      {config.label}
    </Badge>
  );
};

const driverStatusOptions = [
  { value: "available", label: "Available" },
  { value: "on_load", label: "On Load" },
  { value: "off_duty", label: "Off Duty" },
  { value: "sleeper", label: "Sleeper" },
  { value: "driving", label: "Driving" },
  { value: "on_break", label: "On Break" },
];

interface DriverFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  homeTerminal: string;
  status: DriverStatus;
}

interface AvailableLoadStop {
  id: number;
  type: string;
  city: string;
  state: string;
  sequence: number;
  scheduledDate?: string | null;
}

interface AvailableLoad {
  id: number;
  orderNumber: string;
  status: string;
  commodity: string;
  equipmentType?: string;
  priorityLevel: string;
  totalRevenue: string;
  miles: string;
  customer?: {
    id: number;
    name: string;
    code: string;
  };
  stops?: AvailableLoadStop[];
}

interface DispatchDriverSnapshot {
  id: number;
  status?: string | null;
  homeTerminal?: string | null;
  cdlEndorsements?: string[] | null;
  currentAssignments: Array<{ assignment: { id: number } }>;
}

interface DispatchQuickAssignData {
  drivers: DispatchDriverSnapshot[];
  unassignedOrders: AvailableLoad[];
}

interface LoadRecommendation extends AvailableLoad {
  score: number;
  rationale: string;
  assignmentCount: number;
}

const createDriverFormState = (driver: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  homeTerminal?: string | null;
  status?: DriverStatus | null;
}): DriverFormState => ({
  firstName: driver.firstName || "",
  lastName: driver.lastName || "",
  email: driver.email || "",
  phone: driver.phone || "",
  homeTerminal: driver.homeTerminal || "",
  status: (driver.status || "available") as DriverStatus,
});

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const formatCurrency = (value: string | number | null | undefined) => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const parseHomeTerminal = (value: string | null | undefined) => {
  if (!value) {
    return { city: null, state: null };
  }

  const segments = value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const city = segments[0] || null;
  const state = segments[1] ? segments[1].toUpperCase() : null;
  return { city, state };
};

const scoreBadgeClass = (score: number) => {
  if (score >= 80) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (score >= 60) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (score >= 40) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  return "bg-rose-100 text-rose-700 border-rose-200";
};

const getStopByType = (
  stops: AvailableLoadStop[],
  type: "pickup" | "delivery",
) =>
  stops.find((stop) => String(stop.type).toLowerCase() === type) ?? null;

const hasTankerEndorsement = (driver: { cdlEndorsements?: unknown }) => {
  const endorsements = Array.isArray(driver.cdlEndorsements)
    ? driver.cdlEndorsements.map((entry) => String(entry).toUpperCase())
    : [];
  return endorsements.includes("N") || endorsements.includes("X");
};

const scoreLoadRecommendation = ({
  load,
  driverId,
  driverStatus,
  homeTerminal,
  assignmentCount,
  cdlEndorsements,
}: {
  load: AvailableLoad;
  driverId: number;
  driverStatus: string;
  homeTerminal: string | null | undefined;
  assignmentCount: number;
  cdlEndorsements?: unknown;
}): LoadRecommendation | null => {
  const orderedStops = [...(load.stops || [])].sort(
    (a, b) => (a.sequence || 0) - (b.sequence || 0),
  );
  const pickup = getStopByType(orderedStops, "pickup") ?? orderedStops[0] ?? null;

  const terminal = parseHomeTerminal(homeTerminal);
  const priority = String(load.priorityLevel || "normal").toLowerCase();
  const equipmentType = String(load.equipmentType || "").toLowerCase();
  const status = String(driverStatus || "available").toLowerCase();

  let routeScore = 10;
  let routeReason = "Route proximity unavailable";
  if (pickup?.state && terminal.state) {
    if (pickup.state.toUpperCase() === terminal.state) {
      routeScore += 14;
      routeReason = `Terminal aligns with pickup state (${terminal.state})`;
      if (
        pickup.city &&
        terminal.city &&
        pickup.city.toLowerCase() === terminal.city.toLowerCase()
      ) {
        routeScore += 8;
        routeReason = `Terminal aligns with pickup city (${pickup.city})`;
      }
    } else {
      routeScore += 3;
      routeReason = `Terminal ${terminal.state} vs pickup ${pickup.state}`;
    }
  }

  const hos = getMockHOSData(driverId);
  const statusBase: Record<string, number> = {
    available: 18,
    on_load: 13,
    driving: 10,
    on_break: 8,
    sleeper: 6,
    off_duty: 4,
  };
  const hosScore = Math.max(
    0,
    Math.round((statusBase[status] ?? 8) + hos.remaining * 1.6 + hos.dutyRemaining * 0.8),
  );
  const hosReason = `${hos.remaining.toFixed(1)}h drive remaining (${status.replace("_", " ")})`;

  let equipmentScore = 18;
  let equipmentReason = "Equipment profile fits load";
  let hardBlocked = false;
  if (equipmentType === "tanker") {
    if (hasTankerEndorsement({ cdlEndorsements })) {
      equipmentScore = 24;
      equipmentReason = "Tanker endorsement verified";
    } else {
      equipmentScore = 0;
      equipmentReason = "Missing tanker endorsement";
      hardBlocked = true;
    }
  } else if (equipmentType === "refrigerated") {
    equipmentScore = 20;
    equipmentReason = "Reefer requirement supported";
  } else if (equipmentType === "flatbed") {
    equipmentScore = 19;
    equipmentReason = "Flatbed load is serviceable";
  }

  const workloadScore = Math.max(0, 18 - assignmentCount * 4);
  const workloadReason = `${assignmentCount} active load${assignmentCount === 1 ? "" : "s"} in plan`;

  const priorityScoreByLevel: Record<string, number> = {
    urgent: 20,
    high: 14,
    normal: 9,
    low: 5,
  };
  const priorityScore = priorityScoreByLevel[priority] ?? 8;
  const priorityReason = `Priority ${priority}`;

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(routeScore + hosScore + equipmentScore + workloadScore + priorityScore),
    ),
  );

  if (hardBlocked || assignmentCount >= 5 || score < 35) {
    return null;
  }

  return {
    ...load,
    score,
    assignmentCount,
    rationale: `${routeReason} • ${hosReason} • ${workloadReason} • ${priorityReason} • ${equipmentReason}`,
  };
};

// Mock HOS data - in real app this would come from ELD integration
const getMockHOSData = (driverId: number) => {
  const variations = [
    { drive: 8.5, remaining: 2.5, total: 11, duty: 13.5, dutyRemaining: 0.5 },
    { drive: 6.2, remaining: 4.8, total: 11, duty: 11.8, dutyRemaining: 2.2 },
    { drive: 10.1, remaining: 0.9, total: 11, duty: 13.8, dutyRemaining: 0.2 },
    { drive: 3.4, remaining: 7.6, total: 11, duty: 8.2, dutyRemaining: 5.8 },
    { drive: 9.8, remaining: 1.2, total: 11, duty: 12.9, dutyRemaining: 1.1 },
  ];
  return variations[driverId % variations.length];
};

const HosGaugeLarge = ({ driverId }: { driverId: number }) => {
  const hos = getMockHOSData(driverId);
  const drivePercentage = (hos.drive / hos.total) * 100;
  const dutyPercentage = (hos.duty / 14) * 100; // 14 hour duty limit
  const isDriveLow = hos.remaining < 2;
  const isDutyLow = hos.dutyRemaining < 1;

  return (
    <div className="flex items-center gap-6">
      {/* Drive Time Gauge */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={isDriveLow ? "text-red-500" : "text-apollo-cyan-500"}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${drivePercentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono font-semibold">
              {hos.remaining.toFixed(1)}h
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Drive Time</p>
          <p className={cn("text-xs font-mono", isDriveLow ? "text-red-600" : "text-muted-foreground")}>
            {hos.drive.toFixed(1)} / {hos.total}h used
          </p>
          <p className="text-xs text-muted-foreground">
            {hos.remaining.toFixed(1)}h remaining
          </p>
        </div>
      </div>

      {/* Duty Time Gauge */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={isDutyLow ? "text-red-500" : "text-blue-500"}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dutyPercentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono font-semibold">
              {hos.dutyRemaining.toFixed(1)}h
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Duty Time</p>
          <p className={cn("text-xs font-mono", isDutyLow ? "text-red-600" : "text-muted-foreground")}>
            {hos.duty.toFixed(1)} / 14h used
          </p>
          <p className="text-xs text-muted-foreground">
            {hos.dutyRemaining.toFixed(1)}h remaining
          </p>
        </div>
      </div>
    </div>
  );
};

export default function DriverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("qualifications");
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [formState, setFormState] = useState<DriverFormState | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const driverId = parseInt(id, 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isNaN(driverId)) {
    notFound();
  }

  const { data, isLoading, error } = useDriver(driverId, [
    "qualifications",
    "certifications",
    "currentAssignment",
    "settlements",
    "documents",
  ]);
  const updateDriverMutation = useUpdateDriver();
  const deleteDriverMutation = useDeleteDriver();
  const driver = data?.data;
  const assignment = driver?.currentAssignment;

  const shouldLoadRecommendationData =
    !isLoading &&
    !error &&
    Boolean(driver);

  const {
    data: quickAssignData,
    isLoading: isQuickAssignLoading,
    error: quickAssignError,
  } = useQuery<DispatchQuickAssignData>({
    queryKey: ["dispatch", "driver-quick-assign", driverId],
    queryFn: async () => {
      const response = await fetch("/api/dispatch");
      if (!response.ok) {
        throw new Error("Failed to load available orders");
      }
      const result = (await response.json()) as { data: DispatchQuickAssignData };
      return result.data;
    },
    enabled: shouldLoadRecommendationData,
    refetchInterval: 30000,
  });

  const quickAssignMutation = useMutation({
    mutationFn: async (orderId: number) => {
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
        throw new Error(errorPayload.message || "Failed to assign load");
      }

      return response.json();
    },
    onSuccess: (_data, orderId) => {
      toast({
        title: "Load assigned",
        description: `Order #${orderId} assigned to ${driver?.firstName || "driver"} ${driver?.lastName || ""}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "driver-quick-assign", driverId] });
      queryClient.invalidateQueries({ queryKey: driverKeys.details() });
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
      setAssigningOrderId(null);
    },
  });

  if (isLoading) {
    return <DriverProfileSkeleton />;
  }

  if (error || !driver) {
    notFound();
  }

  const safetyScore = driver.safetyScore ? Number(driver.safetyScore) : 87.5; // Mock score
  const activeFormState = formState ?? createDriverFormState(driver);
  const dispatchDriverSnapshot =
    quickAssignData?.drivers?.find((entry) => entry.id === driver.id) ?? null;
  const activeLoadCount =
    dispatchDriverSnapshot?.currentAssignments?.length ??
    (assignment?.order ? 1 : 0);

  const recommendedLoads = (quickAssignData?.unassignedOrders || [])
    .map((load) =>
      scoreLoadRecommendation({
        load,
        driverId: driver.id,
        driverStatus: String(dispatchDriverSnapshot?.status ?? driver.status ?? "available"),
        homeTerminal: dispatchDriverSnapshot?.homeTerminal ?? driver.homeTerminal ?? null,
        assignmentCount: activeLoadCount,
        cdlEndorsements:
          dispatchDriverSnapshot?.cdlEndorsements ?? driver.cdlEndorsements ?? [],
      }),
    )
    .filter((load): load is LoadRecommendation => load !== null)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return Number.parseFloat(b.totalRevenue || "0") - Number.parseFloat(a.totalRevenue || "0");
    })
    .slice(0, 8);

  const tabs = [
    { value: "qualifications", label: "Qualifications", icon: Certificate, badge: driver.qualifications?.length },
    { value: "loads", label: "Loads", icon: Truck },
    { value: "pay", label: "Pay", icon: DollarSign },
    { value: "safety", label: "Safety", icon: ShieldCheck },
    { value: "documents", label: "Documents", icon: FileText, badge: driver.documents?.length },
    { value: "preferences", label: "Preferences", icon: Gear },
    { value: "fuel", label: "Fuel & Energy", icon: Drop },
    { value: "idling", label: "Idling", icon: Timer },
  ];

  const handleSave = async () => {
    const values = formState ?? createDriverFormState(driver);
    try {
      await updateDriverMutation.mutateAsync({
        id: driver.id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        homeTerminal: values.homeTerminal,
        status: values.status,
      });
      toast({
        title: "Driver updated",
        description: `${values.firstName} ${values.lastName} was saved successfully.`,
      });
      setFormState(null);
      setIsEditing(false);
    } catch {
      toast({
        title: "Failed to update driver",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete ${driver.firstName} ${driver.lastName}? This removes the driver from active lists.`,
    );
    if (!confirmed) return;

    try {
      await deleteDriverMutation.mutateAsync(driver.id);
      toast({
        title: "Driver deleted",
        description: `${driver.firstName} ${driver.lastName} was removed.`,
      });
      router.push("/drivers");
    } catch {
      toast({
        title: "Failed to delete driver",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormState(createDriverFormState(driver));
  };

  const handleQuickAssign = (order: AvailableLoad) => {
    const confirmed = window.confirm(
      `Assign ${driver.firstName} ${driver.lastName} to ${order.orderNumber}?`,
    );
    if (!confirmed) return;
    setAssigningOrderId(order.id);
    quickAssignMutation.mutate(order.id);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {driver.firstName} {driver.lastName}
              </h1>
              {getStatusBadge(driver.status || "off_duty")}
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{driver.employeeId || `DRV-${driver.id.toString().padStart(4, "0")}`}</span>
              {driver.cdlState && (
                <>
                  <span>•</span>
                  <span>CDL: {driver.cdlState}</span>
                </>
              )}
              {driver.hireDate && (
                <>
                  <span>•</span>
                  <span>Hired {formatDate(driver.hireDate)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isEditing) {
                setFormState(null);
                setIsEditing(false);
                return;
              }
              resetForm();
              setIsEditing(true);
            }}
          >
            {isEditing ? "Cancel Edit" : "Edit Driver"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowActions((prev) => !prev)}
          >
            <DotsThree className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showActions && (
        <Card className="p-4 border-red-200 bg-red-50/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Driver Actions</p>
              <p className="text-xs text-muted-foreground">
                Remove this driver from active operations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:text-red-700"
              onClick={handleDelete}
              loading={deleteDriverMutation.isPending}
            >
              Delete Driver
            </Button>
          </div>
        </Card>
      )}

      {isEditing && (
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">First Name</label>
              <Input
                value={activeFormState.firstName}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...(prev ?? createDriverFormState(driver)),
                    firstName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Last Name</label>
              <Input
                value={activeFormState.lastName}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...(prev ?? createDriverFormState(driver)),
                    lastName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={activeFormState.email}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...(prev ?? createDriverFormState(driver)),
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input
                value={activeFormState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...(prev ?? createDriverFormState(driver)),
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Home Terminal</label>
              <Input
                value={activeFormState.homeTerminal}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...(prev ?? createDriverFormState(driver)),
                    homeTerminal: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select
                value={activeFormState.status}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...(prev ?? createDriverFormState(driver)),
                    status: (Array.isArray(value) ? value[0] : value) as DriverStatus,
                  }))
                }
                options={driverStatusOptions}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={updateDriverMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* Driver Header Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Profile Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-medium text-slate-600">
                  {driver.firstName[0]}{driver.lastName[0]}
                </span>
              </div>
            </Avatar>

            <div className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {driver.firstName} {driver.lastName}
                </h2>
                <p className="text-muted-foreground font-mono">
                  Employee ID: {driver.employeeId}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {driver.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span className="font-mono">{driver.phone}</span>
                  </div>
                )}
                {driver.email && (
                  <div className="flex items-center gap-1">
                    <EnvelopeOpen className="h-4 w-4" />
                    <span>{driver.email}</span>
                  </div>
                )}
                {(driver.city && driver.state) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{driver.city}, {driver.state}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HOS Status */}
          <div className="flex-1 lg:flex lg:justify-end">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Hours of Service</h3>
              </div>
              <HosGaugeLarge driverId={driver.id} />
            </div>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-mono font-semibold text-foreground">
              {safetyScore.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Safety Score</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-mono font-semibold text-foreground">
              {activeLoadCount}
            </p>
            <p className="text-xs text-muted-foreground">Active Loads</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-mono font-semibold text-foreground">
              {driver.qualifications?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Qualifications</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-mono font-semibold text-foreground">
              {driver.certifications?.filter(cert => cert.isActive).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Certifications</p>
          </div>
        </div>

        {/* Current Assignment */}
        {assignment && assignment.order && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Current Assignment</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Order #{assignment.order.orderNumber}
                  {assignment.tractor && ` • Tractor ${assignment.tractor.unitNumber}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {assignment.order.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!assignment.order?.id) return;
                    router.push(`/orders/${assignment.order.id}`);
                  }}
                >
                  Open Order
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Assignable Load Recommendations
              </p>
              <p className="text-xs text-muted-foreground">
                Feasibility score (0-100): route proximity, HOS proxy, equipment fit, workload, and urgency.
              </p>
            </div>
            <Badge variant="outline" className="font-mono">
              {recommendedLoads.length}
            </Badge>
          </div>

          <div className="mt-3 space-y-2">
            {isQuickAssignLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-background p-3 space-y-2"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))
            ) : quickAssignError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Could not load load recommendations.
              </div>
            ) : recommendedLoads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                No feasible loads are currently assignable for this driver.
              </div>
            ) : (
              recommendedLoads.map((order) => {
                const orderedStops = [...(order.stops || [])].sort(
                  (a, b) => (a.sequence || 0) - (b.sequence || 0),
                );
                const pickup =
                  orderedStops.find((stop) => stop.type === "pickup") || orderedStops[0];
                const delivery =
                  orderedStops.find((stop) => stop.type === "delivery") || orderedStops[1];

                return (
                  <div
                    key={order.id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-foreground">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customer?.name || "Customer"}
                          {order.commodity ? ` • ${order.commodity}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pickup?.city || "Origin"}
                          {pickup?.state ? `, ${pickup.state}` : ""} {" -> "}
                          {delivery?.city || "Destination"}
                          {delivery?.state ? `, ${delivery.state}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={cn("border font-mono", scoreBadgeClass(order.score))}>
                          {order.score}
                        </Badge>
                        <Badge variant="outline" className="h-5 text-[10px] uppercase">
                          {order.priorityLevel || "normal"}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {order.rationale}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatCurrency(order.totalRevenue)} • {order.miles || "0"} mi • {order.assignmentCount} active load{order.assignmentCount === 1 ? "" : "s"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleQuickAssign(order)}
                          loading={quickAssignMutation.isPending && assigningOrderId === order.id}
                          disabled={quickAssignMutation.isPending}
                        >
                          Quick Assign
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Tabs tabs={tabs.map(tab => ({ value: tab.value, label: tab.label }))} value={activeTab} onValueChange={setActiveTab} variant="line">
        <TabsList className="border-b border-border bg-transparent">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 text-xs font-mono">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="qualifications">
            <DriverQualificationsTab driver={driver} />
          </TabsContent>

          <TabsContent value="loads">
            <DriverLoadsTab driver={driver} />
          </TabsContent>

          <TabsContent value="pay">
            <DriverPayTab driver={driver} />
          </TabsContent>

          <TabsContent value="safety">
            <DriverSafetyTab driver={driver} />
          </TabsContent>

          <TabsContent value="documents">
            <DriverDocumentsTab driver={driver} />
          </TabsContent>

          <TabsContent value="preferences">
            <DriverPreferencesTab driver={driver} />
          </TabsContent>

          <TabsContent value="fuel">
            <DriverFuelEnergyTab driver={driver} />
          </TabsContent>

          <TabsContent value="idling">
            <DriverIdlingTab driver={driver} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function DriverProfileSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-1 flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Header card skeleton */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4 pt-6 border-t border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-6 border-b border-border pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
