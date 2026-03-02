"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Package,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Star,
  ArrowLeft,
  CloudSun,
  CloudRain,
  Sun,
  FileText,
  TrendUp,
  CaretDown,
} from "@phosphor-icons/react";
import { mockCustomers, mockOrders } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: number;
  name: string;
  code: string;
  contactName: string;
  address: { city: string; state: string };
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  commodity: string;
  equipmentType: string;
  status: string;
  totalRate: number;
  totalMiles: number;
  pickupEarliest: string;
  deliveryLatest: string;
  actualDeliveryTime?: string;
  estimatedArrival?: string;
}

// ─── Timeline stages ──────────────────────────────────────────────────────────

const STAGES = [
  { key: "ordered",   label: "Ordered",       icon: FileText },
  { key: "pickup",    label: "Picked Up",     icon: Package },
  { key: "transit",   label: "In Transit",    icon: Truck },
  { key: "delivered", label: "Delivered",     icon: CheckCircle },
];

function getStageIndex(status: string): number {
  switch (status) {
    case "pending":    return 0;
    case "assigned":   return 0;
    case "dispatched": return 1;
    case "in_transit": return 2;
    case "delivered":  return 3;
    case "completed":  return 3;
    default:           return 0;
  }
}

// ─── Weather mockup ───────────────────────────────────────────────────────────

const WEATHER_OPTIONS = [
  { icon: Sun,      label: "Clear, 72°F",   cls: "text-yellow-500" },
  { icon: CloudSun, label: "Partly Cloudy, 65°F", cls: "text-zinc-400" },
  { icon: CloudRain, label: "Light Rain, 58°F", cls: "text-blue-400" },
];

// ─── ETA Countdown ────────────────────────────────────────────────────────────

function EtaCountdown({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function compute() {
      const target = new Date(targetDate);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setRemaining("Arrived"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    }
    compute();
    const id = setInterval(compute, 60000);
    return () => clearInterval(id);
  }, [targetDate]);

  return <span className="font-mono font-bold text-foreground">{remaining}</span>;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ orderId: _orderId }: { orderId: number }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (v: number) => {
    setSelected(v);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 text-sm"
      >
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("h-5 w-5", i < selected ? "text-yellow-500" : "text-muted")}
              weight={i < selected ? "fill" : "regular"}
            />
          ))}
        </div>
        <span className="text-apollo-cyan-600 font-medium">Thank you for your feedback!</span>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-muted-foreground mr-1">Rate this delivery:</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => handleSelect(i + 1)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              (hovered || selected) > i ? "text-yellow-500" : "text-muted-foreground/30"
            )}
            weight={(hovered || selected) > i ? "fill" : "regular"}
          />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Order tracking detail ────────────────────────────────────────────────────

