"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Package,
  MapPin,
  Calendar,
  Truck,
  Warning,
  Clock,
  CurrencyDollar,
  ArrowRight,
  CaretDown,
  CaretRight,
  DotsThree,
  Snowflake,
  Drop,
  Stack,
  Buildings,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Stop {
  id: number;
  type: string;
  city: string;
  state: string;
  scheduledDate: string;
  sequence: number;
  address: string;
}

interface Customer {
  id: number;
  name: string;
  code: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  commodity: string;
  weight: string;
  pieces: number;
  equipmentType: string;
  priorityLevel: string;
  totalRevenue: string;
  miles: string;
  notes?: string;
  customerReferenceNumber?: string;
  customer: Customer;
  stops: Stop[];
  createdAt: string;
}

interface LoadQueueProps {
  orders: Order[];
  selectedOrderIds?: number[];
  onOrderSelect?: (orderId: number) => void;
  onOrderToggleSelect?: (orderId: number) => void;
  onBulkAction?: (action: string, orderIds: number[]) => void;
  className?: string;
}

const priorityColors = {
  urgent: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
  high: "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20",
  normal: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
  low: "border-l-zinc-500 bg-zinc-50 dark:bg-zinc-950/20",
} as const;

const priorityBadgeColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  normal: "bg-blue-500 text-white",
  low: "bg-zinc-500 text-white",
} as const;

const equipmentIcons = {
  dry_van: Package,
  reefer: Snowflake,
  flatbed: Truck,
  tanker: Drop,
  step_deck: Stack,
  double_drop: CaretDown,
  conestoga: Buildings,
} as const;

