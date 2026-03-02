"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  CheckCircle,
  X,
  Eye,
  Calendar,
  User,
  Truck,
  ClockCounterClockwise,
  CreditCard,
  Plus,
  Trash,
  CheckSquare,
  Square,
  Percent,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { SimpleModal as Modal } from "@/components/ui/modal";
import { Separator } from "@/components/ui/separator";
import { Sheet } from "@/components/ui/sheet";
import { useDrivers } from "@/lib/hooks/api/use-drivers";
import { useOrders } from "@/lib/hooks/api/use-orders";
import { useCreateSettlement } from "@/lib/hooks/api/use-billing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DriverWithDetails, OrderWithDetails } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type PayStructure = {
  type: "percentage" | "per_mile" | "flat";
  rate: number;
};

interface Deduction {
  id: string;
  label: string;
  type: "percentage" | "flat";
  value: number; // percent (0-100) or dollar amount
  enabled: boolean;
  isCustom: boolean;
}

interface DriverSettlement {
  driverId: number;
  driverName: string;
  employeeId?: string;
  totalLoads: number;
  totalMiles: number;
  grossPay: number;
  deductions: number;
  deductionBreakdown: Array<{ label: string; amount: number }>;
  netPay: number;
  loads: LoadForSettlement[];
  payStructure: PayStructure;
  status: "pending" | "approved" | "rejected";
  driver: DriverWithDetails;
}

interface LoadForSettlement {
  id: number;
  orderNumber: string;
  deliveredAt: string;
  origin: string;
  destination: string;
  miles: number;
  revenue: number;
  driverPay: number;
  commodity?: string;
}

interface SettlementRunInterfaceProps {
  className?: string;
}

// ─── Default Deductions ───────────────────────────────────────────────────────

