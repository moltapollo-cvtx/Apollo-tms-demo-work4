"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, MapPin, Warehouse, PaperPlaneTilt } from "@phosphor-icons/react";
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { DriverWithDetails } from "@/types";

interface DriverIdlingTabProps {
  driver: DriverWithDetails;
}

const TABS = ["Events", "Summary", "Geofences"] as const;
type Tab = (typeof TABS)[number];

export default function DriverIdlingTab({ driver }: DriverIdlingTabProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Events");
  const [coachedEvents, setCoachedEvents] = useState<Set<number>>(new Set());

  const driverId = driver.id;
  const driverName = `${driver.firstName} ${driver.lastName}`;

  // Generate deterministic mock idling data for this driver
  const events = [
    { id: driverId * 100 + 1, vehicle: `18${20 + (driverId % 12)}`, time: "2:34 PM", duration: `${28 + (driverId % 30)}m`, address: "Dallas Yard", isYard: true, airTemp: `${72 + (driverId % 15)}°F`, pto: "Off", fuelUsed: `${(0.8 + (driverId % 5) * 0.1).toFixed(1)} gal`, estCost: `$${(2.5 + (driverId % 5) * 0.4).toFixed(2)}` },
    { id: driverId * 100 + 2, vehicle: `18${20 + (driverId % 12)}`, time: "11:12 AM", duration: `${10 + (driverId % 20)}m`, address: "Meridian Supply Dock", isYard: false, airTemp: `${78 + (driverId % 10)}°F`, pto: "Off", fuelUsed: `${(0.3 + (driverId % 3) * 0.1).toFixed(1)} gal`, estCost: `$${(1.0 + (driverId % 3) * 0.3).toFixed(2)}` },
    { id: driverId * 100 + 3, vehicle: `18${20 + (driverId % 12)}`, time: "8:05 AM", duration: `${5 + (driverId % 10)}m`, address: "Houston Yard", isYard: true, airTemp: `${68 + (driverId % 8)}°F`, pto: "On", fuelUsed: `${(0.2 + (driverId % 2) * 0.1).toFixed(1)} gal`, estCost: `$${(0.7 + (driverId % 2) * 0.2).toFixed(2)}` },
  ];

  const idleBarData = [
    { name: "6a", inside: 0.8 + (driverId % 3) * 0.1, outside: 0.4 },
    { name: "8a", inside: 1.2 - (driverId % 2) * 0.1, outside: 0.6 },
    { name: "10a", inside: 0.6, outside: 0.8 + (driverId % 2) * 0.2 },
    { name: "12p", inside: 0.9, outside: 0.5 },
    { name: "2p", inside: 0.7 + (driverId % 4) * 0.1, outside: 0.9 },
    { name: "4p", inside: 0.5, outside: 0.3 },
  ];

  const idlingTempData = [
    { name: "Moderate", value: 94 + (driverId % 5), color: "#3b82f6" },
    { name: "Extreme", value: 6 - (driverId % 5), color: "#ef4444" },
  ];

  const totalIdleHours = events.reduce((sum, e) => sum + parseInt(e.duration), 0);
  const totalCost = events.reduce((sum, e) => sum + parseFloat(e.estCost.replace("$", "")), 0);
  const totalFuel = events.reduce((sum, e) => sum + parseFloat(e.fuelUsed), 0);

  const coach = (id: number) => setCoachedEvents((prev) => new Set(prev).add(id));

  return (
    <div className="space-y-5">
      {/* Driver context */}
      <p className="text-sm text-muted-foreground">
        Idling activity for <span className="font-semibold text-foreground">{driverName}</span>
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId={`driver-idling-tab-${driverId}`}
                className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Total Idle Time</h3>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-mono text-3xl font-semibold text-foreground">{Math.floor(totalIdleHours / 60)}h {totalIdleHours % 60}m</span>
            <span className="flex items-center gap-0.5 text-xs text-red-500"><ArrowUp className="h-3 w-3" />Today</span>
          </div>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Inside</span>
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

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Idling By Temperature</h3>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-mono text-3xl font-semibold text-foreground">{idlingTempData[0].value}%</span>
            <span className="text-sm text-muted-foreground">moderate</span>
            <span className="flex items-center gap-0.5 text-xs text-apollo-cyan-600"><ArrowUp className="h-3 w-3" />+1%</span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="h-[90px] w-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={idlingTempData} innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
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

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Idle Cost</h3>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-mono text-3xl font-semibold text-foreground">${totalCost.toFixed(2)}</span>
            <span className="flex items-center gap-0.5 text-xs text-apollo-cyan-600"><ArrowDown className="h-3 w-3" />est cost</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{totalFuel.toFixed(1)} gal</span>
            <span className="text-xs text-muted-foreground">fuel wasted</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{events.length} idle events today</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Events" && (
          <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Idling Events — {driverName}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{events.length} events today</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Vehicle", "Time", "Duration", "Address", "Air Temp", "PTO", "Fuel Used", "Est. Cost", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">{event.vehicle}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.time}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.duration}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {event.isYard ? <Warehouse className="h-3.5 w-3.5 text-primary" /> : <MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
                            <span className="text-sm text-foreground">{event.address}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.airTemp}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{event.pto}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.fuelUsed}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{event.estCost}</td>
                        <td className="px-4 py-3">
                          {coachedEvents.has(event.id) ? (
                            <span className="flex items-center gap-1 rounded-lg bg-apollo-lime-400/10 px-2.5 py-1 text-xs font-medium text-apollo-lime-600">Sent</span>
                          ) : (
                            <button onClick={() => coach(event.id)}
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

        {activeTab === "Summary" && (
          <motion.div key="summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">{driverName} — Idle Summary</h3>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Total idle events", value: events.length.toString() },
                  { label: "Total idle time", value: `${Math.floor(totalIdleHours / 60)}h ${totalIdleHours % 60}m` },
                  { label: "Fuel wasted", value: `${totalFuel.toFixed(1)} gal` },
                  { label: "Estimated cost", value: `$${totalCost.toFixed(2)}` },
                  { label: "Events inside yard", value: events.filter((e) => e.isYard).length.toString() },
                  { label: "Events outside yard", value: events.filter((e) => !e.isYard).length.toString() },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Geofences" && (
          <motion.div key="geofences" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">{driverName} — Idle by Location</h3>
              <p className="mt-1 text-sm text-muted-foreground">Idle time breakdown by geofenced locations.</p>
              <div className="mt-4 space-y-3">
                {events.map((e) => (
                  <div key={e.id}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {e.isYard ? <Warehouse className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-foreground">{e.address}</span>
                      </div>
                      <span className="font-mono text-sm text-foreground">{e.duration}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, parseInt(e.duration) * 2)}%` }} />
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