export function LoadQueue({
  orders,
  selectedOrderIds = [],
  onOrderSelect,
  onOrderToggleSelect,
  onBulkAction,
  className
}: LoadQueueProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"priority" | "created" | "revenue">("priority");

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      type: "load",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer.name,
      commodity: order.commodity,
      equipmentType: order.equipmentType,
      weight: order.weight,
      revenue: order.totalRevenue,
      miles: order.miles,
      priorityLevel: order.priorityLevel,
      stops: order.stops,
    }));
    e.dataTransfer.effectAllowed = "move";
  };

  const toggleExpanded = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatRevenue = (revenue: string | number) => {
    const num = typeof revenue === "string" ? parseFloat(revenue) : revenue;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatWeight = (weight: string | number) => {
    const num = typeof weight === "string" ? parseFloat(weight) : weight;
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeUntilPickup = (order: Order) => {
    const pickupStop = order.stops.find(stop => stop.type === "pickup");
    if (!pickupStop) return null;

    const pickupDate = new Date(pickupStop.scheduledDate);
    const now = new Date();
    const hoursUntil = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 0) return "OVERDUE";
    if (hoursUntil < 24) return `${Math.round(hoursUntil)}h`;
    return `${Math.round(hoursUntil / 24)}d`;
  };

  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priorityLevel as keyof typeof priorityOrder] -
               priorityOrder[a.priorityLevel as keyof typeof priorityOrder];
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "revenue":
        return parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue);
      default:
        return 0;
    }
  });

  const bulkActions = [
    { label: "Pre-assign", value: "pre_assign" },
    { label: "Hold", value: "hold" },
    { label: "Cancel", value: "cancel" },
    { label: "Export", value: "export" },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Unassigned Loads ({orders.length})
          </h3>
          {selectedOrderIds.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedOrderIds.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                  <CaretDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkActions.map(action => (
                  <DropdownMenuItem
                    key={action.value}
                    onClick={() => onBulkAction?.(action.value, selectedOrderIds)}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort by {sortBy}
                <CaretDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("priority")}>
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("created")}>
                Created Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("revenue")}>
                Revenue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Load cards */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        <AnimatePresence>
          {sortedOrders.map((order, index) => {
            const isSelected = selectedOrderIds.includes(order.id);
            const isExpanded = expandedOrders.has(order.id);
            const priorityColorClass = priorityColors[order.priorityLevel as keyof typeof priorityColors] || priorityColors.normal;
            const priorityBadgeClass = priorityBadgeColors[order.priorityLevel as keyof typeof priorityBadgeColors] || priorityBadgeColors.normal;
            const timeUntilPickup = getTimeUntilPickup(order);
            const EquipmentIcon = equipmentIcons[order.equipmentType as keyof typeof equipmentIcons] || Truck;

            const pickupStop = order.stops.find(stop => stop.type === "pickup");
            const deliveryStop = order.stops.find(stop => stop.type === "delivery");

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{
                  opacity: 0,
                  y: -20,
                  scale: 0.95,
                  rotateX: 15,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.6
                  }
                }}
                transition={{
                  delay: index * 0.02,
                  type: "spring",
                  stiffness: 450,
                  damping: 28,
                  mass: 0.7,
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.8,
                  }
                }}
              >
                <motion.div
                  layout
                  className={cn(
                    "rounded-lg border-l-4 cursor-pointer group relative overflow-hidden",
                    priorityColorClass,
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  draggable
                  onDragStartCapture={(e) => {
                    handleDragStart(e, order);
                    // Add drag preview styling
                    if (e.target instanceof HTMLElement) {
                      e.target.style.opacity = '0.8';
                      requestAnimationFrame(() => {
                        (e.target as HTMLElement).style.opacity = '';
                      });
                    }
                  }}
                  whileHover={{
                    scale: 1.02,
                    y: -3,
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      mass: 0.6
                    }
                  }}
                  whileDrag={{
                    scale: 1.06,
                    rotate: [0, 1, -1, 2, -2, 1, 0],
                    zIndex: 100,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "12px",
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      mass: 0.5,
                      backgroundColor: {
                        duration: 0.2
                      }
                    }
                  }}
                  dragMomentum={false}
                  dragElastic={0.1}
                  dragTransition={{
                    bounceStiffness: 300,
                    bounceDamping: 30
                  }}
                >
                  {/* Drag hint overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 pointer-events-none"
                    whileHover={{
                      opacity: 0.4,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      }
                    }}
                    whileDrag={{
                      opacity: 0.8,
                      background: "linear-gradient(90deg, rgba(59,130,246,0.1), rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 25
                      }
                    }}
                  />

                  {/* Priority level indicator pulse */}
                  {order.priorityLevel === "urgent" && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"
                      animate={{
                        opacity: [0.6, 1, 0.6],
                        boxShadow: [
                          "0 0 0 0 rgba(239, 68, 68, 0.4)",
                          "0 0 8px 2px rgba(239, 68, 68, 0.6)",
                          "0 0 0 0 rgba(239, 68, 68, 0.4)"
                        ]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                {/* Main card content */}
                <div
                  className="p-4"
                  onClick={() => onOrderSelect?.(order.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left side - Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onOrderToggleSelect?.(order.id);
                          }}
                          className="h-4 w-4 rounded border-border"
                        />

                        <span className="text-sm font-mono font-medium text-foreground">
                          {order.orderNumber}
                        </span>

                        <Badge className={cn("text-xs h-5", priorityBadgeClass)}>
                          {order.priorityLevel}
                        </Badge>

                        {timeUntilPickup && (
                          <Badge variant={timeUntilPickup === "OVERDUE" ? "destructive" : "secondary"} className="text-xs h-5">
                            <Clock className="mr-1 h-3 w-3" />
                            {timeUntilPickup}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground truncate">
                          {order.customer.name}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <EquipmentIcon className="size-4 text-muted-foreground" weight="duotone" />
                          <span className="capitalize">{order.equipmentType.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{order.commodity}</span>
                        </div>

                        {/* Route info */}
                        {pickupStop && deliveryStop && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{pickupStop.city}, {pickupStop.state}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{deliveryStop.city}, {deliveryStop.state}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{formatWeight(order.weight)} lbs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{order.miles} mi</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CurrencyDollar className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono font-medium">{formatRevenue(order.totalRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DotsThree className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Pre-assign</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Split Load</DropdownMenuItem>
                          <DropdownMenuItem>Hold</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(order.id);
                        }}
                      >
                        {isExpanded ? (
                          <CaretDown className="h-4 w-4" />
                        ) : (
                          <CaretRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-2 flex items-start gap-2 text-xs">
                      <Warning className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="border-t border-border/50 px-4 pb-4 overflow-hidden"
                    >
                      <div className="pt-3 space-y-3">
                        {/* Detailed stops */}
                        <div>
                          <h5 className="text-xs font-medium text-foreground mb-2">Stops</h5>
                          <div className="space-y-2">
                            {order.stops
                              .sort((a, b) => a.sequence - b.sequence)
                              .map((stop) => (
                                <div key={stop.id} className="flex items-start gap-3 text-xs">
                                  <div className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-white",
                                    stop.type === "pickup" ? "bg-apollo-cyan-500" : "bg-blue-500"
                                  )}>
                                    {stop.sequence}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium capitalize">{stop.type}</div>
                                    <div className="text-muted-foreground">{stop.address}</div>
                                    <div className="text-muted-foreground">{stop.city}, {stop.state}</div>
                                    <div className="text-muted-foreground">
                                      <Calendar className="inline h-3 w-3 mr-1" />
                                      {formatDate(stop.scheduledDate)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Additional details */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Customer Ref:</span>
                            <span className="ml-1 font-mono">{order.customerReferenceNumber || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pieces:</span>
                            <span className="ml-1 font-mono">{order.pieces}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2 text-sm">No unassigned loads</p>
            <p className="text-xs">All loads are currently assigned to drivers</p>
          </div>
        )}
      </div>
    </div>
  );
}
