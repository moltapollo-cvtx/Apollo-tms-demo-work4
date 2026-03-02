"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowsClockwise,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  CircleNotch,
  ClipboardText,
  CurrencyDollar,
  DownloadSimple,
  Eye,
  FilePdf,
  Gauge,
  Plus,
  ShieldCheck,
  Trash,
  Truck,
  User,
  UsersThree,
  WarningCircle,
  Wrench,
  X,
} from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockCustomers,
  mockDrivers,
  mockOrders,
  mockTractors,
  mockTrailers,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
  "Activity Summary",
  "Trip History",
  "Driver Performance",
  "Equipment Utilization",
  "Fuel Efficiency",
  "Revenue Analysis",
  "Safety Compliance",
  "IFTA Summary",
] as const;

type ReportType = (typeof REPORT_TYPES)[number];

type SidebarCategoryId = "activity" | "assets" | "drivers" | "financial" | "compliance";
type CategoryFilter = "all" | SidebarCategoryId;
type ScheduleFrequency = "Daily" | "Weekly" | "Monthly";
type ScheduleStatus = "Active" | "Paused";
type ReportStatus = "Generating" | "Ready";
type CellValue = string | number;

interface ReportColumn {
  key: string;
  label: string;
}

interface ReportMetric {
  label: string;
  value: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface ReportDataset {
  columns: ReportColumn[];
  rows: Array<Record<string, CellValue>>;
  chartType: "bar" | "line";
  chartData: ChartPoint[];
  summaryMetrics: ReportMetric[];
}

interface ReportFilters {
  driverId: string;
  customerId: string;
  equipmentId: string;
}

interface BuilderFormState extends ReportFilters {
  name: string;
  type: ReportType;
  fromDate: string;
  toDate: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  fromDate: string;
  toDate: string;
  createdAt: string;
  status: ReportStatus;
  category: SidebarCategoryId;
  filters: ReportFilters;
  dataset: ReportDataset;
}

interface ScheduledReport {
  id: string;
  name: string;
  type: ReportType;
  frequency: ScheduleFrequency;
  nextRun: string;
  recipients: string[];
  status: ScheduleStatus;
}

interface ScheduleFormState {
  id: string | null;
  name: string;
  type: ReportType;
  frequency: ScheduleFrequency;
  recipients: string;
  status: ScheduleStatus;
}

interface InlineToast {
  id: number;
  message: string;
  tone: "info" | "success" | "error";
}

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  type: ReportType;
  category: SidebarCategoryId;
  defaultRangeDays: number;
}

const REPORT_TYPE_CATEGORY: Record<ReportType, SidebarCategoryId> = {
  "Activity Summary": "activity",
  "Trip History": "activity",
  "Driver Performance": "drivers",
  "Equipment Utilization": "assets",
  "Fuel Efficiency": "assets",
  "Revenue Analysis": "financial",
  "Safety Compliance": "compliance",
  "IFTA Summary": "financial",
};

const CATEGORY_GROUPS: Array<{
  id: SidebarCategoryId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: string[];
}> = [
  {
    id: "activity",
    label: "Activity",
    icon: ClipboardText,
    items: [
      "Activity Summary",
      "Trip History",
      "Jurisdiction Mileage",
      "Start/Stop",
      "Time on Site",
    ],
  },
  {
    id: "assets",
    label: "Assets",
    icon: Truck,
    items: ["Equipment", "Inventory"],
  },
  {
    id: "drivers",
    label: "Drivers",
    icon: UsersThree,
    items: ["Performance", "HOS Compliance", "Safety Scores"],
  },
  {
    id: "financial",
    label: "Financial",
    icon: CurrencyDollar,
    items: ["Revenue", "Expenses", "IFTA"],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ShieldCheck,
    items: ["Safety Audit", "DOT Inspection", "Drug Testing"],
  },
];

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "driver-performance",
    title: "Driver Performance",
    description: "On-time rate, safety score, and miles by driver.",
    icon: User,
    type: "Driver Performance",
    category: "drivers",
    defaultRangeDays: 30,
  },
  {
    id: "fleet-utilization",
    title: "Fleet Utilization",
    description: "Equipment uptime and utilization trends across the fleet.",
    icon: Gauge,
    type: "Equipment Utilization",
    category: "assets",
    defaultRangeDays: 30,
  },
  {
    id: "revenue-summary",
    title: "Revenue Summary",
    description: "Revenue and margin grouped by customer account.",
    icon: CurrencyDollar,
    type: "Revenue Analysis",
    category: "financial",
    defaultRangeDays: 90,
  },
  {
    id: "safety-audit",
    title: "Safety Audit",
    description: "Compliance risk indicators and driver safety metrics.",
    icon: ShieldCheck,
    type: "Safety Compliance",
    category: "compliance",
    defaultRangeDays: 60,
  },
];

const EQUIPMENT_OPTIONS = [
  ...mockTractors.map((tractor) => ({
    value: `tractor-${tractor.id}`,
    label: `${tractor.unitNumber} • Tractor • ${tractor.make} ${tractor.model}`,
  })),
  ...mockTrailers.map((trailer) => ({
    value: `trailer-${trailer.id}`,
    label: `${trailer.unitNumber} • Trailer • ${toTitleCase(trailer.type)}`,
  })),
];

