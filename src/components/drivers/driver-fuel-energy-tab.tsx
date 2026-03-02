"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, CaretDown } from "@phosphor-icons/react";
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
import type { DriverWithDetails } from "@/types";

interface DriverFuelEnergyTabProps {
  driver: DriverWithDetails;
}

const TABS = ["Overview", "Driver Performance", "Benchmarks"] as const;
type Tab = (typeof TABS)[number];

// Mock data seeded slightly per driver so each profile looks unique
const seeded = (base: number, driverId: number, spread = 0.5) =>
  parseFloat((base + ((driverId % 10) - 5) * spread * 0.1).toFixed(2));

export default function DriverFuelEnergyTab({ driver }: DriverFuelEnergyTabProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showTop, setShowTop] = useState(true);

  const driverId = driver.id;
  const driverName = `${driver.firstName} ${driver.lastName}`;
  const mpg = seeded(5.6, driverId, 15);
  const effScore = 58 + (driverId % 15);
  const fuelUsed = seeded(16, driverId, 30);
  const distance = seeded(88, driverId, 200);

  const idleBarData = [
    { name: "Mon", inside: seeded(1.2, driverId + 1), outside: seeded(0.8, driverId + 2) },
    { name: "Tue", inside: seeded(0.9, driverId + 3), outside: seeded(1.1, driverId + 4) },
    { name: "Wed", inside: seeded(1.4, driverId + 5), outside: seeded(0.6, driverId + 6) },
    { name: "Thu", inside: seeded(1.0, driverId + 7), outside: seeded(0.9, driverId + 8) },
    { name: "Fri", inside: seeded(0.8, driverId + 9), outside: seeded(1.0, driverId + 10) },
  ];

  const idleCostBarData = idleBarData.map((d) => ({
    name: d.name,
    inside: parseFloat((d.inside * 3.8).toFixed(2)),
    outside: parseFloat((d.outside * 1.5).toFixed(2)),
  }));

  const idlingTempData = [
    { name: "Moderate", value: 96 - (driverId % 5), color: "#3b82f6" },
    { name: "Extreme", value: 4 + (driverId % 5), color: "#ef4444" },
  ];

  const efficiencyScoreData = [
    { name: "W1", score: effScore - 8 },
    { name: "W2", score: effScore - 6 },
    { name: "W3", score: effScore - 4 },
    { name: "W4", score: effScore - 2 },
    { name: "W5", score: effScore },
  ];

  const idleCostTotal = idleCostBarData.reduce((sum, d) => sum + d.inside + d.outside, 0);

  return (
    <div className="space-y-5">
      {/* Driver name header */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Fuel &amp; energy metrics for <span className="font-semibold text-foreground">{driverName}</span>
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId={`driver-fuel-tab-${driverId}`}
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
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="space-y-5">
            {/* Metric cards row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* Efficiency */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Fuel Efficiency</h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-semibold text-foreground">{mpg}</span>
                    <span className="text-xs text-muted-foreground">MPG</span>
                    <ArrowUp className="h-3.5 w-3.5 text-apollo-cyan-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="font-mono font-medium text-foreground">{fuelUsed} gal</p><p className="text-xs text-muted-foreground">Fuel Used</p></div>
                    <div><p className="font-mono font-medium text-foreground">{distance} mi</p><p className="text-xs text-muted-foreground">Distance</p></div>
                  </div>
                </div>
              </div>

              {/* Idle time */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Total Idle Time</h3>
                <div className="mt-2">
                  <span className="font-mono text-2xl font-semibold text-foreground">{1 + (driverId % 4)}h {(driverId * 7) % 60}m</span>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">{35 + (driverId % 15)}% idle time</p>
                </div>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Inside Yards</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400" />Outside</span>
                </div>
                <div className="mt-2 h-[50px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={idleBarData} barGap={1}>
                      <Bar dataKey="inside" stackId="a" fill="var(--color-primary, #0096C7)" />
                      <Bar dataKey="outside" stackId="a" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Idle cost */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Idle Cost</h3>
                <div className="mt-2">
                  <span className="font-mono text-2xl font-semibold text-foreground">${idleCostTotal.toFixed(2)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">est. cost</span>
                </div>
                <div className="mt-2 h-[50px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={idleCostBarData} barGap={1}>
                      <Bar dataKey="inside" stackId="a" fill="var(--color-primary, #0096C7)" />
                      <Bar dataKey="outside" stackId="a" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Efficiency score */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Efficiency Score</h3>
                <div className="mt-3 flex items-end gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">This Period</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-3xl font-semibold text-foreground">{effScore}</span>
                      <span className="flex items-center text-xs text-apollo-cyan-600"><ArrowUp className="h-3 w-3" />+8 pts</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prev</p>
                    <span className="font-mono text-lg text-muted-foreground">{effScore - 8}</span>
                  </div>
                </div>
                <div className="mt-3 h-[50px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={efficiencyScoreData}>
                      <Bar dataKey="score" fill="var(--color-primary, #0096C7)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Idling by temperature */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Idling By Temperature</h3>
                <div className="mt-3 flex items-center gap-4">
                  <div className="h-[100px] w-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={idlingTempData} innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                        {idlingTempData.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {idlingTempData.map((e) => (
                      <div key={e.name} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                        <span className="text-foreground">{e.name}</span>
                        <span className="font-mono text-muted-foreground">{e.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Weekly Driver Performance</h3>
                  <div className="flex rounded-lg bg-muted p-0.5">
                    {["Top", "Bottom"].map((m) => (
                      <button key={m} onClick={() => setShowTop(m === "Top")}
                        className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${showTop === (m === "Top") ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><span>Efficiency</span><CaretDown className="h-3 w-3" /></div>
                <div className="mt-3 space-y-2">
                  {[
                    { name: driverName, mpg, delta: seeded(0.8, driverId, 20), rank: 1 + (driverId % 5) },
                    { name: "Fleet Average", mpg: 5.6, delta: 0, rank: "—" },
                    { name: "Top Performer", mpg: seeded(7.1, driverId), delta: seeded(1.5, driverId), rank: 1 },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{row.rank}</span>
                        <span className="text-foreground">{row.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-foreground">{row.mpg}</span>
                        {typeof row.delta === "number" && row.delta !== 0 && (
                          <span className={`flex items-center text-xs ${row.delta > 0 ? "text-apollo-cyan-600" : "text-red-500"}`}>
                            {row.delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {Math.abs(row.delta).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Driver Performance" && (
          <motion.div key="driver-perf" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5">
                <h3 className="text-base font-semibold text-foreground">{driverName} — Fuel Efficiency Detail</h3>
                <p className="mt-1 text-sm text-muted-foreground">Weekly MPG performance breakdown.</p>
              </div>
              <div className="divide-y divide-border">
                <div className="grid grid-cols-4 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Week</span><span>MPG</span><span>Miles</span><span>Fuel Used</span>
                </div>
                {efficiencyScoreData.map((w) => (
                  <div key={w.name} className="grid grid-cols-4 gap-4 px-5 py-3 text-sm">
                    <span className="font-mono text-muted-foreground">{w.name}</span>
                    <span className="font-mono text-foreground">{seeded(mpg, driverId + w.score, 5)}</span>
                    <span className="font-mono text-foreground">{(seeded(distance, driverId + w.score, 100)).toFixed(0)}</span>
                    <span className="font-mono text-foreground">{seeded(fuelUsed, driverId + w.score, 20)} gal</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Benchmarks" && (
          <motion.div key="benchmarks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">{driverName} vs Fleet</h3>
                <p className="mt-1 text-sm text-muted-foreground">How this driver compares to fleet and industry averages.</p>
                <div className="mt-6 space-y-4">
                  {[
                    { metric: "Avg MPG", yours: mpg, fleet: 5.6, industry: 5.2 },
                    { metric: "Idle %", yours: 35 + (driverId % 15), fleet: 45, industry: 52 },
                    { metric: "Fuel Cost / Mile", yours: parseFloat((3.8 / mpg).toFixed(2)), fleet: 0.68, industry: 0.74 },
                  ].map((item) => (
                    <div key={item.metric}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.metric}</span>
                        <div className="flex gap-4">
                          <span className="font-mono text-primary">{item.yours}</span>
                          <span className="font-mono text-muted-foreground">{item.fleet} fleet</span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${(Number(item.yours) / (Number(item.yours) + item.industry)) * 100}%` }} />
                        <div className="h-2 rounded-full bg-muted-foreground/20" style={{ width: `${(item.industry / (Number(item.yours) + item.industry)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> {driver.firstName}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/20" /> Industry Avg</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Efficiency Trend</h3>
                <p className="mt-1 text-sm text-muted-foreground">5-week rolling MPG for {driver.firstName}.</p>
                <div className="mt-6 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={efficiencyScoreData.map((d) => ({ week: d.name, mpg: seeded(mpg, driverId + d.score, 3) }))}>
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#71717a" />
                      <YAxis domain={[4.5, 8]} tick={{ fontSize: 10 }} stroke="#71717a" />
                      <ReTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 12 }} />
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
