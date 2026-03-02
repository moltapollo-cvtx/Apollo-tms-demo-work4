"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SquaresFour,
  TrendUp,
  Truck,
  Clock,
  ArrowRight,
  Warning,
  Siren,
  UserCircleMinus,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface DashboardData {
  activeLoads: number;
  revenue: number;
  trucksInService: { active: number; total: number };
  onTimeDelivery: number;
  needsAttention: { overdue: number; urgent: number; unassigned: number };
  recentActivity: {
    orderId: number;
    orderNumber: string;
    text: string;
    updatedAt: string;
  }[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json: { success: boolean; data: DashboardData }) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error);
  }, []);

  const kpis = data
    ? [
        {
          label: "Active Loads",
          value: String(data.activeLoads),
          icon: SquaresFour,
          change: `${data.activeLoads} loads`,
        },
        {
          label: "Revenue (All)",
          value: formatCurrency(data.revenue),
          icon: TrendUp,
          change: `${data.recentActivity.length} recent`,
        },
        {
          label: "Trucks in Service",
          value: `${data.trucksInService.active}/${data.trucksInService.total}`,
          icon: Truck,
          change: `${data.trucksInService.total > 0 ? ((data.trucksInService.active / data.trucksInService.total) * 100).toFixed(1) : 0}%`,
        },
        {
          label: "On-Time Delivery",
          value: `${data.onTimeDelivery}%`,
          icon: Clock,
          change: "of delivered",
        },
      ]
    : [
        { label: "Active Loads", value: "—", icon: SquaresFour, change: "Loading..." },
        { label: "Revenue (All)", value: "—", icon: TrendUp, change: "Loading..." },
        { label: "Trucks in Service", value: "—", icon: Truck, change: "Loading..." },
        { label: "On-Time Delivery", value: "—", icon: Clock, change: "Loading..." },
      ];

  const needsAttention = data?.needsAttention;
  const attentionTotal = needsAttention
    ? needsAttention.overdue + needsAttention.urgent + needsAttention.unassigned
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your fleet operations, revenue, and key performance metrics.
        </p>
      </div>

      {/* KPI cards with staggered animation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.1,
            }}
            whileHover={{
              scale: 1.02,
              transition: { type: "spring", stiffness: 420, damping: 28 },
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-apollo-cyan-600">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Needs Attention card */}
      {needsAttention && attentionTotal > 0 && (
        <motion.div
          className="rounded-xl border border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30 p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.45 }}
        >
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <Warning className="h-4 w-4" weight="bold" />
            Needs Attention
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Overdue", count: needsAttention.overdue, icon: Warning, href: "/orders?status=overdue" },
              { label: "Urgent", count: needsAttention.urgent, icon: Siren, href: "/orders?priority=urgent" },
              { label: "Unassigned", count: needsAttention.unassigned, icon: UserCircleMinus, href: "/orders?status=available" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-red-950/40 px-4 py-3 transition-colors hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/60"
              >
                <item.icon className="h-5 w-5 text-red-500" weight="bold" />
                <div>
                  <p className="font-mono text-xl font-semibold text-red-700 dark:text-red-400">
                    {item.count}
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/70">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main content cards with staggered animation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          className="col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.5,
          }}
        >
          <h2 className="text-base font-semibold text-foreground">
            Revenue Trend
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly revenue for the current quarter
          </p>
          <div className="mt-6 h-[200px] rounded-lg bg-muted/40 p-4">
            <div className="flex h-full items-end justify-between gap-2">
              {[
                { week: "W1", value: 0.58 },
                { week: "W2", value: 0.74 },
                { week: "W3", value: 0.67 },
                { week: "W4", value: 0.83 },
                { week: "W5", value: 0.91 },
                { week: "W6", value: 0.88 },
              ].map((point) => (
                <div key={point.week} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-apollo-cyan-500/80"
                    style={{ height: `${Math.round(point.value * 100)}%` }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{point.week}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.6,
          }}
        >
          <h2 className="text-base font-semibold text-foreground">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest dispatch actions and alerts
          </p>
          <div className="mt-6 space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((item) => (
                <Link
                  key={item.orderId}
                  href={`/orders/${item.orderId}`}
                  className="group flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-foreground transition-colors hover:border-primary/30 hover:bg-accent/5"
                >
                  <span>{item.text}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))
            ) : (
              [
                { text: "Loading recent activity...", href: "#" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="rounded-md border border-border bg-card px-3 py-2 text-muted-foreground"
                >
                  {item.text}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Load Lifecycle Flow</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep operations moving from order intake through billing without context switching.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            { label: "Order Entry", href: "/orders", detail: "Capture load details" },
            { label: "Dispatch", href: "/dispatch", detail: "Assign driver and equipment" },
            { label: "Tracking", href: "/dispatch", detail: "Monitor live movement" },
            { label: "Delivery", href: "/documents", detail: "Collect POD and docs" },
            { label: "Invoice", href: "/billing/invoices/generate", detail: "Generate customer billing" },
          ].map((step, index, allSteps) => (
            <div key={step.label} className="flex items-center gap-2">
              <Link
                href={step.href}
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</p>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </Link>
              {index < allSteps.length - 1 && <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