const DEFAULT_DEDUCTIONS: Deduction[] = [
  { id: "fed_tax",    label: "Federal Tax Withholding",    type: "percentage", value: 22,   enabled: true,  isCustom: false },
  { id: "fica",       label: "FICA (Social Security)",     type: "percentage", value: 6.2,  enabled: true,  isCustom: false },
  { id: "medicare",   label: "Medicare",                   type: "percentage", value: 1.45, enabled: true,  isCustom: false },
  { id: "state_tax",  label: "State Tax Withholding",      type: "percentage", value: 4.5,  enabled: false, isCustom: false },
  { id: "health_ins", label: "Health Insurance",           type: "flat",       value: 250,  enabled: false, isCustom: false },
  { id: "retirement", label: "401(k) Contribution",        type: "percentage", value: 3,    enabled: false, isCustom: false },
  { id: "occ_acc",    label: "Occupational Accident Ins.", type: "flat",       value: 75,   enabled: false, isCustom: false },
  { id: "eld_lease",  label: "ELD Device Lease",           type: "flat",       value: 35,   enabled: false, isCustom: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (value === null || value === undefined) return 0;
  return parseFloat(String(value)) || 0;
};

const computeDeductions = (grossPay: number, deductions: Deduction[]) => {
  const breakdown: Array<{ label: string; amount: number }> = [];
  let total = 0;
  for (const d of deductions) {
    if (!d.enabled) continue;
    const amount = d.type === "percentage" ? grossPay * (d.value / 100) : d.value;
    breakdown.push({ label: d.label, amount: +amount.toFixed(2) });
    total += amount;
  }
  return { total: +total.toFixed(2), breakdown };
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SettlementRunInterface({ className }: SettlementRunInterfaceProps) {
  const uid = useId();

  // Period & driver state
  const [periodStart, setPeriodStart] = useState("2026-01-01");
  const [periodEnd, setPeriodEnd] = useState("2026-01-31");
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [driverSettlements, setDriverSettlements] = useState<DriverSettlement[]>([]);
  const [previewDriverId, setPreviewDriverId] = useState<number | null>(null);
  const [showBulkProcessModal, setShowBulkProcessModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Deduction state
  const [deductions, setDeductions] = useState<Deduction[]>(DEFAULT_DEDUCTIONS);
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"percentage" | "flat">("flat");
  const [newValue, setNewValue] = useState("");

  const { toast } = useToast();
  const {
    data: drivers,
    isLoading: driversLoading,
    error: driversError,
  } = useDrivers({ available: true });
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    status: ["delivered"],
    pageSize: 1000,
    include: ["assignments", "stops", "charges"],
  });
  const createSettlementMutation = useCreateSettlement();

  // ── Formatters ──────────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

  // ── Pay structure ───────────────────────────────────────────────────────────

  const resolvePayStructure = (value: unknown): PayStructure => {
    if (typeof value === "object" && value !== null) {
      const c = value as Partial<PayStructure>;
      const rate = typeof c.rate === "number" ? c.rate : 0.25;
      const type =
        c.type === "percentage" || c.type === "per_mile" || c.type === "flat"
          ? c.type
          : "percentage";
      return { type, rate };
    }
    return { type: "percentage", rate: 0.25 };
  };

  const calculateDriverPay = (order: OrderWithDetails, payStructure: PayStructure) => {
    const payEligible = (order.charges || []).filter((ch) => Boolean(ch.payToDriver));
    if (payEligible.length > 0) {
      return payEligible.reduce((sum, ch) => sum + toNumber(ch.amount), 0);
    }
    const revenue = toNumber(order.totalRevenue);
    const miles = toNumber(order.miles ?? order.totalMiles);
    switch (payStructure.type) {
      case "percentage": return revenue * (payStructure.rate || 0.25);
      case "per_mile":   return miles * (payStructure.rate || 0.5);
      case "flat":       return payStructure.rate || 500;
      default:           return revenue * 0.25;
    }
  };

  // ── Deduction management ────────────────────────────────────────────────────

  const toggleDeduction = (id: string) =>
    setDeductions((prev) => prev.map((d) => d.id === id ? { ...d, enabled: !d.enabled } : d));

  const updateDeductionValue = (id: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setDeductions((prev) => prev.map((d) => d.id === id ? { ...d, value: num } : d));
    }
  };

  const removeDeduction = (id: string) =>
    setDeductions((prev) => prev.filter((d) => d.id !== id));

  const addCustomDeduction = () => {
    const num = parseFloat(newValue);
    if (!newLabel.trim() || isNaN(num) || num < 0) {
      toast({ title: "Invalid deduction", description: "Enter a label and a valid amount.", variant: "destructive" });
      return;
    }
    setDeductions((prev) => [
      ...prev,
      {
        id: `custom_${uid}_${Date.now()}`,
        label: newLabel.trim(),
        type: newType,
        value: num,
        enabled: true,
        isCustom: true,
      },
    ]);
    setNewLabel("");
    setNewValue("");
    setShowAddDeduction(false);
  };

  // ── Settlement calculation ──────────────────────────────────────────────────

  const calculateSettlements = async () => {
    if (!periodStart || !periodEnd || !drivers) {
      toast({ title: "Missing Information", description: "Please select period dates and drivers.", variant: "destructive" });
      return;
    }
    if (selectedDrivers.length === 0) {
      toast({ title: "No Drivers Selected", description: "Select at least one driver.", variant: "destructive" });
      return;
    }
    setIsCalculating(true);
    try {
      const start = new Date(periodStart);
      const end = new Date(periodEnd);
      end.setHours(23, 59, 59, 999);

      const periodOrders = (ordersData?.data || []).filter((order: OrderWithDetails) => {
        if (!order.updatedAt) return false;
        const orderDate = new Date(order.updatedAt);
        return orderDate >= start && orderDate <= end && order.status === "delivered";
      });

      const settlements: DriverSettlement[] = [];

      for (const driver of (drivers?.data || []).filter((d) => selectedDrivers.includes(d.id))) {
        const driverOrders = periodOrders.filter((order) =>
          order.assignments?.some((a) => a.driverId === driver.id)
        );
        if (driverOrders.length === 0) continue;

        const payStructure = resolvePayStructure(driver.payStructure);
        let grossPay = 0;
        const loads: LoadForSettlement[] = [];
        let totalMiles = 0;

        for (const order of driverOrders) {
          const revenue = toNumber(order.totalRevenue);
          const miles = toNumber(order.miles ?? order.totalMiles);
          const driverPay = calculateDriverPay(order, payStructure);
          grossPay += driverPay;
          totalMiles += miles;
          loads.push({
            id: order.id,
            orderNumber: order.orderNumber,
            deliveredAt: order.updatedAt ? order.updatedAt.toString() : "",
            origin: order.stops?.find((s) => s.type === "pickup")?.city || "",
            destination: order.stops?.find((s) => s.type === "delivery")?.city || "",
            miles,
            revenue,
            driverPay,
            commodity: order.commodity || undefined,
          });
        }

        const { total: totalDeductions, breakdown } = computeDeductions(grossPay, deductions);
        settlements.push({
          driverId: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          employeeId: driver.employeeId || undefined,
          totalLoads: driverOrders.length,
          totalMiles,
          grossPay,
          deductions: totalDeductions,
          deductionBreakdown: breakdown,
          netPay: +(grossPay - totalDeductions).toFixed(2),
          loads,
          payStructure,
          status: "pending",
          driver,
        });
      }

      if (settlements.length === 0) {
        toast({ title: "No settlements found", description: "No delivered loads in the selected period matched the selected drivers." });
      } else {
        toast({ title: "Settlements calculated", description: `${settlements.length} driver settlement${settlements.length > 1 ? "s" : ""} ready for review.` });
      }
      setDriverSettlements(settlements);
    } catch {
      toast({ title: "Error", description: "Failed to calculate settlements", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  // ── Approval ────────────────────────────────────────────────────────────────

  const approveSettlement = (driverId: number) =>
    setDriverSettlements((prev) =>
      prev.map((s) => s.driverId === driverId ? { ...s, status: "approved" } : s)
    );

  const rejectSettlement = (driverId: number) =>
    setDriverSettlements((prev) =>
      prev.map((s) => s.driverId === driverId ? { ...s, status: "rejected" } : s)
    );

  const approveAll = () =>
    setDriverSettlements((prev) => prev.map((s) => ({ ...s, status: "approved" })));

  // ── Bulk process ────────────────────────────────────────────────────────────

  const processBulkSettlements = async () => {
    const approved = driverSettlements.filter((s) => s.status === "approved");
    if (approved.length === 0) {
      toast({ title: "No Settlements to Process", description: "Approve at least one settlement first.", variant: "destructive" });
      return;
    }
    try {
      for (const settlement of approved) {
        await createSettlementMutation.mutateAsync({
          driverId: settlement.driverId,
          periodStart,
          periodEnd,
          status: "pending",
          grossPay: settlement.grossPay,
          deductions: settlement.deductions,
          netPay: settlement.netPay,
          notes: `${settlement.totalLoads} load${settlement.totalLoads === 1 ? "" : "s"} • ${deductions.filter((d) => d.enabled).map((d) => d.label).join(", ")}`,
          items: settlement.loads.map((load, i) => ({
            id: Date.now() + i,
            orderId: load.id,
            description: `Driver pay — ${load.orderNumber}`,
            type: "pay" as const,
            quantity: 1,
            rate: load.driverPay,
            amount: load.driverPay,
          })),
        });
      }
      toast({ title: "Settlements Processed", description: `${approved.length} settlement${approved.length > 1 ? "s" : ""} created successfully.` });
      setShowBulkProcessModal(false);
      setDriverSettlements([]);
    } catch {
      toast({ title: "Error", description: "Failed to process settlements.", variant: "destructive" });
    }
  };

  const handleDriverSelection = (ids: string[]) =>
    setSelectedDrivers(ids.map((id) => parseInt(id)));

  // ── Derived ─────────────────────────────────────────────────────────────────

  const previewDriver = driverSettlements.find((s) => s.driverId === previewDriverId);
  const approvedCount = driverSettlements.filter((s) => s.status === "approved").length;
  const totalGrossPay = driverSettlements.filter((s) => s.status === "approved").reduce((sum, s) => sum + s.grossPay, 0);
  const totalNetPay = driverSettlements.filter((s) => s.status === "approved").reduce((sum, s) => sum + s.netPay, 0);
  const totalDeductionsSum = driverSettlements.filter((s) => s.status === "approved").reduce((sum, s) => sum + s.deductions, 0);
  const enabledDeductions = deductions.filter((d) => d.enabled);

  // ── Columns ─────────────────────────────────────────────────────────────────

  const driverColumns: Column<DriverWithDetails>[] = [
    {
      key: "firstName",
      title: "Driver",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" weight="light" />
          <div>
            <p className="font-medium text-sm">{row.firstName} {row.lastName}</p>
            {row.employeeId && <p className="text-xs text-muted-foreground font-mono">ID: {row.employeeId}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => (
        <Badge variant={value === "available" ? "default" : "secondary"}>{value}</Badge>
      ),
    },
  ];

  const settlementColumns: Column<DriverSettlement>[] = [
    {
      key: "driverName",
      title: "Driver",
      render: (value: string, row: DriverSettlement) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" weight="light" />
          <div>
            <p className="font-medium text-sm">{value}</p>
            {row.employeeId && <p className="text-xs text-muted-foreground font-mono">ID: {row.employeeId}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "totalLoads",
      title: "Loads",
      align: "center",
      render: (value: number) => (
        <div className="flex items-center justify-center gap-1">
          <Truck className="size-4 text-muted-foreground" weight="light" />
          <span className="font-mono">{value}</span>
        </div>
      ),
    },
    {
      key: "totalMiles",
      title: "Miles",
      align: "right",
      render: (value: number) => <span className="font-mono">{value.toLocaleString()}</span>,
    },
    {
      key: "grossPay",
      title: "Gross Pay",
      align: "right",
      render: (value: number) => <span className="font-mono font-medium">{formatCurrency(value)}</span>,
    },
    {
      key: "deductions",
      title: "Deductions",
      align: "right",
      render: (value: number) => <span className="font-mono text-orange-600">-{formatCurrency(value)}</span>,
    },
    {
      key: "netPay",
      title: "Net Pay",
      align: "right",
      render: (value: number) => <span className="font-mono font-bold text-apollo-cyan-600">{formatCurrency(value)}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => {
        const cfg = value === "approved"
          ? { color: "bg-apollo-cyan-100 text-apollo-cyan-700", Icon: CheckCircle }
          : value === "rejected"
          ? { color: "bg-red-100 text-red-700", Icon: X }
          : { color: "bg-yellow-100 text-yellow-700", Icon: ClockCounterClockwise };
        return (
          <Badge className={cn("text-xs", cfg.color)}>
            <cfg.Icon className="size-3 mr-1" weight="bold" />
            {value}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row: DriverSettlement) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPreviewDriverId(row.driverId)} className="h-8 w-8 p-0" title="Preview">
            <Eye className="size-4" weight="light" />
          </Button>
          {row.status !== "approved" && (
            <Button variant="ghost" size="sm" onClick={() => approveSettlement(row.driverId)}
              className="h-8 w-8 p-0 text-apollo-cyan-600 hover:text-apollo-cyan-700" title="Approve">
              <CheckCircle className="size-4" weight="bold" />
            </Button>
          )}
          {row.status !== "rejected" && (
            <Button variant="ghost" size="sm" onClick={() => rejectSettlement(row.driverId)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600" title="Reject">
              <X className="size-4" weight="bold" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settlement Run</h1>
          <p className="text-sm text-muted-foreground">
            Calculate, review, and process driver settlements for completed loads
          </p>
        </div>
        {driverSettlements.length > 0 && approvedCount > 0 && (
          <Button onClick={() => setShowBulkProcessModal(true)} className="gap-2">
            <CreditCard className="size-4" weight="bold" />
            Process {approvedCount} Settlement{approvedCount > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Period Selection */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="size-5 text-primary" weight="light" />
          <h2 className="text-lg font-semibold">Settlement Period</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <DatePicker label="Period Start" value={periodStart} onChange={setPeriodStart} />
          <DatePicker label="Period End" value={periodEnd} onChange={setPeriodEnd} />
          <div>
            <Button onClick={calculateSettlements} disabled={isCalculating || !periodStart || !periodEnd} className="gap-2">
              {isCalculating ? (
                <><div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Calculating…</>
              ) : (
                <><Calculator className="size-4" weight="bold" />Calculate Settlements</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Deduction Template */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CurrencyDollar className="size-5 text-primary" weight="light" />
            <h2 className="text-lg font-semibold">Deduction Template</h2>
            {enabledDeductions.length > 0 && (
              <Badge variant="secondary" className="text-xs font-mono">
                {enabledDeductions.length} active
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAddDeduction(!showAddDeduction)}>
            <Plus className="size-3.5" weight="bold" />
            Add Deduction
          </Button>
        </div>

        <div className="space-y-2">
          {deductions.map((d) => (
            <div key={d.id} className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
              d.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30"
            )}>
              <button
                onClick={() => toggleDeduction(d.id)}
                className={cn("shrink-0 transition-colors", d.enabled ? "text-apollo-cyan-600" : "text-muted-foreground")}
                aria-label={d.enabled ? "Disable deduction" : "Enable deduction"}
              >
                {d.enabled ? <CheckSquare className="size-5" weight="fill" /> : <Square className="size-5" weight="light" />}
              </button>

              <span className={cn("flex-1 text-sm font-medium", !d.enabled && "text-muted-foreground")}>
                {d.label}
              </span>

              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={d.type === "percentage" ? 0.01 : 1}
                    value={d.value}
                    onChange={(e) => updateDeductionValue(d.id, e.target.value)}
                    className="h-7 w-20 text-xs font-mono text-right pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {d.type === "percentage" ? "%" : "$"}
                  </span>
                </div>
                <Badge variant="outline" className={cn("text-xs h-5 px-1.5", d.type === "percentage" ? "text-blue-600" : "text-green-600")}>
                  {d.type === "percentage" ? <Percent className="size-3" /> : <CurrencyDollar className="size-3" />}
                </Badge>
                {d.isCustom && (
                  <button onClick={() => removeDeduction(d.id)} className="text-muted-foreground hover:text-red-500 transition-colors" title="Remove">
                    <Trash className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom deduction inline form */}
        <AnimatePresence>
          {showAddDeduction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-primary">Add Custom Deduction</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-xs text-muted-foreground">Label</label>
                    <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Fuel Advance" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <div className="mt-1 flex rounded-md border border-input overflow-hidden">
                      <button
                        onClick={() => setNewType("flat")}
                        className={cn("flex-1 text-xs py-1.5 transition-colors", newType === "flat" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}
                      >$ Flat</button>
                      <button
                        onClick={() => setNewType("percentage")}
                        className={cn("flex-1 text-xs py-1.5 transition-colors", newType === "percentage" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}
                      >% Rate</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Amount ({newType === "flat" ? "$" : "%"})</label>
                    <Input
                      type="number" min={0} value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={newType === "flat" ? "0.00" : "0.00"}
                      className="mt-1 h-8 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCustomDeduction} className="gap-1.5">
                    <Plus className="size-3.5" weight="bold" />Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddDeduction(false); setNewLabel(""); setNewValue(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {enabledDeductions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            Active: {enabledDeductions.map((d) => `${d.label} (${d.type === "percentage" ? `${d.value}%` : formatCurrency(d.value)})`).join(" • ")}
          </div>
        )}
      </Card>

      {/* Driver Selection */}
      {driverSettlements.length === 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="size-5 text-primary" weight="light" />
            <h2 className="text-lg font-semibold">Select Drivers</h2>
          </div>
          <DataTable
            data={drivers?.data || []}
            columns={driverColumns}
            loading={driversLoading || ordersLoading}
            error={driversError instanceof Error ? driversError.message : null}
            emptyMessage="No drivers found"
            emptyState={{ title: "No drivers available", description: "Add active drivers to start a settlement run." }}
            selection={{
              selectedRows: selectedDrivers.map((id) => id.toString()),
              onSelectionChange: handleDriverSelection,
              getRowId: (row) => row.id.toString(),
            }}
            searchable
            searchPlaceholder="Search drivers…"
          />
          {selectedDrivers.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-mono">{selectedDrivers.length}</span> driver{selectedDrivers.length > 1 ? "s" : ""} selected
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Settlement Results */}
      {driverSettlements.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-primary" weight="light" />
              <h2 className="text-lg font-semibold">Calculated Settlements</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-mono">
                {formatDate(periodStart)} — {formatDate(periodEnd)}
              </span>
              <Button variant="outline" size="sm" onClick={approveAll} className="gap-1.5">
                <CheckCircle className="size-3.5" weight="bold" />
                Approve All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDriverSettlements([])} className="gap-1.5">
                <X className="size-3.5" weight="bold" />
                Reset
              </Button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="font-mono text-xl font-semibold">{approvedCount} / {driverSettlements.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Gross Pay</p>
              <p className="font-mono text-xl font-semibold">{formatCurrency(totalGrossPay)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Deductions</p>
              <p className="font-mono text-xl font-semibold text-orange-600">{formatCurrency(totalDeductionsSum)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Net Pay</p>
              <p className="font-mono text-xl font-semibold text-apollo-cyan-600">{formatCurrency(totalNetPay)}</p>
            </Card>
          </div>

          <DataTable
            data={driverSettlements}
            columns={settlementColumns}
            emptyMessage="No settlements calculated"
            emptyState={{ title: "No settlements yet", description: "Select drivers and run the settlement calculation." }}
          />

          {approvedCount > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-apollo-cyan-50 border border-apollo-cyan-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-apollo-cyan-700">
                  <span className="font-mono">{approvedCount}</span> settlement{approvedCount > 1 ? "s" : ""} ready for processing
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium text-apollo-cyan-800">
                    Net Total: {formatCurrency(totalNetPay)}
                  </span>
                  <Button size="sm" onClick={() => setShowBulkProcessModal(true)} className="gap-1.5">
                    <CreditCard className="size-3.5" weight="bold" />
                    Process
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Settlement Preview Sheet */}
      <Sheet open={!!previewDriverId} onOpenChange={(open) => !open && setPreviewDriverId(null)}>
        {previewDriver && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Loads</p>
                  <p className="font-mono text-lg font-bold">{previewDriver.totalLoads}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Miles</p>
                  <p className="font-mono text-lg font-bold">{previewDriver.totalMiles.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Pay</p>
                  <p className="font-mono text-lg font-bold text-apollo-cyan-600">{formatCurrency(previewDriver.netPay)}</p>
                </div>
              </div>
            </Card>

            {/* Load Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Load Details</h3>
              <div className="space-y-2">
                {previewDriver.loads.map((load, i) => (
                  <motion.div
                    key={load.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="size-4 text-muted-foreground" weight="light" />
                      <div>
                        <p className="font-mono font-medium text-sm">{load.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {load.origin} → {load.destination} • <span className="font-mono">{load.miles.toLocaleString()}</span> mi
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(load.deliveredAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-sm">{formatCurrency(load.driverPay)}</p>
                      <p className="text-xs text-muted-foreground">Revenue: <span className="font-mono">{formatCurrency(load.revenue)}</span></p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pay Breakdown */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Pay Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gross Pay:</span>
                  <span className="font-mono">{formatCurrency(previewDriver.grossPay)}</span>
                </div>
                <Separator />
                {previewDriver.deductionBreakdown.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm text-orange-600">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono">-{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium text-orange-600">
                  <span>Total Deductions:</span>
                  <span className="font-mono">-{formatCurrency(previewDriver.deductions)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Net Pay:</span>
                  <span className="font-mono text-apollo-cyan-600">{formatCurrency(previewDriver.netPay)}</span>
                </div>
              </div>
            </Card>

            {/* Approve / Reject */}
            <div className="flex gap-2">
              {previewDriver.status !== "approved" && (
                <Button className="flex-1 gap-2" onClick={() => { approveSettlement(previewDriver.driverId); setPreviewDriverId(null); }}>
                  <CheckCircle className="size-4" weight="bold" />Approve
                </Button>
              )}
              {previewDriver.status !== "rejected" && (
                <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:text-red-700" onClick={() => { rejectSettlement(previewDriver.driverId); setPreviewDriverId(null); }}>
                  <X className="size-4" weight="bold" />Reject
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* Bulk Process Modal */}
      <Modal isOpen={showBulkProcessModal} onClose={() => setShowBulkProcessModal(false)} title="Process Settlements" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CreditCard className="size-5 text-primary mt-0.5" weight="light" />
            <div>
              <p className="font-medium">Process <span className="font-mono">{approvedCount}</span> Settlement{approvedCount > 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground">
                Settlement records will be created for all approved drivers and marked as pending payment.
              </p>
            </div>
          </div>
          <Card className="p-4 bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Approved Settlements:</span>
                <span className="font-medium font-mono">{approvedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Gross Pay:</span>
                <span className="font-mono">{formatCurrency(totalGrossPay)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Total Deductions:</span>
                <span className="font-mono">-{formatCurrency(totalDeductionsSum)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total Net Pay:</span>
                <span className="font-mono text-apollo-cyan-600">{formatCurrency(totalNetPay)}</span>
              </div>
            </div>
          </Card>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Applied Deductions:</p>
            {enabledDeductions.map((d) => (
              <p key={d.id}>• {d.label} — {d.type === "percentage" ? `${d.value}% of gross` : formatCurrency(d.value) + " flat"}</p>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowBulkProcessModal(false)}>Cancel</Button>
            <Button onClick={processBulkSettlements} disabled={createSettlementMutation.isPending} className="gap-2">
              {createSettlementMutation.isPending ? (
                <><div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing…</>
              ) : (
                <><CheckCircle className="size-4" weight="bold" />Confirm & Process</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
