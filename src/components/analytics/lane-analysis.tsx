"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Path,
  TrendUp,
  TrendDown,
  List,
  Globe,
  Truck,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { useLaneAnalysis } from "@/lib/hooks/api";
import { DateRangePicker } from "./date-range-picker";
import { ExportButton } from "./export-button";

interface LaneAnalysisProps {
  className?: string;
}

interface LaneRow {
  id: string;
  lane: string;
  loadCount: number;
  totalRevenue: number;
  totalMargin: number;
  marginPercent: number;
  averageRevenue: number;
  totalMiles: number;
  revenuePerMile: number;
  primaryCustomer: string;
  equipmentType: string;
  origin: { city: string; state: string; display: string };
  destination: { city: string; state: string; display: string };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatEquipmentType = (equipmentType: string) =>
  equipmentType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function LaneAnalysis({ className = "" }: LaneAnalysisProps) {
  const [dateRange, setDateRange] = React.useState("mtd");
  const [viewMode, setViewMode] = React.useState<"table" | "map">("table");

  const {
    data: lanesData,
    isLoading,
    error,
  } = useLaneAnalysis(dateRange, 25, 0);

  const lanes = React.useMemo(() => (lanesData?.lanes || []) as LaneRow[], [lanesData?.lanes]);
  const summary = lanesData?.summary;

  const columns = React.useMemo<Column<LaneRow>[]>(
    () => [
      {
        key: "lane",
        title: "Lane",
        sortable: true,
        filterable: true,
        width: 260,
        render: (_value, row) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{row.lane}</span>
            </div>
            <p className="text-xs text-muted-foreground">{row.primaryCustomer}</p>
          </div>
        ),
      },
      {
        key: "loadCount",
        title: "Loads",
        sortable: true,
        align: "right",
        render: (value) => <span className="font-mono">{Number(value || 0).toLocaleString()}</span>,
      },
      {
        key: "totalRevenue",
        title: "Revenue",
        sortable: true,
        align: "right",
        render: (value) => <span className="font-mono">{formatCurrency(Number(value || 0))}</span>,
      },
      {
        key: "marginPercent",
        title: "Margin %",
        sortable: true,
        align: "right",
        render: (value) => {
          const marginPercent = Number(value || 0);
          const isStrong = marginPercent >= 15;
          const isWeak = marginPercent < 8;

          return (
            <div className="flex items-center justify-end gap-1">
              {isStrong && <TrendUp className="h-3 w-3 text-apollo-cyan-600" />}
              {isWeak && <TrendDown className="h-3 w-3 text-red-500" />}
              <span
                className={`font-mono ${
                  isStrong ? "text-apollo-cyan-600" : isWeak ? "text-red-500" : "text-foreground"
                }`}
              >
                {formatPercent(marginPercent)}
              </span>
            </div>
          );
        },
      },
      {
        key: "revenuePerMile",
        title: "$/Mile",
        sortable: true,
        align: "right",
        render: (value) => <span className="font-mono">${Number(value || 0).toFixed(2)}</span>,
      },
      {
        key: "equipmentType",
        title: "Equipment",
        sortable: true,
        filterable: true,
        getFilterValue: (row) => formatEquipmentType(row.equipmentType),
        render: (value) => (
          <Badge className="border-apollo-cyan-200 bg-apollo-cyan-50 text-apollo-cyan-700">
            {formatEquipmentType(String(value || ""))}
          </Badge>
        ),
      },
    ],
    []
  );

