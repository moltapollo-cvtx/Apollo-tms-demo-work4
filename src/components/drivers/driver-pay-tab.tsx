"use client";

import { CurrencyDollar, CreditCard, WarningCircle } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { DriverWithDetails, Settlement } from "@/types";

interface DriverPayTabProps {
  driver: DriverWithDetails;
}

const toCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const toNumber = (value: unknown) => Number(value || 0);

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const statusTone: Record<string, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-amber-200 bg-amber-100 text-amber-700",
  paid: "border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700",
  cancelled: "border-red-200 bg-red-100 text-red-700",
};

export default function DriverPayTab({ driver }: DriverPayTabProps) {
  const settlements = ([...(driver.settlements || [])] as Settlement[]).sort(
    (a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()
  );

  const totalGross = settlements.reduce((sum, settlement) => sum + toNumber(settlement.grossPay), 0);
  const totalNet = settlements.reduce((sum, settlement) => sum + toNumber(settlement.netPay), 0);
  const pendingCount = settlements.filter((settlement) => settlement.status !== "paid").length;

  const columns: Column<Settlement>[] = [
    {
      key: "settlementNumber",
      title: "Settlement #",
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{String(value || "—")}</span>,
    },
    {
      key: "periodStart",
      title: "Period",
      sortable: true,
      render: (value, row) => (
        <span className="font-mono text-sm">
          {formatDate(value as string | Date | null)} - {formatDate(row.periodEnd)}
        </span>
      ),
    },
    {
      key: "grossPay",
      title: "Gross",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono">{toCurrency(toNumber(value))}</span>,
    },
    {
      key: "deductions",
      title: "Deductions",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono text-red-600">-{toCurrency(toNumber(value))}</span>,
    },
    {
      key: "netPay",
      title: "Net",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono font-medium text-apollo-cyan-700">{toCurrency(toNumber(value))}</span>,
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      render: (value) => {
        const label = String(value || "draft");
        return <Badge className={statusTone[label] || statusTone.draft}>{label.toUpperCase()}</Badge>;
      },
    },
    {
      key: "paidAt",
      title: "Paid",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{formatDate(value as string | Date | null)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Lifetime Gross</p>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{toCurrency(totalGross)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Lifetime Net</p>
            <CreditCard className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{toCurrency(totalNet)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unpaid Settlements</p>
            <WarningCircle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{pendingCount}</p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={settlements}
          columns={columns}
          searchPlaceholder="Search settlement number or status..."
          emptyState={{
            icon: <CurrencyDollar className="h-full w-full" />,
            title: "No settlements found",
            description: "Settlement runs for this driver will appear here as they are generated.",
          }}
          defaultPageSize={6}
          defaultPageSizeOptions={[6, 12, 24]}
        />
      </Card>
    </div>
  );
}
