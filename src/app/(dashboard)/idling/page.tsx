"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretLeft,
  CaretRight,
  Funnel,
  ArrowUp,
  ArrowDown,
  MapPin,
  Warehouse,
  X,
  Gear,
  CaretUpDown,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TABS = ["All Events", "Drivers", "Vehicles", "Geofences"] as const;
type Tab = (typeof TABS)[number];

const idleBarData = [
  { name: "6a", inside: 0.8, outside: 0.4 },
  { name: "8a", inside: 1.2, outside: 0.6 },
  { name: "10a", inside: 0.6, outside: 0.8 },
  { name: "12p", inside: 0.9, outside: 0.5 },
  { name: "2p", inside: 0.7, outside: 0.9 },
  { name: "4p", inside: 0.5, outside: 0.3 },
];

const idlingTempData = [
  { name: "Moderate", value: 96, color: "#3b82f6" },
  { name: "Extreme", value: 4, color: "#ef4444" },
];

const idleCostBarData = [
  { name: "6a", inside: 1.8, outside: 0.9 },
  { name: "8a", inside: 2.4, outside: 1.1 },
  { name: "10a", inside: 1.2, outside: 1.4 },
  { name: "12p", inside: 1.9, outside: 0.8 },
  { name: "2p", inside: 1.5, outside: 1.2 },
  { name: "4p", inside: 0.9, outside: 0.6 },
];

const idlingEvents = [
  {
    vehicle: "1824",
    driver: "Alexi Moya",
    time: "2:34 PM",
    duration: "42m",
    address: "Century Terminals",
    isYard: true,
    airTemp: "78\u00b0F",
    pto: "Off",
    fuelUsed: "1.2 gal",
    gasUsed: "1.2 gal",
    estCost: "$4.56",
  },
  {
    vehicle: "1826",
    driver: "Jorge Garcia",
    time: "1:12 PM",
    duration: "28m",
    address: "Texas Materials Group",
    isYard: false,
    airTemp: "82\u00b0F",
    pto: "Off",
    fuelUsed: "0.8 gal",
    gasUsed: "0.8 gal",
    estCost: "$3.04",
  },
  {
    vehicle: "1824",
    driver: "Alexi Moya",
    time: "11:45 AM",
    duration: "18m",
    address: "Dallas Yard",
    isYard: true,
    airTemp: "76\u00b0F",
    pto: "On",
    fuelUsed: "0.5 gal",
    gasUsed: "0.5 gal",
    estCost: "$1.90",
  },
  {
    vehicle: "1828",
    driver: "Marcus Johnson",
    time: "10:22 AM",
    duration: "35m",
    address: "Meridian Supply Dock 4",
    isYard: false,
    airTemp: "84\u00b0F",
    pto: "Off",
    fuelUsed: "1.0 gal",
    gasUsed: "1.0 gal",
    estCost: "$3.80",
  },
  {
    vehicle: "1826",
    driver: "Jorge Garcia",
    time: "8:05 AM",
    duration: "15m",
    address: "Houston Yard",
    isYard: true,
    airTemp: "72\u00b0F",
    pto: "Off",
    fuelUsed: "0.4 gal",
    gasUsed: "0.4 gal",
    estCost: "$1.52",
  },
  {
    vehicle: "1831",
    driver: "David Thompson",
    time: "7:18 AM",
    duration: "8m",
    address: "CrossBridge Loading Bay",
    isYard: false,
    airTemp: "68\u00b0F",
    pto: "Off",
    fuelUsed: "0.2 gal",
    gasUsed: "0.2 gal",
    estCost: "$0.76",
  },
];

const driverSummary = [
  { name: "Alexi Moya", totalIdle: "1h 00m", events: 2, fuelWasted: "1.7 gal", cost: "$6.46" },
  { name: "Jorge Garcia", totalIdle: "43m", events: 2, fuelWasted: "1.2 gal", cost: "$4.56" },
  { name: "Marcus Johnson", totalIdle: "35m", events: 1, fuelWasted: "1.0 gal", cost: "$3.80" },
  { name: "David Thompson", totalIdle: "8m", events: 1, fuelWasted: "0.2 gal", cost: "$0.76" },
];

const vehicleSummary = [
  { id: "1824", totalIdle: "1h 00m", events: 2, fuelWasted: "1.7 gal", cost: "$6.46" },
  { id: "1826", totalIdle: "43m", events: 2, fuelWasted: "1.2 gal", cost: "$4.56" },
  { id: "1828", totalIdle: "35m", events: 1, fuelWasted: "1.0 gal", cost: "$3.80" },
  { id: "1831", totalIdle: "8m", events: 1, fuelWasted: "0.2 gal", cost: "$0.76" },
];

