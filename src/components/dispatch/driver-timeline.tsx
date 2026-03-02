"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  User,
  Truck,
  Phone,
  CaretRight,
  Timer,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Stop {
  id: number;
  type: string;
  city: string;
  state: string;
  scheduledDate: string;
  sequence: number;
}

interface Order {
  id: number;
  orderNumber: string;
  commodity: string;
  weight: string;
  priorityLevel: string;
  status: string;
  totalRevenue: string;
  miles: string;
}

interface Customer {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  assignment: {
    id: number;
    assignedAt: string;
    dispatchedAt?: string;
  };
  order: Order;
  customer: Customer;
  stops: Stop[];
}

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  employeeId?: string;
  status: string;
  phone?: string;
  email?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  safetyScore?: string;
  currentAssignments: Assignment[];
  currentTractor?: {
    id: number;
    unitNumber: string;
    make: string;
    model: string;
  };
  currentTrailer?: {
    id: number;
    unitNumber: string;
    trailerType: string;
  };
}

interface DriverTimelineProps {
  drivers: Driver[];
  onDriverClick?: (driverId: number) => void;
  onOrderClick?: (orderId: number) => void;
  onDropLoad?: (driverId: number, loadData: { orderId: number }) => void;
  className?: string;
}

const statusColors = {
  available: "bg-apollo-cyan-500",
  on_load: "bg-blue-500",
  off_duty: "bg-zinc-400",
  sleeper: "bg-sky-500",
  driving: "bg-orange-500",
  on_break: "bg-yellow-500",
} as const;

const statusLabels = {
  available: "Available",
  on_load: "On Load",
  off_duty: "Off Duty",
  sleeper: "Sleeper",
  driving: "Driving",
  on_break: "On Break",
} as const;

const priorityColors = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-zinc-500",
} as const;

const loadStatusColors = {
  assigned: "bg-blue-500",
  dispatched: "bg-sky-500",
  in_transit: "bg-orange-500",
  delivered: "bg-apollo-cyan-500",
  completed: "bg-zinc-500",
} as const;

const timelineDays = ["Today", "Tomorrow", "+2 Days", "+3 Days", "+4 Days", "+5 Days", "+6 Days"];

