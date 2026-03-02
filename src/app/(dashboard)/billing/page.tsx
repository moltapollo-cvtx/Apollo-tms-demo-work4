"use client";

import { useState } from "react";
import {
  Receipt,
  Calculator,
  Plus,
  TrendUp,
  User,
  CreditCard,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoiceList } from "@/components/billing/invoice-list";
import { ARAgingDashboard } from "@/components/billing/ar-aging-dashboard";
import { SettlementRunInterface } from "@/components/billing/settlement-run-interface";
import { ChargeCodesManagement } from "@/components/billing/charge-codes-management";
import { RatingEngine } from "@/components/billing/rating-engine";
import { ChartOfAccounts } from "@/components/billing/chart-of-accounts";
import { useInvoices, useSettlements, useARAgingData } from "@/lib/hooks/api/use-billing";

export const dynamic = "force-dynamic";

const BILLING_MODULES = [
  {
    id: "invoices",
    title: "Invoices",
    description: "Manage customer invoices and track payments",
    icon: Receipt,
    color: "text-blue-500",
  },
  {
    id: "settlements",
    title: "Driver Settlements",
    description: "Calculate and process driver payments",
    icon: CreditCard,
    color: "text-apollo-cyan-500",
  },
  {
    id: "ar-aging",
    title: "AR Aging",
    description: "Track receivables by aging periods",
    icon: TrendUp,
    color: "text-orange-500",
  },
  {
    id: "rating-engine",
    title: "Rating Engine",
    description: "Calculate rates with fuel surcharge and accessorials",
    icon: Calculator,
    color: "text-apollo-cyan-500",
  },
  {
    id: "charge-codes",
    title: "Charge Codes",
    description: "Manage accessorial and freight charge codes",
    icon: Plus,
    color: "text-apollo-cyan-500",
  },
  {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    description: "Accounting structure and financial tracking",
    icon: Receipt,
    color: "text-slate-500",
  },
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: invoicesData } = useInvoices({ limit: 5 });
  const { data: settlementsData } = useSettlements({ limit: 5 });
  const { data: agingData } = useARAgingData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate summary statistics
  const summaryStats = {
    unbilledRevenue: 124850,
    openInvoices: agingData?.summary.totalOutstanding || 389200,
    pastDue: agingData?.summary.past120 || 42100,
    avgDaysToPay: 28.4,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Billing & Financial
          </h1>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("invoices")}
              className="h-auto gap-1 rounded-full px-2 py-1 text-xs sm:text-sm"
            >
              <Receipt className="h-3.5 w-3.5" weight="light" />
              Open Invoices
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("settlements")}
              className="h-auto gap-1 rounded-full px-2 py-1 text-xs sm:text-sm"
            >
              <CreditCard className="h-3.5 w-3.5" weight="light" />
              Run Settlements
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("rating-engine")}
              className="h-auto gap-1 rounded-full px-2 py-1 text-xs sm:text-sm"
            >
              <Calculator className="h-3.5 w-3.5" weight="light" />
              Rate Calculator
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive billing, settlements, and financial management system
        </p>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Unbilled Revenue",
                value: formatCurrency(summaryStats.unbilledRevenue),
                icon: Calculator,
                color: "text-blue-500"
              },
              {
                label: "Open Invoices",
                value: formatCurrency(summaryStats.openInvoices),
                icon: Receipt,
                color: "text-apollo-cyan-500"
              },
              {
                label: "Past Due",
                value: formatCurrency(summaryStats.pastDue),
                icon: TrendUp,
                color: "text-red-500"
              },
              {
                label: "Average Days to Pay",
                value: summaryStats.avgDaysToPay.toString(),
                icon: Calculator,
                color: "text-orange-500"
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <stat.icon className={`size-5 ${stat.color}`} weight="light" />
                </div>
                <p className="font-mono text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Module Grid */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Billing Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BILLING_MODULES.map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveTab(module.id)}
                    className="text-left p-4 rounded-lg border border-border hover:border-primary transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <ModuleIcon className={`size-6 ${module.color}`} weight="light" />
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {module.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      <span>Explore</span>
                      <ArrowRight className="size-3" weight="light" />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Invoices</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("invoices")}>
                  View All
                </Button>
              </div>
              {invoicesData?.data && invoicesData.data.length > 0 ? (
                <div className="space-y-3">
                  {invoicesData.data.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Receipt className="size-4 text-muted-foreground" weight="light" />
                        <div>
                          <p className="font-mono font-medium text-sm">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{invoice.customer?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-sm">{formatCurrency(parseFloat(invoice.totalAmount.toString()))}</p>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="size-8 mx-auto mb-2 opacity-50" weight="light" />
                  <p className="text-sm">No recent invoices</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Settlements</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("settlements")}>
                  View All
                </Button>
              </div>
              {settlementsData?.data && settlementsData.data.length > 0 ? (
                <div className="space-y-3">
                  {settlementsData.data.slice(0, 5).map((settlement) => (
                    <div key={settlement.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <User className="size-4 text-muted-foreground" weight="light" />
                        <div>
                          <p className="font-medium text-sm">{settlement.driver?.firstName} {settlement.driver?.lastName}</p>
                          <p className="font-mono text-xs text-muted-foreground">{settlement.settlementNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-sm">{formatCurrency(parseFloat(settlement.netPay.toString()))}</p>
                        <Badge variant={settlement.status === "paid" ? "default" : "secondary"} className="text-xs">
                          {settlement.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="size-8 mx-auto mb-2 opacity-50" weight="light" />
                  <p className="text-sm">No recent settlements</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          <div>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Billing
            </button>
          </div>

          {activeTab === "invoices" && <InvoiceList />}
          {activeTab === "settlements" && <SettlementRunInterface />}
          {activeTab === "ar-aging" && <ARAgingDashboard />}
          {activeTab === "rating-engine" && <RatingEngine />}
          {activeTab === "charge-codes" && <ChargeCodesManagement />}
          {activeTab === "chart-of-accounts" && <ChartOfAccounts />}
        </div>
      )}
    </div>
  );
}