export default function IdlingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All Events");
  const [showToast, setShowToast] = useState(true);
  const [dateLabel] = useState("Today");
  const [coachedDrivers, setCoachedDrivers] = useState<Set<string>>(new Set());
  const [coachToast, setCoachToast] = useState<string | null>(null);

  const handleCoach = (driver: string) => {
    setCoachedDrivers((prev) => new Set(prev).add(driver));
    setCoachToast(driver);
    setTimeout(() => setCoachToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 top-20 z-50 w-[360px] rounded-2xl border border-border bg-card p-4 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  NEW: Idling Rules
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customize the default unproductive idling rules to match your fleet&apos;s operational needs.
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-2 shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Gear className="h-3.5 w-3.5" />
              Go to Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coach confirmation toast */}
      <AnimatePresence>
        {coachToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 top-36 z-50 w-[340px] rounded-2xl border border-primary/20 bg-card p-4 shadow-lg"
          >
            <p className="text-sm font-semibold text-foreground">Coaching Initiated</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Idle coaching session sent to {coachToast}. They will receive a notification shortly.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Idling Monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track idle time, fuel waste, and coaching opportunities across your fleet.
        </p>
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
                layoutId="idling-tab"
                className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm">
          <button className="p-0.5 text-muted-foreground hover:text-foreground">
            <CaretLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground">{dateLabel}</span>
          <button className="p-0.5 text-muted-foreground hover:text-foreground">
            <CaretRight className="h-4 w-4" />
          </button>
        </div>
        {["Tags", "Attributes", "Air Temperature", "Vehicles", "Drivers"].map(
          (filter) => (
            <button
              key={filter}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:text-foreground transition-colors"
            >
              {filter}
            </button>
          )
        )}
        <button className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:text-foreground transition-colors">
          <Funnel className="h-3.5 w-3.5" />
          More Filters
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Idle Time */}
        <motion.div
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
        >
          <h3 className="text-sm font-semibold text-foreground">Total Idle Time</h3>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-mono text-3xl font-semibold text-foreground">5h 24m</span>
            <span className="flex items-center gap-0.5 text-xs text-red-500">
              <ArrowUp className="h-3 w-3" />
              +85%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">45%</span>
            <span className="text-xs text-muted-foreground">idle time %</span>
            <span className="flex items-center gap-0.5 text-xs text-red-500">
              <ArrowUp className="h-3 w-3" />
              +50%
            </span>
          </div>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
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

        {/* Idling By Temperature */}
        <motion.div
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-foreground">Idling By Temperature</h3>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-mono text-3xl font-semibold text-foreground">96%</span>
            <span className="text-sm text-muted-foreground">moderate</span>
            <span className="flex items-center gap-0.5 text-xs text-apollo-cyan-600">
              <ArrowUp className="h-3 w-3" />
              +1%
            </span>
          </div>
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
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <h3 className="text-sm font-semibold text-foreground">Idle Cost</h3>
          <div className="mt-2 flex items-end gap-3">
            <div>
              <span className="font-mono text-3xl font-semibold text-foreground">$15.48</span>
              <span className="ml-1 text-xs text-muted-foreground">est cost</span>
            </div>
            <span className="flex items-center gap-0.5 text-xs text-apollo-cyan-600">
              <ArrowDown className="h-3 w-3" />
              -63%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">4 gal</span>
            <span className="text-xs text-muted-foreground">fuel wasted</span>
            <span className="flex items-center gap-0.5 text-xs text-red-500">
              <ArrowUp className="h-3 w-3" />
              +86%
            </span>
          </div>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
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
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "All Events" && (
          <motion.div
            key="all-events"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Idling Events Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Idling Events</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {idlingEvents.length} events today
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Driver</th>
                      <th className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Time <CaretUpDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Duration</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Address</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Air Temp</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">PTO</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuel Used</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Est. Cost</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {idlingEvents.map((event, i) => (
                      <tr key={`${event.vehicle}-${event.time}-${i}`} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">{event.vehicle}</td>
                        <td className="px-4 py-3 text-sm text-primary hover:underline cursor-pointer">{event.driver}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.time}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.duration}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {event.isYard ? (
                              <Warehouse className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-sm text-foreground">{event.address}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.airTemp}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{event.pto}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.fuelUsed}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.estCost}</td>
                        <td className="px-4 py-3">
                          {coachedDrivers.has(event.driver) ? (
                            <span className="flex items-center gap-1 rounded-lg bg-apollo-lime-400/10 px-2.5 py-1 text-xs font-medium text-apollo-lime-600">
                              Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCoach(event.driver)}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                            >
                              <PaperPlaneTilt className="h-3 w-3" />
                              Coach
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Drivers" && (
          <motion.div
            key="drivers"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Driver Idle Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Driver</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Idle</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Events</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuel Wasted</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {driverSummary.map((d) => (
                      <tr key={d.name} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{d.name}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{d.totalIdle}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{d.events}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{d.fuelWasted}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{d.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Vehicles" && (
          <motion.div
            key="vehicles"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Vehicle Idle Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Idle</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Events</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuel Wasted</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vehicleSummary.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-sm font-medium text-foreground">{v.id}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{v.totalIdle}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{v.events}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{v.fuelWasted}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{v.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Geofences" && (
          <motion.div
            key="geofences"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Geofence Idle Activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Idle time breakdown by geofenced locations.
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Dallas Yard", idle: "2h 10m", events: 8, pct: 40 },
                  { name: "Houston Yard", idle: "1h 35m", events: 6, pct: 30 },
                  { name: "Century Terminals", idle: "52m", events: 4, pct: 16 },
                  { name: "Meridian Supply", idle: "28m", events: 2, pct: 9 },
                  { name: "Other", idle: "19m", events: 3, pct: 5 },
                ].map((gf) => (
                  <div key={gf.name}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{gf.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-muted-foreground">{gf.events} events</span>
                        <span className="font-mono text-sm text-foreground">{gf.idle}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${gf.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
