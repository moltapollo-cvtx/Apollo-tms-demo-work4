"use client";

import { Receipt, CurrencyDollar, ArrowUpRight, ArrowDownRight } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { Charge, OrderWithDetails } from "@/types";

interface OrderChargesTabProps {
  order: OrderWithDetails;
}

const toCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const toNumber = (value: unknown) => Number(value || 0);

export default function OrderChargesTab({ order }: OrderChargesTabProps) {
  const charges = (order.charges || []) as Charge[];

  const billableTotal = charges
    .filter((charge) => charge.billToCustomer)
    .reduce((sum, charge) => sum + toNumber(charge.amount), 0);

  const driverPayTotal = charges
    .filter((charge) => charge.payToDriver)
    .reduce((sum, charge) => sum + toNumber(charge.amount), 0);

  const columns: Column<Charge>[] = [
    {
      key: "description",
      title: "Charge",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-foreground">{String(value || "Charge")}</p>
          <p className="font-mono text-xs text-muted-foreground">GL {row.glAccount || "—"}</p>
        </div>
      ),
    },
    {
      key: "quantity",
      title: "Qty",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono">{toNumber(value).toFixed(2)}</span>,
    },
    {
      key: "rate",
      title: "Rate",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono">{toCurrency(toNumber(value))}</span>,
    },
    {
      key: "amount",
      title: "Amount",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono font-medium">{toCurrency(toNumber(value))}</span>,
    },
    {
      key: "billToCustomer",
      title: "Billing",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => (row.billToCustomer ? "Billable" : "Non-billable"),
      render: (value) =>
        value ? (
          <Badge className="border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700">Billable</Badge>
        ) : (
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Non-billable</Badge>
        ),
    },
    {
      key: "payToDriver",
      title: "Driver Pay",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => (row.payToDriver ? "Included" : "Excluded"),
      render: (value) =>
        value ? (
          <Badge className="border-sky-200 bg-sky-100 text-sky-700">Included</Badge>
        ) : (
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Excluded</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Charge Lines</p>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{charges.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Billable Total</p>
            <ArrowUpRight className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{toCurrency(billableTotal)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Driver Pay Eligible</p>
            <ArrowDownRight className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{toCurrency(driverPayTotal)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={charges}
          columns={columns}
          searchPlaceholder="Search charge descriptions, GL accounts..."
          emptyState={{
            icon: <CurrencyDollar className="h-full w-full" />,
            title: "No charge lines",
            description: "Add freight and accessorial charges to finalize billable revenue.",
          }}
          defaultPageSize={6}
          defaultPageSizeOptions={[6, 12, 24]}
        />
      </Card>
    </div>
  );
}