function HosGauge({ driver }: { driver: Driver }) {
  // Simulated HOS data based on driver status
  const hosData = (() => {
    const seed = driver.id * 7;
    const status = driver.status;
    if (status === "off_duty" || status === "sleeper") {
      return { driveRemaining: 11, dutyRemaining: 14, label: "Reset" };
    }
    if (status === "driving" || status === "on_load") {
      const drive = 2 + (seed % 7);
      const duty = drive + 1 + (seed % 3);
      return { driveRemaining: drive, dutyRemaining: Math.min(duty, 14), label: `${drive}h drive` };
    }
    // available / on_break
    const drive = 6 + (seed % 5);
    const duty = drive + 2;
    return { driveRemaining: drive, dutyRemaining: Math.min(duty, 14), label: `${drive}h drive` };
  })();

  const drivePct = (hosData.driveRemaining / 11) * 100;
  const barColor =
    drivePct > 50
      ? "bg-apollo-cyan-500"
      : drivePct > 25
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Timer className="h-3 w-3 text-muted-foreground" />
          <div className="h-1.5 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${drivePct}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground w-12 text-right">
            {hosData.label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <div>Drive: <span className="font-mono">{hosData.driveRemaining}h</span> / 11h remaining</div>
          <div>Duty: <span className="font-mono">{hosData.dutyRemaining}h</span> / 14h remaining</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function DriverTimeline({
  drivers,
  onDriverClick,
  onOrderClick,
  onDropLoad,
  className,
}: DriverTimelineProps) {
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent, driverId: number) => {
    e.preventDefault();
    setDraggedOver(driverId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, driverId: number) => {
    e.preventDefault();
    setDraggedOver(null);

    try {
      const loadData = JSON.parse(e.dataTransfer.getData("text/plain")) as { orderId: number };
      if (onDropLoad && loadData) {
        onDropLoad(driverId, loadData);
      }
    } catch (error) {
      console.error("Error parsing dropped data:", error);
    }
  };

  const getDriverStatusInfo = (driver: Driver) => {
    const status = driver.status as keyof typeof statusColors;
    return {
      color: statusColors[status] || statusColors.available,
      label: statusLabels[status] || "Unknown",
    };
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

  const COL_COUNT = timelineDays.length; // 7 columns
  const COL_WIDTH_PCT = 100 / COL_COUNT; // ~14.28%

  /** Map an assignment to its day-column index (0=Today … 6=+6 Days) */
  const getTimelineColumnIndex = (assignment: Assignment): number => {
    const assignedDate = new Date(assignment.assignment.assignedAt);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((assignedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(COL_COUNT - 1, daysDiff));
  };

  /** Left-edge percentage for a load based on its start column */
  const getTimelinePosition = (assignment: Assignment): number =>
    getTimelineColumnIndex(assignment) * COL_WIDTH_PCT;

  /** Load spans 1-3 columns based on mock transit duration (determined by order status) */
  const getLoadDuration = (assignment: Assignment): number => {
    const status = assignment.order?.status ?? assignment.assignment.status;
    // Simulate realistic transit durations: in_transit=2 days, delivered=3 days, others=1 day
    if (status === "in_transit" || status === "dispatched") return COL_WIDTH_PCT * 2;
    if (status === "delivered" || status === "completed") return COL_WIDTH_PCT * 3;
    return COL_WIDTH_PCT * 1.5;
  };

  /** Lay loads out sequentially on x-axis — no overlaps per driver */
  const computeAssignmentRows = (driverAssignments: Assignment[]) => {
    if (driverAssignments.length === 0) return { rows: new Map<number, number>(), maxRow: 0, offsets: new Map<number, number>() };

    // Sort by column index (earliest first)
    const sorted = [...driverAssignments].sort(
      (a, b) => getTimelineColumnIndex(a) - getTimelineColumnIndex(b),
    );

    const rows = new Map<number, number>();
    const offsets = new Map<number, number>(); // x-offset overrides to prevent overlap

    // Track the rightmost edge (in % of timeline) used so far
    let rightEdge = 0;

    for (const assignment of sorted) {
      const naturalLeft = getTimelinePosition(assignment);
      const duration = getLoadDuration(assignment);

      // If this load's natural start overlaps the previous load's end, push it right
      const actualLeft = Math.max(naturalLeft, rightEdge + 0.5); // 0.5% gap between loads
      offsets.set(assignment.assignment.id, actualLeft);
      rightEdge = actualLeft + duration;

      // All loads on row 0 — no vertical stacking needed since they don't overlap
      rows.set(assignment.assignment.id, 0);
    }

    return { rows, maxRow: 0, offsets };
  };

  const isOrderCardTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && Boolean(target.closest("[data-order-card='true']"));

  return (
    <div className={cn("space-y-2", className)} ref={timelineRef}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        }}
        className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pb-2 shadow-sm"
      >
        {/* Timeline header with time slots */}
        <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: 0.1,
            }}
            className="text-sm font-semibold text-muted-foreground"
          >
            Driver
          </motion.div>
          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
            {timelineDays.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  delay: 0.15 + index * 0.03,
                }}
                className={cn(
                  "text-center py-1 font-mono font-medium rounded px-1",
                  index === 0 && "text-primary bg-primary/10"
                )}
              >
                {day}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {drivers.map((driver, index) => {
          const statusInfo = getDriverStatusInfo(driver);
          const isAvailable = driver.status === "available";
          const isDraggedOver = draggedOver === driver.id;
          const { rows: assignmentRows, maxRow, offsets: assignmentOffsets } = computeAssignmentRows(driver.currentAssignments);
          // Base height 64px (h-16) + 40px per extra row; single row stays at 74px for visual comfort
          const laneHeight = maxRow > 0 ? 64 + (maxRow + 1) * 40 : 74;

          return (
            <motion.div
              key={driver.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                delay: index * 0.02,
                type: "spring",
                stiffness: 500,
                damping: 35,
                mass: 0.6,
                layout: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8,
                }
              }}
              className={cn(
                "grid grid-cols-[220px_minmax(0,1fr)] gap-4 p-3 rounded-xl border transition-all duration-300 hover:shadow-lg",
                isAvailable && "border-apollo-cyan-200 bg-apollo-cyan-50/50 dark:border-apollo-cyan-800 dark:bg-apollo-cyan-950/20",
                isDraggedOver && "border-primary bg-primary/8 shadow-xl ring-2 ring-primary/20",
                !isAvailable && "border-border bg-card hover:bg-accent/8",
                onDriverClick && "cursor-pointer"
              )}
              whileHover={{
                y: -2,
                scale: 1.01,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                  mass: 0.5
                }
              }}
              onClickCapture={(event) => {
                if (!onDriverClick) return;
                if (isOrderCardTarget(event.target)) return;
                onDriverClick(driver.id);
              }}
              role={onDriverClick ? "button" : undefined}
              tabIndex={onDriverClick ? 0 : undefined}
              onKeyDown={(event) => {
                if (!onDriverClick) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onDriverClick(driver.id);
                }
              }}
              onDragOver={(e) => handleDragOver(e, driver.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, driver.id)}
            >
              {/* Driver Info Column */}
              <div className="space-y-2">
                <div
                  className="flex items-center gap-3 group"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 bg-muted">
                      <div className="flex h-full w-full items-center justify-center text-xs font-mono font-medium">
                        {driver.firstName[0]}{driver.lastName[0]}
                      </div>
                    </Avatar>
                    {/* Status indicator */}
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background", statusInfo.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {driver.firstName} {driver.lastName}
                      </span>
                      <CaretRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-mono">{driver.employeeId || `DRV-${driver.id.toString().padStart(4, "0")}`}</span>
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Equipment info */}
                {(driver.currentTractor || driver.currentTrailer) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-3 w-3" />
                    <span className="font-mono">
                      {driver.currentTractor?.unitNumber}
                      {driver.currentTrailer && ` / ${driver.currentTrailer.unitNumber}`}
                    </span>
                  </div>
                )}

                {/* HOS Gauge */}
                <HosGauge driver={driver} />

                {/* Quick stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {driver.safetyScore && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{parseFloat(driver.safetyScore).toFixed(0)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Safety Score</TooltipContent>
                    </Tooltip>
                  )}
                  {driver.phone && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Phone className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>{driver.phone}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Timeline Column */}
              <div
                className="relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-b from-zinc-50 to-zinc-100/80 dark:from-zinc-900/60 dark:to-zinc-900/30"
                style={{ height: `${laneHeight}px` }}
              >
                <div className="pointer-events-none absolute inset-y-2 left-0 right-0 grid grid-cols-7">
                  {timelineDays.map((day, dayIndex) => (
                    <div
                      key={`${driver.id}-${day}`}
                      className={cn("relative", dayIndex > 0 && "border-l border-border/40")}
                    />
                  ))}
                </div>
                <div className="pointer-events-none absolute left-2 right-2 top-[50%] -translate-y-1/2 border-t border-dashed border-border/50" />

                {/* Drop zone indicator */}
                {isDraggedOver && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 25,
                      mass: 0.4,
                    }}
                    className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-primary bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10"
                  >
                    {/* Animated background pulse */}
                    <motion.div
                      className="absolute inset-0 bg-primary/5"
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                      }}
                    />

                    <motion.span
                      className="text-xs font-semibold text-primary relative z-10 px-2 py-1 bg-background/80 rounded-full border border-primary/30"
                      initial={{ scale: 0.9 }}
                      animate={{
                        scale: [0.95, 1.05, 0.95],
                        y: [0, -1, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                      }}
                    >
                      Drop load here
                    </motion.span>
                  </motion.div>
                )}

                {/* Current assignments */}
                {driver.currentAssignments.map((assignment) => {
                  const leftPosition = assignmentOffsets?.get(assignment.assignment.id) ?? getTimelinePosition(assignment);
                  const width = getLoadDuration(assignment);
                  const priorityColor = priorityColors[assignment.order.priorityLevel as keyof typeof priorityColors] || priorityColors.normal;
                  const statusColor = loadStatusColors[assignment.order.status as keyof typeof loadStatusColors] || loadStatusColors.assigned;
                  const row = assignmentRows.get(assignment.assignment.id) ?? 0;
                  const topPx = 4 + row * 40; // 4px gap from top, 40px per row

                  return (
                    <Tooltip key={assignment.assignment.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.7, x: -15, y: 5 }}
                          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: 10, y: -5 }}
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 28,
                            mass: 0.5,
                            delay: 0.1 + (assignment.assignment.id % 3) * 0.05,
                            layout: {
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                              mass: 0.8,
                            }
                          }}
                        className={cn(
                          "absolute z-10 h-8 cursor-pointer overflow-hidden rounded-md border border-white/30 shadow-md",
                          statusColor
                        )}
                        data-order-card="true"
                        style={{
                          left: `${leftPosition}%`,
                          width: `${width}%`,
                          minWidth: "90px",
                          top: `${topPx}px`,
                          }}
                          whileHover={{
                            scale: 1.04,
                            y: -2,
                            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                            zIndex: 10,
                            transition: {
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                              mass: 0.3
                            }
                          }}
                          whileTap={{
                            scale: 0.97,
                            transition: {
                              type: "spring",
                              stiffness: 600,
                              damping: 25,
                              mass: 0.2
                            }
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onOrderClick?.(assignment.order.id);
                          }}
                        >
                          {/* Priority indicator */}
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-md", priorityColor)} />

                          <div className="flex h-full items-center justify-between gap-2 px-2 text-white">
                            <span className="truncate text-[11px] font-mono font-semibold">
                              {assignment.order.orderNumber}
                            </span>
                            <span className="hidden text-[10px] font-mono sm:inline">
                              {formatRevenue(assignment.order.totalRevenue)}
                            </span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/20" />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="space-y-1">
                          <div className="font-medium">{assignment.order.orderNumber}</div>
                          <div className="text-sm">{assignment.customer.name}</div>
                          <div className="text-sm">{assignment.order.commodity}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span>{formatWeight(assignment.order.weight)} lbs</span>
                            <span>•</span>
                            <span>{assignment.order.miles} mi</span>
                            <span>•</span>
                            <span>{formatRevenue(assignment.order.totalRevenue)}</span>
                          </div>
                          {assignment.stops.length > 0 && (
                            <div className="text-xs border-t pt-1 mt-1">
                              {assignment.stops.map((stop, idx) => (
                                <div key={stop.id} className="flex items-center gap-1">
                                  <span>{idx + 1}.</span>
                                  <span className="capitalize">{stop.type}</span>
                                  <span>at {stop.city}, {stop.state}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Available indicator */}
                {isAvailable && driver.currentAssignments.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-apollo-cyan-700 shadow-sm dark:text-apollo-cyan-300">
                      Available for assignment
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {drivers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="mx-auto h-12 w-12 opacity-50" />
          <p className="mt-2 text-sm">No drivers found</p>
        </div>
      )}
    </div>
  );
}
