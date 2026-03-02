"use client";

import { motion } from "framer-motion";
import {
  TrendUp,
  Calendar,
  Warning,
  User,
  Receipt,
  CurrencyDollar,
  ClockCounterClockwise,
  Eye,
  Phone,
  Envelope,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useARAgingData, type ARAgingData } from "@/lib/hooks/api/use-billing";
import { cn } from "@/lib/utils";

interface ARAgingDashboardProps {
  className?: string;
}

type AgingBucketKey = "current" | "past30" | "past60" | "past90" | "past120";

const AGING_BUCKETS: Array<{
  key: AgingBucketKey;
  label: string;
  color: string;
  textColor: string;
}> = [
  { key: "current", label: "Current", color: "bg-apollo-cyan-500", textColor: "text-apollo-cyan-700" },
  { key: "past30", label: "1-30 Days", color: "bg-blue-500", textColor: "text-blue-700" },
  { key: "past60", label: "31-60 Days", color: "bg-yellow-500", textColor: "text-yellow-700" },
  { key: "past90", label: "61-90 Days", color: "bg-orange-500", textColor: "text-orange-700" },
  { key: "past120", label: "90+ Days", color: "bg-red-500", textColor: "text-red-700" },
];

export function ARAgingDashboard({ className }: ARAgingDashboardProps) {
  const { data: agingData, isLoading, error } = useARAgingData();
  type CustomerBreakdownRow = ARAgingData["customerBreakdown"][number];
  type OverdueInvoiceRow = ARAgingData["overdueInvoices"][number];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPercentage = (amount: number, total: number) => {
    return total > 0 ? ((amount / total) * 100).toFixed(1) : "0.0";
  };

  const customerColumns: Column<ARAgingData["customerBreakdown"][0]>[] = [
    {
      key: "customerName",
      title: "Customer",
      render: (value: string, row: CustomerBreakdownRow) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" weight="light" />
          <div>
            <p className="font-medium text-sm">{value}</p>
            {row.customerCode && (
              <p className="text-xs text-muted-foreground font-mono">{row.customerCode}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "invoiceCount",
      title: "Invoices",
      align: "center",
      render: (value: number) => (
        <div className="flex items-center justify-center gap-1">
          <Receipt className="size-4 text-muted-foreground" weight="light" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: "current",
      title: "Current",
      align: "right",
      render: (value: number, row: CustomerBreakdownRow) => (
        <div className="text-right">
          <span className="font-mono text-sm font-medium text-apollo-cyan-700">
            {formatCurrency(value)}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">
            {getPercentage(value, row.totalOutstanding)}%
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "past30",
      title: "1-30 Days",
      align: "right",
      render: (value: number, row: CustomerBreakdownRow) => (
        <div className="text-right">
          <span className="font-mono text-sm font-medium text-blue-700">
            {formatCurrency(value)}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">
            {getPercentage(value, row.totalOutstanding)}%
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "past60",
      title: "31-60 Days",
      align: "right",
      render: (value: number, row: CustomerBreakdownRow) => (
        <div className="text-right">
          <span className="font-mono text-sm font-medium text-yellow-700">
            {formatCurrency(value)}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">
            {getPercentage(value, row.totalOutstanding)}%
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "past90",
      title: "61-90 Days",
      align: "right",
      render: (value: number, row: CustomerBreakdownRow) => (
        <div className="text-right">
          <span className="font-mono text-sm font-medium text-orange-700">
            {formatCurrency(value)}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">
            {getPercentage(value, row.totalOutstanding)}%
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "past120",
      title: "90+ Days",
      align: "right",
      render: (value: number, row: CustomerBreakdownRow) => (
        <div className="text-right">
          <span className="font-mono text-sm font-medium text-red-700">
            {formatCurrency(value)}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">
            {getPercentage(value, row.totalOutstanding)}%
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "totalOutstanding",
      title: "Total",
      align: "right",
      render: (value: number) => (
        <span className="font-mono font-bold text-sm">
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  const overdueColumns: Column<ARAgingData["overdueInvoices"][0]>[] = [
    {
      key: "invoiceNumber",
      title: "Invoice #",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground" weight="light" />
          <span className="font-mono font-medium text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      render: (value: OverdueInvoiceRow["customer"]) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" weight="light" />
          <span className="text-sm">{value?.name}</span>
        </div>
      ),
    },
    {
      key: "dueDate",
      title: "Due Date",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" weight="light" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "daysOverdue",
      title: "Days Overdue",
      align: "center",
      render: (value: number) => {
        let color = "text-yellow-600";
        if (value > 60) color = "text-red-600";
        else if (value > 30) color = "text-orange-600";

        return (
          <div className="flex items-center justify-center gap-1">
            <Warning className={cn("size-4", color)} weight="light" />
            <span className={cn("font-mono font-medium text-sm", color)}>
              {value}
            </span>
          </div>
        );
      },
    },
    {
      key: "balanceAmount",
      title: "Balance",
      align: "right",
      render: (value: number) => (
        <span className="font-mono font-medium text-red-600">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: () => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="size-4" weight="light" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="size-4" weight="light" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Envelope className="size-4" weight="light" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !agingData) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <Warning className="size-12 text-destructive mx-auto mb-4" weight="light" />
          <p className="text-lg font-medium">Unable to load AR data</p>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AR Aging Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track accounts receivable by aging periods and manage collections
        </p>
      </div>

      {/* Aging Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {AGING_BUCKETS.map((bucket, index) => {
          const amount = agingData.summary[bucket.key];
          const percentage = getPercentage(amount, agingData.summary.totalOutstanding);

          return (
            <motion.div
              key={bucket.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {bucket.label}
                  </p>
                  <div className={cn("size-3 rounded-full", bucket.color)} />
                </div>
                <div className="space-y-1">
                  <p className={cn("text-lg font-mono font-bold", bucket.textColor)}>
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{percentage}%</span> of total
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Aging Visualization */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendUp className="size-5 text-primary" weight="light" />
          <h2 className="text-lg font-semibold">Aging Visualization</h2>
        </div>

        <div className="space-y-4">
          {/* Total Outstanding */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Outstanding:</span>
            <span className="font-mono text-xl font-bold">
              {formatCurrency(agingData.summary.totalOutstanding)}
            </span>
          </div>

          {/* Aging Bar Chart */}
          <div className="space-y-3">
            {AGING_BUCKETS.map((bucket) => {
              const amount = agingData.summary[bucket.key];
              const percentage = parseFloat(getPercentage(amount, agingData.summary.totalOutstanding));

              return (
                <div key={bucket.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{bucket.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono", bucket.textColor)}>
                        {formatCurrency(amount)}
                      </span>
                      <span className="text-muted-foreground">
                        (<span className="font-mono">{percentage}%</span>)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", bucket.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="size-5 text-primary" weight="light" />
            <h2 className="text-lg font-semibold">Customer Breakdown</h2>
          </div>

          <DataTable
            data={agingData.customerBreakdown.slice(0, 10)}
            columns={customerColumns}
            emptyMessage="No outstanding receivables"
            emptyState={{
              title: "No receivables",
              description: "There are no customer balances in the selected aging buckets.",
            }}
            className="border-none"
          />

          {agingData.customerBreakdown.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Customers ({agingData.customerBreakdown.length})
              </Button>
            </div>
          )}
        </Card>

        {/* Overdue Invoices */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Warning className="size-5 text-red-500" weight="light" />
              <h2 className="text-lg font-semibold">Overdue Invoices</h2>
            </div>
            <Badge variant="outline" className="text-red-600 border-red-200">
              {agingData.overdueInvoices.length} overdue
            </Badge>
          </div>

          <DataTable
            data={agingData.overdueInvoices}
            columns={overdueColumns}
            emptyMessage="No overdue invoices"
            emptyState={{
              title: "No overdue invoices",
              description: "All invoices are current or fully paid.",
            }}
            className="border-none"
          />
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Receipt className="size-8 text-blue-500 mx-auto mb-2" weight="light" />
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="font-mono text-xl font-bold">
            {agingData.summary.invoiceCount}
          </p>
        </Card>

        <Card className="p-4 text-center">
          <ClockCounterClockwise className="size-8 text-yellow-500 mx-auto mb-2" weight="light" />
          <p className="text-sm text-muted-foreground">Avg Days Outstanding</p>
          <p className="font-mono text-xl font-bold">
            {agingData.summary.totalOutstanding > 0
              ? Math.round((agingData.summary.past30 * 30 + agingData.summary.past60 * 60 + agingData.summary.past90 * 90 + agingData.summary.past120 * 120) / agingData.summary.totalOutstanding)
              : 0
            }
          </p>
        </Card>

        <Card className="p-4 text-center">
          <CurrencyDollar className="size-8 text-apollo-cyan-500 mx-auto mb-2" weight="light" />
          <p className="text-sm text-muted-foreground">Collection Rate</p>
          <p className="font-mono text-xl font-bold">
            {getPercentage(agingData.summary.current, agingData.summary.totalOutstanding)}%
          </p>
        </Card>
      </div>
    </div>
  );
}
