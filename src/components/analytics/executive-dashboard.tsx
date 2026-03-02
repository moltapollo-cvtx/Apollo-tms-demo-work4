"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";
import { useKpis } from "@/lib/hooks/api";
import { KpiCard } from "./kpi-card";
import { DateRangePicker } from "./date-range-picker";
import { ExportButton } from "./export-button";

interface ExecutiveDashboardProps {
  className?: string;
}

interface KPIRecord {
  label: string;
  value: number;
  format: "currency" | "percentage" | "number";
  trend: number;
  sparklineData: { date: string; value: number }[];
}

const ROLE_SUMMARY: Record<string, string> = {
  admin: "Full-fleet financial, operations, utilization, and AR visibility.",
  dispatcher: "Load flow, on-time performance, and utilization focus.",
  accounting: "Revenue quality, margin health, and receivables focus.",
  driver_manager: "Driver productivity and tractor/week revenue focus.",
  safety: "Operational consistency and on-time execution focus.",
};

const BENTO_LAYOUT = [
  "md:col-span-6 xl:col-span-8 xl:row-span-2",
  "md:col-span-3 xl:col-span-4",
  "md:col-span-3 xl:col-span-4",
  "md:col-span-3 xl:col-span-4",
  "md:col-span-3 xl:col-span-4",
  "md:col-span-6 xl:col-span-8",
  "md:col-span-3 xl:col-span-4",
  "md:col-span-3 xl:col-span-4",
];

const escapeCsvValue = (value: string | number) => {
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export function ExecutiveDashboard({ className = "" }: ExecutiveDashboardProps) {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = React.useState("mtd");

  const {
    data: kpisData,
    isLoading,
    error,
  } = useKpis(dateRange, session?.user?.role);

  const handleExport = (format: "csv" | "pdf") => {
    if (format !== "csv") return;

    const rows = Object.values((kpisData?.kpis || {}) as Record<string, KPIRecord>);
    if (rows.length === 0) return;

    const headers = ["KPI", "Value", "Trend %"];
    const lines = rows.map((kpi) =>
      [escapeCsvValue(kpi.label), escapeCsvValue(kpi.value), escapeCsvValue(kpi.trend)].join(",")
    );
    const csvContent = `data:text/csv;charset=utf-8,${headers.join(",")}\n${lines.join("\n")}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kpis-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className={`flex h-96 items-center justify-center ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-96 items-center justify-center text-center ${className}`}>
        <div>
          <p className="text-lg font-semibold text-foreground">Error loading dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  const kpis = (kpisData?.kpis || {}) as Record<string, KPIRecord>;
  const kpiEntries = Object.entries(kpis).sort(([_keyA, a], [_keyB, b]) => {
    const weight = (kpi: KPIRecord) =>
      kpi.format === "currency" ? 3 : kpi.format === "percentage" ? 2 : 1;
    return weight(b) - weight(a);
  });
  const roleKey = kpisData?.role || session?.user?.role || "admin";
  const roleSummary = ROLE_SUMMARY[roleKey] || ROLE_SUMMARY.admin;
  const roleDisplay = roleKey.replace("_", " ");
  const getGridItemClass = (index: number) => BENTO_LAYOUT[index % BENTO_LAYOUT.length];

  return (
    <div className={className}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Key performance indicators and business metrics for{" "}
            {kpisData?.dateRange?.type === "mtd" ? "this month" :
             kpisData?.dateRange?.type === "ytd" ? "this year" :
             kpisData?.dateRange?.type === "weekly" ? "the past 7 days" :
             "today"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </motion.div>

      {/* Bento Grid - Asymmetric Layout */}
      <div className="grid grid-cols-1 auto-rows-[minmax(190px,auto)] gap-4 md:grid-cols-6 xl:grid-cols-12 lg:gap-6">
        {kpiEntries.map(([key, kpi], index) => (
          <KpiCard
            key={key}
            label={kpi.label}
            value={kpi.value}
            format={kpi.format}
            trend={kpi.trend}
            sparklineData={kpi.sparklineData || []}
            className={getGridItemClass(index)}
            delay={index}
          />
        ))}
      </div>

      {/* Additional Dashboard Info */}
      {kpisData?.role && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.5,
          }}
          className="mt-8 rounded-xl border border-border bg-card/50 p-4"
        >
          <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
            <span className="text-muted-foreground">
              Dashboard customized for: <strong className="text-foreground capitalize">{roleDisplay}</strong>
            </span>
            <span className="text-muted-foreground font-mono">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{roleSummary}</p>
        </motion.div>
      )}
    </div>
  );
}