function OrderDetail({ order, customer: _customer, onBack }: { order: Order; customer: Customer; onBack: () => void }) {
  const stageIdx = getStageIndex(order.status);
  const weather = WEATHER_OPTIONS[order.id % 3];
  const WeatherIcon = weather.icon;
  const etaDate = order.estimatedArrival ?? order.deliveryLatest;
  const isDelivered = stageIdx === 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="space-y-5"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shipments
      </button>

      {/* Order header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-foreground">{order.orderNumber}</span>
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                isDelivered
                  ? "bg-apollo-cyan-500/15 text-apollo-cyan-600 border-apollo-cyan-500/20"
                  : "bg-blue-500/15 text-blue-600 border-blue-500/20"
              )}>
                {order.status.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.commodity} · {String(order.equipmentType).replace("_", " ")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-foreground">
              ${order.totalRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">{order.totalMiles.toLocaleString()} mi</p>
          </div>
        </div>

        {/* ETA */}
        {!isDelivered && (
          <div className="mt-4 rounded-xl bg-muted/40 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Estimated arrival
            </div>
            <EtaCountdown targetDate={etaDate} />
          </div>
        )}
        {isDelivered && order.actualDeliveryTime && (
          <div className="mt-4 rounded-xl bg-apollo-cyan-500/10 border border-apollo-cyan-500/20 px-4 py-3 flex items-center gap-2 text-sm text-apollo-cyan-600">
            <CheckCircle className="h-4 w-4" weight="fill" />
            Delivered {new Date(order.actualDeliveryTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {/* Tracking timeline */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-5">Shipment Timeline</h3>
        <div className="relative">
          {/* connector line */}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
          <div
            className="absolute left-5 top-5 w-px bg-apollo-cyan-500 transition-all duration-700"
            style={{ height: `${(stageIdx / (STAGES.length - 1)) * 100}%` }}
          />

          <div className="space-y-6">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const done = i <= stageIdx;
              const active = i === stageIdx;
              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 30 }}
                  className="flex items-center gap-4 relative"
                >
                  <div className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    done
                      ? "bg-apollo-cyan-500 border-apollo-cyan-500 text-white"
                      : "bg-card border-border text-muted-foreground"
                  )}>
                    {active && !isDelivered ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ type: "tween", duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-apollo-cyan-500/30"
                      />
                    ) : null}
                    <Icon className="h-4 w-4 relative z-10" weight={done ? "fill" : "regular"} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i === 0 && new Date(order.pickupEarliest).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {i === 1 && (i <= stageIdx ? "Picked up on time" : "Estimated: " + new Date(order.pickupEarliest).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}
                      {i === 2 && (i <= stageIdx ? `${order.totalMiles} mi en route` : "Pending pickup")}
                      {i === 3 && (isDelivered ? "Completed" : "Expected: " + new Date(order.deliveryLatest).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}
                    </p>
                  </div>
                  {active && !isDelivered && (
                    <span className="ml-auto text-xs font-medium text-apollo-cyan-600 rounded-full bg-apollo-cyan-500/10 border border-apollo-cyan-500/20 px-2 py-0.5">
                      Active
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Route summary + weather */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            Route Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Distance</span>
              <span className="font-mono font-medium text-foreground">{order.totalMiles.toLocaleString()} mi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pickup Window</span>
              <span className="font-medium text-foreground text-xs">
                {new Date(order.pickupEarliest).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery Window</span>
              <span className="font-medium text-foreground text-xs">
                {new Date(order.deliveryLatest).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <CloudSun className="h-4 w-4 text-yellow-500" />
            Route Weather
          </h3>
          <div className="flex items-center gap-3">
            <WeatherIcon className={cn("h-8 w-8", weather.cls)} weight="duotone" />
            <div>
              <p className="font-medium text-foreground text-sm">{weather.label}</p>
              <p className="text-xs text-muted-foreground">Along route — no weather delays</p>
            </div>
          </div>
        </div>
      </div>

      {/* POD placeholder */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-primary" />
          Proof of Delivery
        </h3>
        {isDelivered ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <CheckCircle className="h-5 w-5 text-apollo-cyan-600" weight="fill" />
            <div>
              <p className="font-medium text-foreground">POD Available</p>
              <p className="text-xs text-muted-foreground">Signed and uploaded · Click to view</p>
            </div>
            <button className="ml-auto text-xs font-medium text-primary hover:underline">View PDF</button>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground italic">
            POD will be available upon delivery
          </div>
        )}
      </div>

      {/* Rating */}
      {isDelivered && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Rate Your Experience</h3>
          <StarRating orderId={order.id} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Customer dashboard stats ─────────────────────────────────────────────────

function CustomerStats({ customerId }: { customerId: number }) {
  const customerOrders = mockOrders.filter((o) => o.customerId === customerId);
  const total = customerOrders.length;
  const delivered = customerOrders.filter((o) => o.status === "delivered" || o.status === "completed").length;
  const onTimePct = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const avgMiles = total > 0 ? Math.round(customerOrders.reduce((s, o) => s + o.totalMiles, 0) / total) : 0;
  const satisfaction = 4.2 + ((customerId % 7) / 10);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Total Shipments", value: String(total), icon: Package, suffix: "" },
        { label: "On-Time %", value: String(onTimePct), icon: CheckCircle, suffix: "%" },
        { label: "Avg Distance", value: avgMiles.toLocaleString(), icon: TrendUp, suffix: " mi" },
        { label: "Satisfaction", value: satisfaction.toFixed(1), icon: Star, suffix: " / 5" },
      ].map(({ label, value, icon: Icon, suffix }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, type: "spring", stiffness: 350, damping: 28 }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-mono text-xl font-bold text-foreground">
            {value}<span className="text-sm font-normal text-muted-foreground">{suffix}</span>
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortalPreviewPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(mockCustomers[0]?.id ?? 1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const customer = mockCustomers.find((c) => c.id === selectedCustomerId) as Customer | undefined;
  const customerOrders = mockOrders.filter((o) => o.customerId === selectedCustomerId) as Order[];

  const statusColor: Record<string, string> = {
    pending:    "bg-zinc-400/15 text-zinc-500 border-zinc-400/20",
    assigned:   "bg-blue-500/15 text-blue-600 border-blue-500/20",
    dispatched: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
    in_transit: "bg-blue-600/15 text-blue-700 border-blue-600/20",
    delivered:  "bg-apollo-cyan-500/15 text-apollo-cyan-600 border-apollo-cyan-500/20",
    completed:  "bg-apollo-cyan-500/15 text-apollo-cyan-600 border-apollo-cyan-500/20",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Customer Portal Preview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview what your customer sees in their tracking portal
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
          <Monitor className="h-3.5 w-3.5" />
          Preview Mode
        </div>
      </div>

      {/* ── Customer selector ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-muted-foreground">Viewing portal for:</label>
        <div className="relative">
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              setSelectedCustomerId(Number(e.target.value));
              setSelectedOrder(null);
            }}
            className="appearance-none rounded-xl border border-border bg-card py-2 pl-3 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm cursor-pointer"
          >
            {mockCustomers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* ── Customer portal frame ── */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-md">
        {/* Portal branded header */}
        <div className="bg-zinc-900 px-6 py-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-apollo-cyan-500 text-white text-xs font-bold font-mono">
            {customer?.code?.slice(0, 2) ?? "XX"}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{customer?.name}</p>
            <p className="text-xs text-zinc-400">Freight Tracking Portal · Powered by Apollo TMS</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-apollo-cyan-500 animate-pulse" />
            Live
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6">
          {/* Customer stats dashboard */}
          <CustomerStats customerId={selectedCustomerId} />

          {/* Content: shipment list or order detail */}
          <AnimatePresence mode="wait">
            {!selectedOrder ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Your Shipments</h2>
                  <span className="font-mono text-xs text-muted-foreground">{customerOrders.length} total</span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    No shipments found for this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order, i) => (
                      <motion.button
                        key={order.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 30 }}
                        onClick={() => setSelectedOrder(order)}
                        className="w-full text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-foreground text-sm">{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{order.commodity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium",
                              statusColor[order.status] ?? "bg-zinc-400/15 text-zinc-500 border-zinc-400/20"
                            )}>
                              {order.status.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                            </span>
                            <div className="text-right hidden sm:block">
                              <p className="font-mono text-sm font-semibold text-foreground">
                                ${order.totalRate.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                              </p>
                              <p className="text-xs text-muted-foreground">{order.totalMiles.toLocaleString()} mi</p>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {/* Progress bar for in-transit */}
                        {order.status === "in_transit" && (
                          <div className="mt-3">
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: "30%" }}
                                animate={{ width: "62%" }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.1 }}
                                className="h-full rounded-full bg-blue-500"
                              />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">62% of route complete</p>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OrderDetail
                  order={selectedOrder}
                  customer={customer as Customer}
                  onBack={() => setSelectedOrder(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
