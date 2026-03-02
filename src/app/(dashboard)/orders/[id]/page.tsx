"use client";

import { Suspense, use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Calendar,
  Package,
  CurrencyDollar as DollarSign,
  ClockCounterClockwise,
  FileText,
  NavigationArrow,
  Receipt,
  PencilSimple,
  Trash,
  UploadSimple,
  NotePencil,
  Snowflake,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useOrder, useDeleteOrder, useUpdateOrder } from "@/lib/hooks/api/use-orders";
import type { LoadStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  in_transit: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "In Transit", dot: "bg-blue-500" },
  dispatched: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Dispatched", dot: "bg-amber-500" },
  available: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "Available", dot: "bg-gray-400" },
  assigned: { color: "bg-blue-50 text-blue-600 border-blue-200", label: "Assigned", dot: "bg-blue-400" },
  completed: { color: "bg-green-100 text-green-700 border-green-200", label: "Completed", dot: "bg-green-500" },
  delivered: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Delivered", dot: "bg-emerald-600" },
  at_pickup: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "At Pickup", dot: "bg-orange-500" },
  at_delivery: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "At Delivery", dot: "bg-sky-500" },
  cancelled: { color: "bg-red-100 text-red-700 border-red-200", label: "Cancelled", dot: "bg-red-500" },
  problem: { color: "bg-red-100 text-red-700 border-red-200", label: "Problem", dot: "bg-red-500" },
};

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const equipmentOptions = [
  { value: "dry_van", label: "Dry Van" },
  { value: "reefer", label: "Reefer" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "flatbed", label: "Flatbed" },
  { value: "step_deck", label: "Step Deck" },
  { value: "tanker", label: "Tanker" },
];

const equipmentIcons: Record<string, React.ElementType> = {
  dry_van: Truck,
  reefer: Snowflake,
  refrigerated: Snowflake,
  flatbed: Package,
  tanker: Truck,
  step_deck: Truck,
};

const formatCurrency = (amount: number | string | null | undefined) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!num || num === 0) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

interface OrderFormState {
  commodity: string;
  equipmentType: string;
  miles: string;
  totalRevenue: string;
  status: LoadStatus;
  specialInstructions: string;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

function OrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<OrderFormState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const orderId = parseInt(id, 10);
  const { toast } = useToast();