  const topLanes = React.useMemo(() => {
    return [...lanes]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 8);
  }, [lanes]);

  const handleExport = (format: "csv" | "pdf") => {
    if (format !== "csv" || lanes.length === 0) return;

    const headers = [
      "Lane",
      "Load Count",
      "Total Revenue",
      "Total Margin",
      "Margin %",
      "Avg Revenue",
      "Total Miles",
      "Revenue/Mile",
      "Primary Customer",
      "Equipment Type",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      lanes
        .map((lane) =>
          [
            `"${lane.lane}"`,
            lane.loadCount,
            lane.totalRevenue.toFixed(2),
            lane.totalMargin.toFixed(2),
            lane.marginPercent.toFixed(1),
            lane.averageRevenue.toFixed(2),
            lane.totalMiles.toFixed(0),
            lane.revenuePerMile.toFixed(2),
            `"${lane.primaryCustomer}"`,
            lane.equipmentType,
          ].join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lane-analysis-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error && !lanesData) {
    return (
      <div className={`flex h-96 items-center justify-center text-center ${className}`}>
        <div>
          <p className="text-lg font-semibold text-foreground">Error loading lane analysis</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Lane Analysis</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance metrics for your top shipping lanes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border bg-card p-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-apollo-cyan-100 text-apollo-cyan-700 dark:bg-apollo-cyan-950 dark:text-apollo-cyan-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
              Table
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-apollo-cyan-100 text-apollo-cyan-700 dark:bg-apollo-cyan-950 dark:text-apollo-cyan-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-4 w-4" />
              Network
            </motion.button>
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </motion.div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Lanes</p>
              <Path className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold text-foreground">
              {summary.totalLanes.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <TrendUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold text-foreground">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Avg Margin</p>
              <TrendUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold text-foreground">
              {formatPercent(summary.averageMarginPercent)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Loads</p>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold text-foreground">
              {summary.totalLoads.toLocaleString()}
            </p>
          </div>
        </motion.div>
      )}

      {viewMode === "table" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          className="rounded-xl border border-border bg-card shadow-sm"
        >
          <DataTable
            data={lanes}
            columns={columns}
            loading={isLoading}
            error={error ? "Unable to load lanes" : null}
            searchPlaceholder="Search lanes, customers, equipment..."
            emptyState={{
              icon: <Path className="h-full w-full" />,
              title: "No lane performance data",
              description: "Try a wider date range or check lane activity filters.",
            }}
            defaultPageSize={8}
            defaultPageSizeOptions={[8, 16, 25]}
            className="p-4"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          {isLoading ? (
            <div className="grid h-[500px] place-items-center">
              <EmptyState
                title="Building lane network"
                description="Pulling route performance and positioning your top corridors."
                size="sm"
              />
            </div>
          ) : topLanes.length === 0 ? (
            <div className="grid h-[500px] place-items-center">
              <EmptyState
                icon={<Globe className="h-full w-full" />}
                title="No lane network data"
                description="Lane network visualization appears once active lanes are available."
                size="sm"
              />
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-[2fr_3fr]">
              <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Top Corridors
                </h3>
                <div className="mt-4 space-y-4">
                  {topLanes.map((lane) => {
                    const baseRevenue = topLanes[0]?.totalRevenue || 1;
                    const normalized = Math.max(8, Math.round((lane.totalRevenue / baseRevenue) * 100));
                    return (
                      <div key={lane.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{lane.lane}</p>
                            <p className="text-xs text-muted-foreground">{lane.primaryCustomer}</p>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatCurrency(lane.totalRevenue)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-apollo-cyan-500"
                            style={{ width: `${normalized}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative h-[500px] overflow-hidden bg-gradient-to-br from-apollo-cyan-50/70 via-background to-slate-50/60 p-6">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:22px_22px]" />
                <div className="relative z-10 h-full">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Lane Network Snapshot
                  </h3>
                  <div className="mt-5 grid gap-3">
                    {topLanes.slice(0, 6).map((lane) => (
                      <div
                        key={`network-${lane.id}`}
                        className="rounded-xl border border-border/80 bg-card/80 p-3 backdrop-blur"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {lane.origin.city}, {lane.origin.state} → {lane.destination.city}, {lane.destination.state}
                          </p>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {formatPercent(lane.marginPercent)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{lane.loadCount}</span> loads • {formatEquipmentType(lane.equipmentType)} •{" "}
                          <span className="font-mono">${lane.revenuePerMile.toFixed(2)}</span>/mile
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