const CURRENCY_COLUMNS = new Set(["revenue", "cost", "margin", "taxDue"]);
const PERCENT_COLUMNS = new Set(["onTimeRate", "safetyScore", "utilization", "marginPct"]);
const DECIMAL_COLUMNS = new Set(["driveHours", "idleHours", "fuelEfficiency", "fuelGallons", "mpg"]);

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const oneDecimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const INITIAL_REPORTS_REFERENCE_DATE = new Date("2026-03-01T12:00:00.000Z");

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDateRangeForDays(days: number, referenceDate: Date = new Date()) {
  const toDate = new Date(referenceDate);
  const fromDate = new Date(referenceDate);
  fromDate.setDate(fromDate.getDate() - days);
  return {
    fromDate: toDateInputValue(fromDate),
    toDate: toDateInputValue(toDate),
  };
}

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatStatus(value: string | undefined) {
  if (!value) return "Unassigned";
  return value
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function isReportType(value: string): value is ReportType {
  return REPORT_TYPES.includes(value as ReportType);
}

function getDriverName(driverId: number | undefined) {
  if (!driverId) return "Unassigned";
  const driver = mockDrivers.find((item) => item.id === driverId);
  return driver ? `${driver.firstName} ${driver.lastName}` : "Unassigned";
}

function getCustomerName(customerId: number) {
  return mockCustomers.find((item) => item.id === customerId)?.name ?? "Unknown Customer";
}

function parseEquipmentSelection(value: string) {
  if (!value) return null;
  const [type, idText] = value.split("-");
  const id = Number(idText);

  if (!Number.isFinite(id)) return null;
  if (type !== "tractor" && type !== "trailer") return null;

  return { type, id } as const;
}

function createBuilderDefaults(referenceDate: Date = new Date()): BuilderFormState {
  const range = getDateRangeForDays(30, referenceDate);
  return {
    name: "",
    type: "Activity Summary",
    fromDate: range.fromDate,
    toDate: range.toDate,
    driverId: "",
    customerId: "",
    equipmentId: "",
  };
}

function calculateNextRun(frequency: ScheduleFrequency, referenceDate: Date = new Date()) {
  const next = new Date(referenceDate);
  if (frequency === "Daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "Weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
}

function createInitialScheduledReports(referenceDate: Date = new Date()): ScheduledReport[] {
  return [
    {
      id: "sched-1",
      name: "Daily Activity Digest",
      type: "Activity Summary",
      frequency: "Daily",
      nextRun: calculateNextRun("Daily", referenceDate),
      recipients: ["ops@apollotms.com", "dispatch@apollotms.com"],
      status: "Active",
    },
    {
      id: "sched-2",
      name: "Weekly Driver Scorecard",
      type: "Driver Performance",
      frequency: "Weekly",
      nextRun: calculateNextRun("Weekly", referenceDate),
      recipients: ["safety@apollotms.com", "fleet@apollotms.com"],
      status: "Active",
    },
    {
      id: "sched-3",
      name: "Monthly Revenue Summary",
      type: "Revenue Analysis",
      frequency: "Monthly",
      nextRun: calculateNextRun("Monthly", referenceDate),
      recipients: ["finance@apollotms.com"],
      status: "Paused",
    },
    {
      id: "sched-4",
      name: "IFTA Prep Report",
      type: "IFTA Summary",
      frequency: "Monthly",
      nextRun: calculateNextRun("Monthly", referenceDate),
      recipients: ["tax@apollotms.com", "compliance@apollotms.com"],
      status: "Active",
    },
  ];
}

function createScheduleFormDefaults(): ScheduleFormState {
  return {
    id: null,
    name: "",
    type: "Activity Summary",
    frequency: "Weekly",
    recipients: "",
    status: "Active",
  };
}

function applyCellFormat(key: string, value: CellValue): string {
  if (typeof value !== "number") return value;
  if (CURRENCY_COLUMNS.has(key)) return currencyFormatter.format(value);
  if (PERCENT_COLUMNS.has(key)) return `${oneDecimalFormatter.format(value)}%`;
  if (DECIMAL_COLUMNS.has(key)) return oneDecimalFormatter.format(value);
  return numberFormatter.format(value);
}

function buildReportDataset(type: ReportType, filters: ReportFilters): ReportDataset {
  const selectedDriverId = filters.driverId ? Number(filters.driverId) : undefined;
  const selectedCustomerId = filters.customerId ? Number(filters.customerId) : undefined;
  const selectedEquipment = parseEquipmentSelection(filters.equipmentId);

  const filteredDrivers = (selectedDriverId
    ? mockDrivers.filter((driver) => driver.id === selectedDriverId)
    : mockDrivers
  ).slice(0, 10);

  const filteredOrders = mockOrders.filter((order) => {
    if (selectedCustomerId && order.customerId !== selectedCustomerId) return false;
    if (selectedDriverId && order.assignedDriverId !== selectedDriverId) return false;

    if (selectedEquipment?.type === "tractor" && order.assignedTractorId !== selectedEquipment.id) {
      return false;
    }

    if (selectedEquipment?.type === "trailer" && order.assignedTrailerId !== selectedEquipment.id) {
      return false;
    }

    return true;
  });

  const orders = (filteredOrders.length > 0 ? filteredOrders : mockOrders).slice(0, 12);

  if (type === "Activity Summary") {
    const drivers = (filteredDrivers.length > 0 ? filteredDrivers : mockDrivers).slice(0, 8);
    const rows = drivers.map((driver, index) => {
      const trips = 8 + ((driver.id * 3 + index) % 11);
      const miles = 1050 + driver.id * 92 + index * 44;
      const driveHours = Number((miles / 57).toFixed(1));
      const idleHours = Number((driveHours * 0.13).toFixed(1));
      return {
        driver: `${driver.firstName} ${driver.lastName}`,
        trips,
        miles,
        driveHours,
        idleHours,
      };
    });

    const totalMiles = rows.reduce((sum, row) => sum + Number(row.miles), 0);
    const averageDriveHours =
      rows.length > 0 ? rows.reduce((sum, row) => sum + Number(row.driveHours), 0) / rows.length : 0;

    return {
      columns: [
        { key: "driver", label: "Driver" },
        { key: "trips", label: "Trips" },
        { key: "miles", label: "Miles" },
        { key: "driveHours", label: "Drive Hours" },
        { key: "idleHours", label: "Idle Hours" },
      ],
      rows,
      chartType: "bar",
      chartData: rows.map((row) => ({ label: String(row.driver), value: Number(row.miles) })),
      summaryMetrics: [
        { label: "Total Miles", value: numberFormatter.format(totalMiles) },
        { label: "Avg Drive Hours", value: oneDecimalFormatter.format(averageDriveHours) },
        { label: "Total Trips", value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.trips), 0)) },
      ],
    };
  }

  if (type === "Trip History") {
    const rows = orders.map((order) => ({
      tripId: order.orderNumber,
      customer: getCustomerName(order.customerId),
      driver: getDriverName(order.assignedDriverId),
      miles: order.totalMiles ?? 0,
      status: formatStatus(order.status),
      revenue: Math.round(order.totalRate ?? 0),
    }));

    const totalMiles = rows.reduce((sum, row) => sum + Number(row.miles), 0);
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);

    return {
      columns: [
        { key: "tripId", label: "Trip ID" },
        { key: "customer", label: "Customer" },
        { key: "driver", label: "Driver" },
        { key: "miles", label: "Miles" },
        { key: "status", label: "Status" },
        { key: "revenue", label: "Revenue" },
      ],
      rows,
      chartType: "line",
      chartData: rows.map((row) => ({
        label: String(row.tripId).replace("ORD", ""),
        value: Number(row.miles),
      })),
      summaryMetrics: [
        { label: "Total Trips", value: numberFormatter.format(rows.length) },
        { label: "Total Miles", value: numberFormatter.format(totalMiles) },
        { label: "Total Revenue", value: currencyFormatter.format(totalRevenue) },
      ],
    };
  }

  if (type === "Driver Performance") {
    const drivers = (filteredDrivers.length > 0 ? filteredDrivers : mockDrivers).slice(0, 10);
    const rows = drivers.map((driver) => {
      const miles = 4200 + driver.id * 465;
      const onTimeRate = 84 + ((driver.id * 7) % 14);
      const safetyScore = 73 + ((driver.id * 5) % 24);
      const fuelEfficiency = Number((6.2 + ((driver.id + 2) % 5) * 0.4).toFixed(1));

      return {
        driver: `${driver.firstName} ${driver.lastName}`,
        miles,
        onTimeRate,
        safetyScore,
        fuelEfficiency,
      };
    });

    const averageScore = rows.reduce((sum, row) => sum + Number(row.safetyScore), 0) / Math.max(rows.length, 1);
    const averageOnTime = rows.reduce((sum, row) => sum + Number(row.onTimeRate), 0) / Math.max(rows.length, 1);

    return {
      columns: [
        { key: "driver", label: "Driver" },
        { key: "miles", label: "Miles" },
        { key: "onTimeRate", label: "On-Time %" },
        { key: "safetyScore", label: "Safety Score" },
        { key: "fuelEfficiency", label: "MPG" },
      ],
      rows,
      chartType: "bar",
      chartData: rows.map((row) => ({ label: String(row.driver), value: Number(row.safetyScore) })),
      summaryMetrics: [
        { label: "Avg Safety Score", value: oneDecimalFormatter.format(averageScore) },
        { label: "Avg On-Time", value: `${oneDecimalFormatter.format(averageOnTime)}%` },
        {
          label: "Total Miles",
          value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.miles), 0)),
        },
      ],
    };
  }

  if (type === "Equipment Utilization") {
    const tractors = mockTractors.map((tractor) => ({
      key: `tractor-${tractor.id}`,
      equipment: tractor.unitNumber,
      assetType: "Tractor",
      status: formatStatus(tractor.status),
      miles: Math.round(tractor.mileage * 0.04),
      utilization: 58 + ((tractor.id * 9) % 38),
    }));

    const trailers = mockTrailers.map((trailer) => ({
      key: `trailer-${trailer.id}`,
      equipment: trailer.unitNumber,
      assetType: "Trailer",
      status: formatStatus(trailer.status),
      miles: 3100 + trailer.id * 145,
      utilization: 52 + ((trailer.id * 7) % 40),
    }));

    const allEquipment = [...tractors, ...trailers];
    const equipment = selectedEquipment
      ? allEquipment.filter((item) => item.key === `${selectedEquipment.type}-${selectedEquipment.id}`)
      : allEquipment;

    const rows = (equipment.length > 0 ? equipment : allEquipment).slice(0, 12).map((item) => ({
      equipment: item.equipment,
      assetType: item.assetType,
      status: item.status,
      miles: item.miles,
      utilization: item.utilization,
    }));

    const avgUtilization = rows.reduce((sum, row) => sum + Number(row.utilization), 0) / Math.max(rows.length, 1);

    return {
      columns: [
        { key: "equipment", label: "Equipment" },
        { key: "assetType", label: "Type" },
        { key: "status", label: "Status" },
        { key: "miles", label: "Miles" },
        { key: "utilization", label: "Utilization %" },
      ],
      rows,
      chartType: "bar",
      chartData: rows.map((row) => ({ label: String(row.equipment), value: Number(row.utilization) })),
      summaryMetrics: [
        { label: "Avg Utilization", value: `${oneDecimalFormatter.format(avgUtilization)}%` },
        { label: "Assets", value: numberFormatter.format(rows.length) },
        {
          label: "Total Miles",
          value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.miles), 0)),
        },
      ],
    };
  }

  if (type === "Fuel Efficiency") {
    const tractors = selectedEquipment?.type === "tractor"
      ? mockTractors.filter((tractor) => tractor.id === selectedEquipment.id)
      : mockTractors;

    const source = (tractors.length > 0 ? tractors : mockTractors).slice(0, 10);

    const rows = source.map((tractor, index) => {
      const miles = 1800 + tractor.id * 135 + index * 88;
      const mpg = Number((6.0 + (tractor.id % 5) * 0.42).toFixed(1));
      const fuelGallons = Number((miles / mpg).toFixed(1));

      return {
        equipment: tractor.unitNumber,
        driver: getDriverName(tractor.currentDriverId ?? undefined),
        miles,
        fuelGallons,
        mpg,
      };
    });

    const avgMpg = rows.reduce((sum, row) => sum + Number(row.mpg), 0) / Math.max(rows.length, 1);

    return {
      columns: [
        { key: "equipment", label: "Equipment" },
        { key: "driver", label: "Driver" },
        { key: "miles", label: "Miles" },
        { key: "fuelGallons", label: "Fuel Used (gal)" },
        { key: "mpg", label: "MPG" },
      ],
      rows,
      chartType: "line",
      chartData: rows.map((row) => ({ label: String(row.equipment), value: Number(row.mpg) })),
      summaryMetrics: [
        { label: "Average MPG", value: oneDecimalFormatter.format(avgMpg) },
        {
          label: "Fuel Used",
          value: oneDecimalFormatter.format(rows.reduce((sum, row) => sum + Number(row.fuelGallons), 0)),
        },
        {
          label: "Total Miles",
          value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.miles), 0)),
        },
      ],
    };
  }

  if (type === "Revenue Analysis") {
    const totals = new Map<number, { customer: string; loads: number; revenue: number; cost: number }>();

    for (const order of orders) {
      const existing = totals.get(order.customerId) ?? {
        customer: getCustomerName(order.customerId),
        loads: 0,
        revenue: 0,
        cost: 0,
      };

      existing.loads += 1;
      existing.revenue += order.totalRate ?? 0;
      existing.cost += order.estimatedCost ?? (order.totalRate ?? 0) * 0.8;

      totals.set(order.customerId, existing);
    }

    const rows = [...totals.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((item) => {
        const margin = item.revenue - item.cost;
        return {
          customer: item.customer,
          loads: item.loads,
          revenue: Math.round(item.revenue),
          cost: Math.round(item.cost),
          margin: Math.round(margin),
          marginPct: (margin / Math.max(item.revenue, 1)) * 100,
        };
      });

    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);
    const totalMargin = rows.reduce((sum, row) => sum + Number(row.margin), 0);

    return {
      columns: [
        { key: "customer", label: "Customer" },
        { key: "loads", label: "Loads" },
        { key: "revenue", label: "Revenue" },
        { key: "cost", label: "Cost" },
        { key: "margin", label: "Margin" },
        { key: "marginPct", label: "Margin %" },
      ],
      rows,
      chartType: "bar",
      chartData: rows.map((row) => ({
        label: String(row.customer).slice(0, 14),
        value: Number(row.revenue),
      })),
      summaryMetrics: [
        { label: "Total Revenue", value: currencyFormatter.format(totalRevenue) },
        { label: "Total Margin", value: currencyFormatter.format(totalMargin) },
        {
          label: "Avg Margin",
          value: `${oneDecimalFormatter.format((totalMargin / Math.max(totalRevenue, 1)) * 100)}%`,
        },
      ],
    };
  }

  if (type === "Safety Compliance") {
    const drivers = (filteredDrivers.length > 0 ? filteredDrivers : mockDrivers).slice(0, 10);
    const rows = drivers.map((driver) => {
      const safetyScore = 74 + ((driver.id * 6) % 24);
      const hosViolations = driver.id % 4;
      const incidents = driver.id % 3;
      const inspections = 2 + (driver.id % 6);

      return {
        driver: `${driver.firstName} ${driver.lastName}`,
        safetyScore,
        hosViolations,
        incidents,
        inspections,
      };
    });

    const avgSafetyScore = rows.reduce((sum, row) => sum + Number(row.safetyScore), 0) / Math.max(rows.length, 1);

    return {
      columns: [
        { key: "driver", label: "Driver" },
        { key: "safetyScore", label: "Safety Score" },
        { key: "hosViolations", label: "HOS Violations" },
        { key: "incidents", label: "Incidents" },
        { key: "inspections", label: "Inspections" },
      ],
      rows,
      chartType: "bar",
      chartData: rows.map((row) => ({ label: String(row.driver), value: Number(row.safetyScore) })),
      summaryMetrics: [
        { label: "Avg Safety Score", value: oneDecimalFormatter.format(avgSafetyScore) },
        {
          label: "Total Incidents",
          value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.incidents), 0)),
        },
        {
          label: "HOS Violations",
          value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.hosViolations), 0)),
        },
      ],
    };
  }

  const customerState = new Map(mockCustomers.map((customer) => [customer.id, customer.address.state]));
  const milesByState = new Map<string, number>();

  for (const order of orders) {
    const state = customerState.get(order.customerId) ?? "TX";
    const existingMiles = milesByState.get(state) ?? 0;
    milesByState.set(state, existingMiles + (order.totalMiles ?? 0));
  }

  if (milesByState.size === 0) {
    for (const customer of mockCustomers.slice(0, 6)) {
      milesByState.set(customer.address.state, 1500 + customer.id * 320);
    }
  }

  const rows = [...milesByState.entries()].slice(0, 10).map(([state, totalMiles], index) => {
    const taxableMiles = Math.round(totalMiles * 0.88);
    const fuelGallons = Number((taxableMiles / 6.9).toFixed(1));
    const taxDue = Number((taxableMiles * (0.034 + index * 0.0012)).toFixed(2));

    return {
      state,
      taxableMiles,
      nonTaxableMiles: Math.max(Math.round(totalMiles - taxableMiles), 0),
      fuelGallons,
      taxDue,
    };
  });

  return {
    columns: [
      { key: "state", label: "Jurisdiction" },
      { key: "taxableMiles", label: "Taxable Miles" },
      { key: "nonTaxableMiles", label: "Non-Taxable Miles" },
      { key: "fuelGallons", label: "Fuel (gal)" },
      { key: "taxDue", label: "Tax Due" },
    ],
    rows,
    chartType: "bar",
    chartData: rows.map((row) => ({ label: String(row.state), value: Number(row.taxableMiles) })),
    summaryMetrics: [
      {
        label: "Taxable Miles",
        value: numberFormatter.format(rows.reduce((sum, row) => sum + Number(row.taxableMiles), 0)),
      },
      {
        label: "Fuel Gallons",
        value: oneDecimalFormatter.format(rows.reduce((sum, row) => sum + Number(row.fuelGallons), 0)),
      },
      {
        label: "Estimated Tax Due",
        value: currencyFormatter.format(rows.reduce((sum, row) => sum + Number(row.taxDue), 0)),
      },
    ],
  };
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function csvEscape(value: CellValue) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<SidebarCategoryId, boolean>>({
    activity: true,
    assets: true,
    drivers: true,
    financial: true,
    compliance: true,
  });

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderForm, setBuilderForm] = useState<BuilderFormState>(() =>
    createBuilderDefaults(INITIAL_REPORTS_REFERENCE_DATE),
  );

  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "scheduled">("my");

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(() =>
    createInitialScheduledReports(INITIAL_REPORTS_REFERENCE_DATE),
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => createScheduleFormDefaults());

  const [toasts, setToasts] = useState<InlineToast[]>([]);

  const generationTimersRef = useRef<number[]>([]);
  const toastIdRef = useRef(0);
  const toastTimerMapRef = useRef(new Map<number, number>());

  const selectedReport = useMemo(
    () => generatedReports.find((report) => report.id === selectedReportId) ?? null,
    [generatedReports, selectedReportId]
  );

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "all") return REPORT_TEMPLATES;
    return REPORT_TEMPLATES.filter((template) => template.category === activeCategory);
  }, [activeCategory]);

  const filteredGeneratedReports = useMemo(() => {
    if (activeCategory === "all") return generatedReports;
    return generatedReports.filter((report) => report.category === activeCategory);
  }, [activeCategory, generatedReports]);

  useEffect(() => {
    const generationTimers = generationTimersRef.current;
    return () => {
      generationTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Auto-dismiss toasts after 3200ms via useEffect with cleanup
  useEffect(() => {
    const timerMap = toastTimerMapRef.current;
    for (const toast of toasts) {
      if (timerMap.has(toast.id)) continue;
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        timerMap.delete(toast.id);
      }, 3200);
      timerMap.set(toast.id, timer);
    }
    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
    };
  }, [toasts]);

  const pushToast = (message: string, tone: InlineToast["tone"] = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
  };

  const updateBuilderField = (field: keyof BuilderFormState, value: string) => {
    setBuilderForm((prev) => ({ ...prev, [field]: value }));
  };

  const createReport = (values: BuilderFormState) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const dataset = buildReportDataset(values.type, {
      driverId: values.driverId,
      customerId: values.customerId,
      equipmentId: values.equipmentId,
    });

    const newReport: GeneratedReport = {
      id,
      name: values.name.trim(),
      type: values.type,
      fromDate: values.fromDate,
      toDate: values.toDate,
      createdAt: new Date().toISOString(),
      status: "Generating",
      category: REPORT_TYPE_CATEGORY[values.type],
      filters: {
        driverId: values.driverId,
        customerId: values.customerId,
        equipmentId: values.equipmentId,
      },
      dataset,
    };

    setGeneratedReports((prev) => [newReport, ...prev]);
    setActiveTab("my");

    const timer = window.setTimeout(() => {
      setGeneratedReports((prev) =>
        prev.map((report) =>
          report.id === id
            ? {
                ...report,
                status: "Ready",
              }
            : report
        )
      );
    }, 2000);

    generationTimersRef.current.push(timer);
    pushToast(`Generating report: ${newReport.name}`, "info");
  };

  const handleGenerateFromBuilder = () => {
    if (!builderForm.name.trim()) {
      pushToast("Report name is required.", "error");
      return;
    }

    if (!builderForm.fromDate || !builderForm.toDate) {
      pushToast("Select a valid date range.", "error");
      return;
    }

    if (new Date(builderForm.fromDate) > new Date(builderForm.toDate)) {
      pushToast("Start date must be before end date.", "error");
      return;
    }

    createReport(builderForm);
    setIsBuilderOpen(false);
  };

  const handleUseTemplate = (template: ReportTemplate) => {
    const range = getDateRangeForDays(template.defaultRangeDays);
    const reportName = `${template.title} (${formatDate(new Date().toISOString())})`;

    const values: BuilderFormState = {
      name: reportName,
      type: template.type,
      fromDate: range.fromDate,
      toDate: range.toDate,
      driverId: "",
      customerId: "",
      equipmentId: "",
    };

    setBuilderForm(values);
    setActiveCategory(template.category);
    setIsBuilderOpen(true);
    createReport(values);
  };

  const handleDeleteReport = (report: GeneratedReport) => {
    if (!window.confirm(`Delete report \"${report.name}\"?`)) return;

    setGeneratedReports((prev) => prev.filter((item) => item.id !== report.id));
    if (selectedReportId === report.id) setSelectedReportId(null);
    pushToast(`Deleted report: ${report.name}`, "success");
  };

  const handleDownloadCsv = (report: GeneratedReport) => {
    const keys = report.dataset.columns.map((column) => column.key);
    const headers = report.dataset.columns.map((column) => column.label);

    const lines = [
      headers.join(","),
      ...report.dataset.rows.map((row) => keys.map((key) => csvEscape(row[key] ?? "")).join(",")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${sanitizeFilename(report.name) || "report"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    pushToast(`CSV downloaded: ${report.name}`, "success");
  };

  const handlePdfSoon = () => {
    pushToast("PDF generation coming soon", "info");
  };

  const toggleCategoryExpansion = (categoryId: SidebarCategoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleCategoryItemClick = (categoryId: SidebarCategoryId, itemName: string) => {
    setActiveCategory(categoryId);
    if (isReportType(itemName)) {
      setBuilderForm((prev) => ({ ...prev, type: itemName }));
      setIsBuilderOpen(true);
    }
  };

  const toggleScheduledStatus = (report: ScheduledReport) => {
    const nextStatus: ScheduleStatus = report.status === "Active" ? "Paused" : "Active";

    setScheduledReports((prev) =>
      prev.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );

    pushToast(`${report.name} ${nextStatus === "Active" ? "resumed" : "paused"}.`, "info");
  };

  const openScheduleFormForEdit = (report: ScheduledReport) => {
    setScheduleForm({
      id: report.id,
      name: report.name,
      type: report.type,
      frequency: report.frequency,
      recipients: report.recipients.join(", "),
      status: report.status,
    });
    setIsScheduleModalOpen(true);
  };

  const openScheduleFormForCreate = () => {
    setScheduleForm({
      ...createScheduleFormDefaults(),
      name: generatedReports[0]?.name ?? "",
      type: generatedReports[0]?.type ?? "Activity Summary",
    });
    setIsScheduleModalOpen(true);
  };

  const saveSchedule = () => {
    if (!scheduleForm.name.trim()) {
      pushToast("Scheduled report name is required.", "error");
      return;
    }

    const recipients = scheduleForm.recipients
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      pushToast("Add at least one recipient email.", "error");
      return;
    }

    if (scheduleForm.id) {
      setScheduledReports((prev) =>
        prev.map((item) =>
          item.id === scheduleForm.id
            ? {
                ...item,
                name: scheduleForm.name.trim(),
                type: scheduleForm.type,
                frequency: scheduleForm.frequency,
                nextRun: calculateNextRun(scheduleForm.frequency),
                recipients,
                status: scheduleForm.status,
              }
            : item
        )
      );

      pushToast("Schedule updated.", "success");
    } else {
      const newSchedule: ScheduledReport = {
        id: `sched-${Date.now()}`,
        name: scheduleForm.name.trim(),
        type: scheduleForm.type,
        frequency: scheduleForm.frequency,
        nextRun: calculateNextRun(scheduleForm.frequency),
        recipients,
        status: scheduleForm.status,
      };

      setScheduledReports((prev) => [newSchedule, ...prev]);
      pushToast("Scheduled report created.", "success");
    }

    setIsScheduleModalOpen(false);
    setScheduleForm(createScheduleFormDefaults());
  };

  const tabs = [
    { value: "my", label: "My Reports" },
    { value: "scheduled", label: "Scheduled" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build custom reports, use templates, and manage scheduled delivery.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Report Categories</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="text-xs text-apollo-cyan-700"
            >
              Clear
            </Button>
          </div>

          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
              activeCategory === "all"
                ? "bg-apollo-cyan-50 text-apollo-cyan-700"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span>All Reports</span>
            {activeCategory === "all" && <CheckCircle className="h-4 w-4" />}
          </button>

          <div className="space-y-2">
            {CATEGORY_GROUPS.map((group) => {
              const Icon = group.icon;
              const isExpanded = expandedCategories[group.id];
              const isActive = activeCategory === group.id;

              return (
                <div key={group.id} className="rounded-xl border border-border/70">
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveCategory(group.id)}
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-l-xl px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-apollo-cyan-50 text-apollo-cyan-700"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{group.label}</span>
                    </button>
                    <button
                      onClick={() => toggleCategoryExpansion(group.id)}
                      className="rounded-r-xl px-2 py-2 text-muted-foreground hover:bg-muted"
                      aria-label={`Toggle ${group.label} reports`}
                    >
                      {isExpanded ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-border/70"
                      >
                        <div className="space-y-1 p-2">
                          {group.items.map((item) => (
                            <button
                              key={item}
                              onClick={() => handleCategoryItemClick(group.id, item)}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <span>{item}</span>
                              {isReportType(item) && <ChartLineUp className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Report Builder</h2>
                <p className="text-xs text-muted-foreground">
                  Build a report from scratch with filters and date range.
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsBuilderOpen((prev) => !prev);
                  if (!isBuilderOpen && !builderForm.name) {
                    setBuilderForm((prev) => ({
                      ...prev,
                      name: `${prev.type} Report`,
                    }));
                  }
                }}
                variant="primary"
                className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700"
              >
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {isBuilderOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-1 md:col-span-2 xl:col-span-1">
                      <span className="text-xs font-medium text-muted-foreground">Report Name</span>
                      <input
                        type="text"
                        value={builderForm.name}
                        onChange={(event) => updateBuilderField("name", event.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                        placeholder="Enter report name"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Report Type</span>
                      <select
                        value={builderForm.type}
                        onChange={(event) => updateBuilderField("type", event.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                      >
                        {REPORT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-3 md:grid-cols-2 xl:col-span-1">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">From</span>
                        <input
                          type="date"
                          value={builderForm.fromDate}
                          onChange={(event) => updateBuilderField("fromDate", event.target.value)}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">To</span>
                        <input
                          type="date"
                          value={builderForm.toDate}
                          onChange={(event) => updateBuilderField("toDate", event.target.value)}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                        />
                      </label>
                    </div>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Driver Filter</span>
                      <select
                        value={builderForm.driverId}
                        onChange={(event) => updateBuilderField("driverId", event.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                      >
                        <option value="">All Drivers</option>
                        {mockDrivers.map((driver) => (
                          <option key={driver.id} value={driver.id.toString()}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Customer Filter</span>
                      <select
                        value={builderForm.customerId}
                        onChange={(event) => updateBuilderField("customerId", event.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                      >
                        <option value="">All Customers</option>
                        {mockCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Equipment Filter</span>
                      <select
                        value={builderForm.equipmentId}
                        onChange={(event) => updateBuilderField("equipmentId", event.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                      >
                        <option value="">All Equipment</option>
                        {EQUIPMENT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="md:col-span-2 xl:col-span-3 flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        onClick={() => setIsBuilderOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateFromBuilder}
                        className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700"
                      >
                        <ChartBar className="h-4 w-4" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Report Templates</h2>
              <div className="text-xs text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length === 1 ? "" : "s"}
              </div>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                No templates for this category.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <motion.button
                      key={template.id}
                      onClick={() => handleUseTemplate(template)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-apollo-cyan-300"
                    >
                      <div className="mb-3 inline-flex rounded-lg bg-apollo-cyan-50 p-2 text-apollo-cyan-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{template.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                          {template.type}
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-8 items-center rounded-lg border border-apollo-cyan-200 bg-background px-3 text-xs font-medium text-apollo-cyan-700",
                            "shadow-xs",
                          )}
                        >
                          Use Template
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Generated Reports List</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage generated reports and scheduled delivery from one place.
            </p>

            <Tabs tabs={tabs} value={activeTab} onValueChange={(value) => setActiveTab(value as "my" | "scheduled")}> 
              <TabsList className="mt-4 border-b border-border bg-transparent">
                <TabsTrigger value="my">My Reports</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              </TabsList>

              <TabsContent value="my" className="mt-4">
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[920px]">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Report Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Date Range</th>
                        <th className="px-3 py-2">Created At</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {filteredGeneratedReports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                            No generated reports yet for this category.
                          </td>
                        </tr>
                      ) : (
                        filteredGeneratedReports.map((report) => (
                          <tr key={report.id} className="text-sm text-foreground">
                            <td className="px-3 py-2 font-medium">{report.name}</td>
                            <td className="px-3 py-2">{report.type}</td>
                            <td className="px-3 py-2">{formatDate(report.fromDate)} - {formatDate(report.toDate)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{formatDateTime(report.createdAt)}</td>
                            <td className="px-3 py-2">
                              {report.status === "Generating" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-apollo-cyan-50 px-2 py-1 text-xs text-apollo-cyan-700">
                                  <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                                  Generating
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-apollo-cyan-100 px-2 py-1 text-xs text-apollo-cyan-700">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Ready
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={report.status !== "Ready"}
                                  onClick={() => setSelectedReportId(report.id)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={report.status !== "Ready"}
                                  onClick={() => handleDownloadCsv(report)}
                                >
                                  <DownloadSimple className="h-3.5 w-3.5" />
                                  Download CSV
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handlePdfSoon}
                                >
                                  <FilePdf className="h-3.5 w-3.5" />
                                  Download PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteReport(report)}
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="scheduled" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Configure recurring delivery to stakeholders.
                  </p>
                  <Button
                    onClick={openScheduleFormForCreate}
                    className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700"
                  >
                    <Plus className="h-4 w-4" />
                    New Scheduled Report
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[860px]">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Report Name</th>
                        <th className="px-3 py-2">Schedule</th>
                        <th className="px-3 py-2">Next Run</th>
                        <th className="px-3 py-2">Recipients</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {scheduledReports.map((report) => (
                        <tr key={report.id} className="text-sm">
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground">{report.name}</div>
                            <div className="text-xs text-muted-foreground">{report.type}</div>
                          </td>
                          <td className="px-3 py-2">{report.frequency}</td>
                          <td className="px-3 py-2">{formatDateTime(report.nextRun)}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {report.recipients.join(", ")}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-1 text-xs",
                                report.status === "Active"
                                  ? "bg-apollo-cyan-100 text-apollo-cyan-700"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {report.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleScheduledStatus(report)}
                              >
                                <ArrowsClockwise className="h-3.5 w-3.5" />
                                {report.status === "Active" ? "Pause" : "Resume"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openScheduleFormForEdit(report)}
                              >
                                <Wrench className="h-3.5 w-3.5" />
                                Edit Schedule
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>

      <Modal
        open={Boolean(selectedReport)}
        onOpenChange={(open) => {
          if (!open) setSelectedReportId(null);
        }}
        size="xl"
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <ModalTitle>{selectedReport?.name ?? "Report"}</ModalTitle>
              <ModalDescription>
                {selectedReport?.type} • {selectedReport ? `${formatDate(selectedReport.fromDate)} - ${formatDate(selectedReport.toDate)}` : ""}
              </ModalDescription>
            </div>
          </ModalHeader>

          <ModalBody>
            {selectedReport && (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Total Records</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {numberFormatter.format(selectedReport.dataset.rows.length)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Date Range</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {formatDate(selectedReport.fromDate)} - {formatDate(selectedReport.toDate)}
                    </div>
                  </div>
                  {selectedReport.dataset.summaryMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-xs text-muted-foreground">{metric.label}</div>
                      <div className="mt-1 text-lg font-semibold text-foreground">{metric.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <ChartLineUp className="h-4 w-4 text-apollo-cyan-600" />
                    Visualization
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      {selectedReport.dataset.chartType === "bar" ? (
                        <BarChart data={selectedReport.dataset.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: number) => numberFormatter.format(value)}
                            contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                          />
                          <Bar dataKey="value" fill="#0891b2" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={selectedReport.dataset.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: number) => oneDecimalFormatter.format(value)}
                            contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                          />
                          <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        {selectedReport.dataset.columns.map((column) => (
                          <th key={column.key} className="px-3 py-2">
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {selectedReport.dataset.rows.map((row, index) => (
                        <tr key={`${selectedReport.id}-${index}`} className="text-sm">
                          {selectedReport.dataset.columns.map((column) => (
                            <td key={column.key} className="px-3 py-2 text-foreground">
                              {applyCellFormat(column.key, row[column.key] ?? "-")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            {selectedReport && (
              <>
                <Button variant="outline" onClick={() => handleDownloadCsv(selectedReport)}>
                  <DownloadSimple className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button variant="outline" onClick={handlePdfSoon}>
                  <FilePdf className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="ghost" onClick={() => setSelectedReportId(null)}>
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        open={isScheduleModalOpen}
        onOpenChange={(open) => {
          setIsScheduleModalOpen(open);
          if (!open) setScheduleForm(createScheduleFormDefaults());
        }}
        size="md"
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{scheduleForm.id ? "Edit Schedule" : "New Scheduled Report"}</ModalTitle>
            <ModalDescription>
              Configure frequency and recipients for report delivery.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Report Name</span>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                  placeholder="Weekly Safety Snapshot"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Report Type</span>
                <select
                  value={scheduleForm.type}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, type: event.target.value as ReportType }))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Frequency</span>
                <select
                  value={scheduleForm.frequency}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      frequency: event.target.value as ScheduleFrequency,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Recipients (comma-separated)</span>
                <input
                  type="text"
                  value={scheduleForm.recipients}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, recipients: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-apollo-cyan-500"
                  placeholder="ops@apollotms.com, safety@apollotms.com"
                />
              </label>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Status</span>
                <button
                  onClick={() =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      status: prev.status === "Active" ? "Paused" : "Active",
                    }))
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    scheduleForm.status === "Active"
                      ? "bg-apollo-cyan-100 text-apollo-cyan-700"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {scheduleForm.status}
                </button>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSchedule} className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700">
              Save Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={cn(
                "pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg",
                toast.tone === "success" && "border-apollo-cyan-200 bg-apollo-cyan-50 text-apollo-cyan-800",
                toast.tone === "info" && "border-cyan-200 bg-cyan-50 text-cyan-800",
                toast.tone === "error" && "border-red-200 bg-red-50 text-red-700"
              )}
            >
              <div className="flex items-start gap-2">
                {toast.tone === "success" && <CheckCircle className="mt-0.5 h-4 w-4" />}
                {toast.tone === "info" && <CalendarBlank className="mt-0.5 h-4 w-4" />}
                {toast.tone === "error" && <WarningCircle className="mt-0.5 h-4 w-4" />}
                <span>{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
