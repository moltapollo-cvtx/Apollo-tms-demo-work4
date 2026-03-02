"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  CaretDown,
  X,
  Gear,
  CreditCard,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TABS = ["Overview", "Driver Performance", "Benchmarks"] as const;
type Tab = (typeof TABS)[number];

const driverPerformanceData = [
  { name: "Marcus Johnson", vehicle: "1824", mpg: 7.2, delta: +1.6, rank: 1 },
  { name: "Elena Rodriguez", vehicle: "1826", mpg: 6.9, delta: +1.3, rank: 2 },
  { name: "David Thompson", vehicle: "1831", mpg: 6.5, delta: +0.9, rank: 3 },
  { name: "Sarah Williams", vehicle: "1828", mpg: 6.1, delta: +0.5, rank: 4 },
  { name: "Michael Chen", vehicle: "1830", mpg: 5.8, delta: +0.2, rank: 5 },
  { name: "James Wilson", vehicle: "1827", mpg: 4.9, delta: -0.7, rank: 16 },
  { name: "Linda Martinez", vehicle: "1825", mpg: 4.6, delta: -1.0, rank: 17 },
  { name: "Robert Davis", vehicle: "1829", mpg: 4.3, delta: -1.3, rank: 18 },
];

const idleBarData = [
  { name: "Mon", inside: 1.2, outside: 0.8 },
  { name: "Tue", inside: 0.9, outside: 1.1 },
  { name: "Wed", inside: 1.4, outside: 0.6 },
  { name: "Thu", inside: 1.0, outside: 0.9 },
  { name: "Fri", inside: 0.8, outside: 1.0 },
];

const idlingTempData = [
  { name: "Moderate", value: 96, color: "#3b82f6" },
  { name: "Extreme", value: 4, color: "#ef4444" },
];

const idleCostBarData = [
  { name: "Mon", inside: 2.8, outside: 1.2 },
  { name: "Tue", inside: 3.1, outside: 0.9 },
  { name: "Wed", inside: 2.4, outside: 1.5 },
  { name: "Thu", inside: 2.9, outside: 1.1 },
  { name: "Fri", inside: 2.2, outside: 1.4 },
];

const efficiencyScoreData = [
  { name: "W1", score: 58 },
  { name: "W2", score: 60 },
  { name: "W3", score: 62 },
  { name: "W4", score: 64 },
  { name: "W5", score: 66 },
];

const tagPerformanceData = [
  { tag: "Flatbed Fleet", mpg: 6.1, vehicles: 8 },
  { tag: "Reefer Fleet", mpg: 5.4, vehicles: 6 },
  { tag: "Dry Van", mpg: 6.3, vehicles: 10 },
  { tag: "Regional", mpg: 5.9, vehicles: 5 },
];

