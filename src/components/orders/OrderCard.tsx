"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Truck,
  Calendar,
  NavigationArrow,
  FileText,
  PencilSimple,
  Snowflake,
  Package,
  Warning,
  UserCircle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import type { OrderWithDetails, LoadStatus } from "@/types";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: OrderWithDetails;
  index?: number;
  onSelect?: (order: OrderWithDetails) => void;
  selected?: boolean;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  in_transit: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "In Transit" },
  dispatched: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Dispatched" },
  available: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "Available" },
  assigned: { color: "bg-blue-50 text-blue-600 border-blue-200", label: "Assigned" },
  completed: { color: "bg-green-100 text-green-700 border-green-200", label: "Completed" },
  delivered: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Delivered" },
  at_pickup: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "At Pickup" },
  at_delivery: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "At Delivery" },
  cancelled: { color: "bg-red-100 text-red-700 border-red-200", label: "Cancelled" },
  problem: { color: "bg-red-100 text-red-700 border-red-200", label: "Problem" },
};

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
  if (!num || num === 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

export default function OrderCard({
  order,
  index = 0,
  onSelect,
  selected = false,
}: OrderCardProps) {
  const router = useRouter();

  const status = (order.status || "available") as LoadStatus;
  const config = statusConfig[status] || statusConfig.available;
  const pickup = order.stops?.find((s) => s.type === "pickup");
  const delivery = order.stops?.find((s) => s.type === "delivery");

  // Load flags from API
  const ext = order as Record<string, unknown>;
  const isOverdue = ext.isOverdue === true;
  const isUrgent = ext.isUrgent === true;
  const isUnassigned = ext.isUnassigned === true;
  const assignedDriverName = typeof ext.assignedDriverName === "string" ? ext.assignedDriverName : null;
  const assignedEquipment = typeof ext.assignedEquipment === "string" ? ext.assignedEquipment : null;

  const equipmentType = order.equipmentType || "dry_van";
  const EquipmentIcon = equipmentIcons[equipmentType] || Truck;
  const equipmentLabel = equipmentType.replace(/_/g, " ");

  // Use normalized fields from API (totalRevenue) with fallback
  const revenue = formatCurrency(
    (order as Record<string, unknown>).totalRevenue ??
    (order as Record<string, unknown>).totalRate ??
    order.totalRevenue
  );

  const createdDate = formatDate(order.createdAt);
  const pickupDate = formatDate(pickup?.scheduledDate ?? pickup?.scheduledDateTime);

  const originCity = pickup?.city;
  const originState = pickup?.state;
  const destCity = delivery?.city;
  const destState = delivery?.state;

  const hasRoute = originCity && destCity;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(order);
      return;
    }
    router.push(`/orders/${order.id}`);
  };

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === "track") {
      router.push(`/orders/${order.id}?tab=tracking`);
    } else if (action === "documents") {
      router.push(`/orders/${order.id}?tab=documents`);
    } else if (action === "edit") {
      router.push(`/orders/${order.id}?edit=true`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.04,
      }}
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer rounded-2xl border border-border bg-card p-5",
        "shadow-xs hover:shadow-md transition-shadow duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        selected && "border-primary/40 ring-2 ring-primary/15",
        status === "problem" && "border-red-200 bg-red-50/30",
        isUrgent && "border-red-300 ring-1 ring-red-200/60 shadow-red-100/40",
      )}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Top Row: Customer + Order # + Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {order.customer?.name || "Unknown Customer"}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            {order.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOverdue && (
            <Badge className="border border-red-300 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0">
              <Warning className="h-3 w-3 mr-0.5" weight="bold" />
              OVERDUE
            </Badge>
          )}
          <Badge className={cn("border text-xs font-medium", config.color)}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Flags row */}
      {(isUnassigned || assignedDriverName) && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isUnassigned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              <UserCircle className="h-3 w-3" />
              Unassigned
            </span>
          )}
          {assignedDriverName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <UserCircle className="h-3 w-3" />
              {assignedDriverName}
            </span>
          )}
          {assignedEquipment && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Truck className="h-3 w-3" />
              {assignedEquipment}
            </span>
          )}
        </div>
      )}

      {/* Middle Row: Route + Equipment + Revenue */}
      <div className="space-y-2 mb-3">
        {/* Route */}
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {hasRoute ? (
            <span className="truncate">
              {originCity}, {originState} → {destCity}, {destState}
            </span>
          ) : (
            <span className="text-muted-foreground italic">Not Assigned</span>
          )}
        </div>

        {/* Equipment + Commodity */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <EquipmentIcon className="h-3.5 w-3.5" />
            <span className="capitalize">{equipmentLabel}</span>
          </span>
          {order.commodity && (
            <>
              <span className="text-border">|</span>
              <span className="truncate">{order.commodity}</span>
            </>
          )}
        </div>

        {/* Revenue */}
        {revenue && (
          <p className="text-lg font-semibold font-mono text-foreground">
            {revenue}
          </p>
        )}
      </div>

      {/* Bottom Row: Dates + Quick Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {createdDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {createdDate}
            </span>
          )}
          {pickupDate && (
            <span className="flex items-center gap-1 text-foreground font-medium">
              Pickup: {pickupDate}
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {(status === "in_transit" || status === "dispatched") && (
            <button
              onClick={(e) => handleQuickAction(e, "track")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Track"
            >
              <NavigationArrow className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => handleQuickAction(e, "documents")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Documents"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => handleQuickAction(e, "edit")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit"
          >
            <PencilSimple className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
