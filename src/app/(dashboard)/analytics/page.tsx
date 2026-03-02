"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  ChartBar, Path, User, Buildings
} from "@phosphor-icons/react";
import { ExecutiveDashboard } from "@/components/analytics/executive-dashboard";
import { LaneAnalysis } from "@/components/analytics/lane-analysis";

const ANALYTICS_TABS = [
  {
    id: "dashboard",
    label: "Executive Dashboard",
    icon: ChartBar,
    description: "KPI overview and business metrics",
  },
  {
    id: "lanes",
    label: "Lane Analysis",
    icon: Path,
    description: "Performance by shipping lanes",
  },
  {
    id: "drivers",
    label: "Driver Performance",
    icon: User,
    description: "Driver rankings and metrics",
  },
  {
    id: "customers",
    label: "Customer Profitability",
    icon: Buildings,
    description: "Revenue vs cost by customer",
  },
];

const ROLE_ALLOWED_TABS: Record<string, string[]> = {
  admin: ["dashboard", "lanes", "drivers", "customers"],
  dispatcher: ["dashboard", "lanes", "drivers"],
  accounting: ["dashboard", "customers", "lanes"],
  driver_manager: ["dashboard", "drivers", "lanes"],
  safety: ["dashboard", "drivers", "lanes"],
  driver: ["dashboard"],
};

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const role = session?.user?.role || "admin";

  const availableTabs = React.useMemo(() => {
    const allowed = ROLE_ALLOWED_TABS[role] || ROLE_ALLOWED_TABS.admin;
    return ANALYTICS_TABS.filter((tab) => allowed.includes(tab.id));
  }, [role]);

  React.useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || "dashboard");
    }
  }, [activeTab, availableTabs]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ExecutiveDashboard />;
      case "lanes":
        return <LaneAnalysis />;
      case "drivers":
        return (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Driver Performance Snapshot</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly scorecards combining safety, on-time performance, and utilization.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { label: "Top Safety Score", value: "98.7" },
                { label: "Avg On-Time", value: "95.1%" },
                { label: "Avg Empty Miles", value: "8.6%" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "customers":
        return (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Customer Profitability Summary</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Margin and service performance for your top revenue accounts.
            </p>
            <div className="mt-4 space-y-2">
              {[
                { customer: "CrossBridge Logistics", margin: "21.4%", revenue: "$182,400" },
                { customer: "Highland Produce", margin: "18.9%", revenue: "$164,200" },
                { customer: "Northway Distribution", margin: "15.7%", revenue: "$141,600" },
              ].map((row) => (
                <div key={row.customer} className="grid grid-cols-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="truncate text-foreground">{row.customer}</span>
                  <span className="font-mono text-center text-apollo-cyan-600">{row.margin}</span>
                  <span className="font-mono text-right text-foreground">{row.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive dashboards, lane analysis, driver performance, customer profitability, and custom reports.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Active role view: <span className="font-mono uppercase tracking-wide">{role.replace("_", " ")}</span>
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        className="border-b border-border"
      >
        <nav className="-mb-px flex space-x-8" aria-label="Analytics tabs">
          {availableTabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: index * 0.05,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-apollo-cyan-500 text-apollo-cyan-600"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <tab.icon
                  className={`mr-2 h-5 w-5 transition-colors ${
                    isActive
                      ? "text-apollo-cyan-500"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {tab.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}