export default function FuelEnergyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showBanner, setShowBanner] = useState(true);
  const [showTop, setShowTop] = useState(true);
  const [viewMode, setViewMode] = useState<"Drivers" | "Vehicles">("Drivers");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Fuel & Energy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor fuel consumption, driver efficiency, and fleet energy usage.
        </p>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        {(["Drivers", "Vehicles"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="fuel-tab"
                className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            {/* Setup Banner */}
            <AnimatePresence>
              {showBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl border border-apollo-cyan-500/20 bg-apollo-cyan-500/5 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Set up and save
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Complete these steps to get the most out of Fuel & Energy.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Gear className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Customize idling settings
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Set thresholds for idle time alerts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Integrate fuel cards
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Connect fuel card providers for automatic tracking
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 5-column card grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {/* To-do card */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-500/10 p-1.5">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">To-do</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Integrate fuel cards for automatic fuel purchase tracking and cost analysis.
                </p>
                <button className="mt-3 text-sm font-medium text-primary hover:underline">
                  Set up fuel cards
                </button>
              </motion.div>

              {/* Driver Performance card */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Driver Performance</h3>
                  <div className="flex rounded-lg bg-muted p-0.5">
                    <button
                      onClick={() => setShowTop(true)}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                        showTop ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Top
                    </button>
                    <button
                      onClick={() => setShowTop(false)}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                        !showTop ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Bottom
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Efficiency</span>
                  <CaretDown className="h-3 w-3" />
                </div>
                <div className="mt-3 space-y-2">
                  {(showTop
                    ? driverPerformanceData.slice(0, 4)
                    : driverPerformanceData.slice(4)
                  ).map((driver) => (
                    <div
                      key={driver.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{driver.rank}
                        </span>
                        <span className="text-foreground truncate max-w-[100px]">
                          {driver.name.split(" ")[0]} {driver.name.split(" ")[1][0]}.
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-foreground">
                          {driver.mpg}
                        </span>
                        <span
                          className={`flex items-center text-xs ${
                            driver.delta > 0 ? "text-apollo-cyan-600" : "text-red-500"
                          }`}
                        >
                          {driver.delta > 0 ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {Math.abs(driver.delta).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Driver Performance by Tag */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
              >
                <h3 className="text-sm font-semibold text-foreground">Performance by Tag</h3>
                <p className="mt-1 text-xs text-muted-foreground">Fleet-level grouping</p>
                <div className="mt-3 space-y-2.5">
                  {tagPerformanceData.map((tag) => (
                    <div key={tag.tag}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{tag.tag}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {tag.mpg} MPG
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(tag.mpg / 7) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Efficiency card */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
              >
                <h3 className="text-sm font-semibold text-foreground">Efficiency</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-semibold text-foreground">5.6</span>
                      <span className="text-xs text-muted-foreground">MPG</span>
                      <ArrowUp className="h-3.5 w-3.5 text-apollo-cyan-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">16 gal</p>
                      <p className="text-xs text-muted-foreground">Fuel Used</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">--</p>
                      <p className="text-xs text-muted-foreground">Energy Used</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">16 gal</p>
                      <p className="text-xs text-muted-foreground">Gas Used</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">88 mi</p>
                      <p className="text-xs text-muted-foreground">Distance</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Total Idle Time card */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.25 }}
              >
                <h3 className="text-sm font-semibold text-foreground">Total Idle Time</h3>
                <div className="mt-2">
                  <span className="font-mono text-2xl font-semibold text-foreground">5h 24m</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">45%</span> idle time
                  </p>
                </div>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Inside Yards
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    Outside Yards
                  </span>
                </div>
                <div className="mt-2 h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={idleBarData} barGap={1}>
                      <Bar dataKey="inside" stackId="a" fill="var(--color-primary, #0096C7)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="outside" stackId="a" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* 3-column bottom row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Idling By Temperature */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
              >
                <h3 className="text-sm font-semibold text-foreground">Idling By Temperature</h3>
                <div className="mt-3 flex items-center gap-4">
                  <div className="h-[100px] w-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={idlingTempData}
                          innerRadius={30}
                          outerRadius={45}
                          dataKey="value"
                          stroke="none"
                        >
                          {idlingTempData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-foreground">Moderate</span>
                      <span className="font-mono text-muted-foreground">96%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-foreground">Extreme</span>
                      <span className="font-mono text-muted-foreground">4%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Idle Cost */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.35 }}
              >
                <h3 className="text-sm font-semibold text-foreground">Idle Cost</h3>
                <div className="mt-2">
                  <span className="font-mono text-2xl font-semibold text-foreground">$15.48</span>
                  <span className="ml-1 text-xs text-muted-foreground">est cost</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-mono">4 gal</span> fuel wasted
                </p>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Inside Yards
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    Outside Yards
                  </span>
                </div>
                <div className="mt-2 h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={idleCostBarData} barGap={1}>
                      <Bar dataKey="inside" stackId="a" fill="var(--color-primary, #0096C7)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="outside" stackId="a" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Driver Efficiency Score */}
              <motion.div
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.4 }}
              >
                <h3 className="text-sm font-semibold text-foreground">Driver Efficiency Score</h3>
                <div className="mt-3 flex items-end gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">This Period</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-3xl font-semibold text-foreground">66</span>
                      <span className="flex items-center text-xs text-apollo-cyan-600">
                        <ArrowUp className="h-3 w-3" />
                        +8 pts
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <span className="font-mono text-lg text-muted-foreground">58</span>
                  </div>
                </div>
                <div className="mt-3 h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={efficiencyScoreData}>
                      <Bar dataKey="score" fill="var(--color-primary, #0096C7)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === "Driver Performance" && (
          <motion.div
            key="driver-perf"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5">
                <h3 className="text-base font-semibold text-foreground">
                  All Drivers - Fuel Efficiency
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ranked by MPG performance this period.
                </p>
              </div>
              <div className="divide-y divide-border">
                <div className="grid grid-cols-5 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Rank</span>
                  <span>Driver</span>
                  <span>Vehicle</span>
                  <span className="text-right">MPG</span>
                  <span className="text-right">Delta</span>
                </div>
                {driverPerformanceData.map((driver) => (
                  <div
                    key={driver.name}
                    className="grid grid-cols-5 gap-4 px-5 py-3 text-sm"
                  >
                    <span className="font-mono text-muted-foreground">#{driver.rank}</span>
                    <span className="text-foreground">{driver.name}</span>
                    <span className="font-mono text-muted-foreground">{driver.vehicle}</span>
                    <span className="text-right font-mono text-foreground">{driver.mpg}</span>
                    <span
                      className={`flex items-center justify-end gap-1 text-right ${
                        driver.delta > 0 ? "text-apollo-cyan-600" : "text-red-500"
                      }`}
                    >
                      {driver.delta > 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {Math.abs(driver.delta).toFixed(1)} MPG
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Benchmarks" && (
          <motion.div
            key="benchmarks"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Fleet vs Industry</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  How your fleet compares to industry averages.
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    { metric: "Avg MPG", yours: 5.6, industry: 5.2 },
                    { metric: "Idle %", yours: 45, industry: 52 },
                    { metric: "Fuel Cost / Mile", yours: 0.68, industry: 0.74 },
                  ].map((item) => (
                    <div key={item.metric}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.metric}</span>
                        <div className="flex gap-4">
                          <span className="font-mono text-primary">{item.yours}</span>
                          <span className="font-mono text-muted-foreground">{item.industry}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(item.yours / (item.yours + item.industry)) * 100}%` }}
                        />
                        <div
                          className="h-2 rounded-full bg-muted-foreground/20"
                          style={{ width: `${(item.industry / (item.yours + item.industry)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Your Fleet
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/20" /> Industry Avg
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Efficiency Trend</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  12-week rolling fleet MPG average.
                </p>
                <div className="mt-6 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { week: "W1", mpg: 5.1 },
                        { week: "W2", mpg: 5.0 },
                        { week: "W3", mpg: 5.2 },
                        { week: "W4", mpg: 5.3 },
                        { week: "W5", mpg: 5.1 },
                        { week: "W6", mpg: 5.4 },
                        { week: "W7", mpg: 5.3 },
                        { week: "W8", mpg: 5.5 },
                        { week: "W9", mpg: 5.4 },
                        { week: "W10", mpg: 5.6 },
                        { week: "W11", mpg: 5.5 },
                        { week: "W12", mpg: 5.6 },
                      ]}
                    >
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#71717a" />
                      <YAxis domain={[4.5, 6]} tick={{ fontSize: 10 }} stroke="#71717a" />
                      <ReTooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="mpg" fill="var(--color-primary, #0096C7)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