  // Handle query params for quick actions from card view
  useEffect(() => {
    if (queryParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [queryParams]);

  if (isNaN(orderId)) {
    notFound();
  }

  const { data, isLoading, error } = useOrder(orderId, [
    "customer",
    "stops",
    "assignments",
    "charges",
    "trackingEvents",
    "documents",
  ]);
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !data?.data) {
    notFound();
  }

  const order = data.data;
  const orderData = order as unknown as Record<string, unknown>;
  const status = (order.status || "available") as LoadStatus;
  const config = statusConfig[status] || statusConfig.available;
  const pickup = order.stops?.find((s) => s.type === "pickup");
  const delivery = order.stops?.find((s) => s.type === "delivery");
  const equipmentType = order.equipmentType || "dry_van";
  const EquipmentIcon = equipmentIcons[equipmentType] || Truck;

  // Normalized fields from API
  const revenue = orderData.totalRevenue ?? orderData.totalRate ?? order.totalRevenue ?? 0;
  const cost = orderData.totalCost ?? orderData.estimatedCost ?? order.totalCost ?? 0;
  const margin = orderData.margin ?? orderData.estimatedMargin ?? order.margin ?? 0;
  const miles = orderData.miles ?? orderData.totalMiles ?? order.miles ?? 0;

  const createFormState = (): OrderFormState => ({
    commodity: order.commodity || "",
    equipmentType: order.equipmentType || "dry_van",
    miles: String(miles || "0"),
    totalRevenue: String(revenue || "0"),
    status: status,
    specialInstructions: String(orderData.specialInstructions ?? order.specialRequirements ?? ""),
  });

  const activeFormState = formState ?? createFormState();

  const handleSave = async () => {
    const values = formState ?? createFormState();
    try {
      await updateOrderMutation.mutateAsync({
        id: order.id,
        commodity: values.commodity,
        equipmentType: values.equipmentType as never,
        miles: Number(values.miles),
        totalRevenue: Number(values.totalRevenue),
        status: values.status as never,
        specialInstructions: values.specialInstructions,
      });
      toast({
        title: "Order updated",
        description: `${order.orderNumber} was saved successfully.`,
      });
      setFormState(null);
      setIsEditing(false);
    } catch {
      toast({ title: "Failed to save order", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrderMutation.mutateAsync(order.id);
      toast({
        title: "Order deleted",
        description: `${order.orderNumber} was removed.`,
      });
      router.push("/orders");
    } catch {
      toast({ title: "Failed to delete order", variant: "destructive" });
    }
  };

  // Build activity history from available data
  const history: { time: string; description: string }[] = [];
  if (order.createdAt) {
    history.push({
      time: formatDateTime(order.createdAt) || "",
      description: "Order created",
    });
  }
  for (const assignment of order.assignments || []) {
    if (assignment.assignedAt) {
      history.push({
        time: formatDateTime(assignment.assignedAt) || "",
        description: "Order assigned to driver",
      });
    }
    if (assignment.dispatchedAt) {
      history.push({
        time: formatDateTime(assignment.dispatchedAt) || "",
        description: "Order dispatched",
      });
    }
  }
  if (order.updatedAt && order.updatedAt !== order.createdAt) {
    history.push({
      time: formatDateTime(order.updatedAt) || "",
      description: `Status changed to ${config.label}`,
    });
  }
  history.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Detail Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-2 px-2 pt-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/orders")}
              className="h-8 w-8 p-0 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight text-foreground font-mono">
                  {order.orderNumber}
                </h1>
                <span className="text-muted-foreground">-</span>
                <span className="text-lg text-foreground">
                  {order.customer?.name || "Unknown Customer"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={cn("border text-xs font-medium", config.color)}>
                  {config.label}
                </Badge>
                <span className={cn("h-2 w-2 rounded-full", config.dot)} />
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
                } else {
                  setFormState(createFormState());
                  setIsEditing(true);
                }
              }}
              className="gap-1.5"
            >
              <PencilSimple className="h-3.5 w-3.5" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="p-4 border-red-200 bg-red-50/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delete {order.orderNumber}?
              </p>
              <p className="text-xs text-muted-foreground">
                This removes it from active order lists.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleteOrderMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Form */}
      {isEditing && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Edit Order</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Commodity</label>
              <Input
                value={activeFormState.commodity}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...(prev ?? createFormState()),
                    commodity: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Equipment</label>
              <Select
                value={activeFormState.equipmentType}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...(prev ?? createFormState()),
                    equipmentType: Array.isArray(value) ? value[0] : value,
                  }))
                }
                options={equipmentOptions}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Miles</label>
              <Input
                type="number"
                value={activeFormState.miles}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...(prev ?? createFormState()),
                    miles: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Revenue</label>
              <Input
                type="number"
                value={activeFormState.totalRevenue}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...(prev ?? createFormState()),
                    totalRevenue: e.target.value,
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
                    ...(prev ?? createFormState()),
                    status: (Array.isArray(value) ? value[0] : value) as LoadStatus,
                  }))
                }
                options={statusOptions}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Special Instructions
              </label>
              <Input
                value={activeFormState.specialInstructions}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...(prev ?? createFormState()),
                    specialInstructions: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={updateOrderMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* 1. Route & Status Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
            Route
          </h2>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Origin
              </label>
              <p className="text-sm font-medium text-foreground mt-1">
                {pickup?.city && pickup?.state
                  ? `${pickup.address}, ${pickup.city}, ${pickup.state}`
                  : "Not assigned"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Destination
              </label>
              <p className="text-sm font-medium text-foreground mt-1">
                {delivery?.city && delivery?.state
                  ? `${delivery.address}, ${delivery.city}, ${delivery.state}`
                  : "Not assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <EquipmentIcon className="h-4 w-4" />
              <span className="capitalize">
                {equipmentType.replace(/_/g, " ")}
              </span>
            </span>
            <span className="text-border">|</span>
            <span>{order.commodity || "No commodity"}</span>
            {Number(miles) > 0 && (
              <>
                <span className="text-border">|</span>
                <span className="font-mono">
                  {Number(miles).toLocaleString()} mi
                </span>
              </>
            )}
          </div>

          {(status === "in_transit" || status === "dispatched") && (
            <div className="pt-3">
              <Button variant="outline" size="sm" className="gap-2">
                <NavigationArrow className="h-4 w-4" />
                Track Shipment
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Schedule Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
            Schedule
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pickup Date
            </label>
            <p className="text-sm font-medium text-foreground mt-1 font-mono">
              {formatDateTime(pickup?.scheduledDate ?? pickup?.scheduledDateTime) ||
                "Not scheduled"}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Delivery Date
            </label>
            <p className="text-sm font-medium text-foreground mt-1 font-mono">
              {formatDateTime(delivery?.scheduledDate ?? delivery?.scheduledDateTime) ||
                "Not scheduled"}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Created
            </label>
            <p className="text-sm text-foreground mt-1 font-mono">
              {formatDate(order.createdAt) || "—"}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Updated
            </label>
            <p className="text-sm text-foreground mt-1 font-mono">
              {formatDateTime(order.updatedAt) || "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Financials Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
            Financials
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Revenue</span>
            <span className="font-mono font-semibold text-foreground text-lg">
              {formatCurrency(revenue)}
            </span>
          </div>
          {Number(cost) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cost</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(cost)}
              </span>
            </div>
          )}
          {Number(margin) > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Margin</span>
                <div className="text-right">
                  <span className="font-mono font-semibold text-green-600">
                    {formatCurrency(margin)}
                  </span>
                  {Number(revenue) > 0 && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {((Number(margin) / Number(revenue)) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 4. Documents & Notes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
              Documents
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <UploadSimple className="h-3.5 w-3.5" />
              Upload
            </Button>
            <Button variant="outline" size="sm">
              View BOL
            </Button>
            <Button variant="outline" size="sm">
              View POD
            </Button>
          </div>

          {order.documents && order.documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {order.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-foreground">{doc.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <NotePencil className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
              Notes
            </h2>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 mb-3">
            <NotePencil className="h-3.5 w-3.5" />
            Add Note
          </Button>

          {(order.notes || order.specialRequirements || (orderData.specialInstructions as string)) && (
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-lg bg-muted/50 text-foreground leading-relaxed">
                {String(orderData.specialInstructions ?? order.specialRequirements ?? order.notes ?? "")}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 5. Activity History Timeline */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockCounterClockwise className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
            Activity History
          </h2>
        </div>

        {history.length > 0 ? (
          <div className="space-y-0">
            {history.map((event, i) => (
              <div key={i} className="flex gap-3 py-2">
                <div className="flex flex-col items-center pt-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                  {i < history.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-sm text-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        )}
      </Card>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Section skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
