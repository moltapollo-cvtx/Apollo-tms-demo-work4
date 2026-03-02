"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  MagnifyingGlass,
  CaretUpDown,
  ArrowSquareOut,
} from "@phosphor-icons/react";

const TABS = [
  { id: "jurisdiction", label: "Jurisdiction" },
  { id: "vehicle", label: "Vehicle" },
  { id: "troubleshooting", label: "Troubleshooting", count: 3 },
] as const;
type TabId = (typeof TABS)[number]["id"];

const jurisdictionDataByMonth: Record<string, { code: string; name: string; taxableMiles: number; totalMiles: number; taxPaidGallons: number }[]> = {
  "Jan 2026": [
    { code: "AR", name: "Arkansas", taxableMiles: 216.7, totalMiles: 216.7, taxPaidGallons: 0 },
    { code: "LA", name: "Louisiana", taxableMiles: 2545.6, totalMiles: 2545.6, taxPaidGallons: 0 },
    { code: "TX", name: "Texas", taxableMiles: 62462.8, totalMiles: 62462.8, taxPaidGallons: 0 },
  ],
  "Feb 2026": [
    { code: "AR", name: "Arkansas", taxableMiles: 185.3, totalMiles: 185.3, taxPaidGallons: 0 },
    { code: "LA", name: "Louisiana", taxableMiles: 2180.4, totalMiles: 2180.4, taxPaidGallons: 0 },
    { code: "OK", name: "Oklahoma", taxableMiles: 412.9, totalMiles: 412.9, taxPaidGallons: 0 },
    { code: "TX", name: "Texas", taxableMiles: 57435.2, totalMiles: 57435.2, taxPaidGallons: 0 },
  ],
  "Mar 2026": [
    { code: "AR", name: "Arkansas", taxableMiles: 298.1, totalMiles: 298.1, taxPaidGallons: 0 },
    { code: "LA", name: "Louisiana", taxableMiles: 3102.8, totalMiles: 3102.8, taxPaidGallons: 0 },
    { code: "NM", name: "New Mexico", taxableMiles: 645.2, totalMiles: 645.2, taxPaidGallons: 0 },
    { code: "TX", name: "Texas", taxableMiles: 64082.5, totalMiles: 64082.5, taxPaidGallons: 0 },
  ],
};

const vehicleDataByMonth: Record<string, { id: string; miles: number; jurisdictions: number; mpg: number }[]> = {
  "Jan 2026": [
    { id: "1824", miles: 18234.2, jurisdictions: 3, mpg: 6.2 },
    { id: "1826", miles: 15890.4, jurisdictions: 2, mpg: 5.9 },
    { id: "1828", miles: 12445.1, jurisdictions: 3, mpg: 5.7 },
    { id: "1830", miles: 9832.6, jurisdictions: 2, mpg: 6.1 },
    { id: "1831", miles: 8822.8, jurisdictions: 1, mpg: 6.4 },
  ],
  "Feb 2026": [
    { id: "1824", miles: 16102.8, jurisdictions: 3, mpg: 6.3 },
    { id: "1826", miles: 14320.1, jurisdictions: 2, mpg: 6.0 },
    { id: "1828", miles: 11890.5, jurisdictions: 2, mpg: 5.8 },
    { id: "1830", miles: 10245.3, jurisdictions: 3, mpg: 6.0 },
    { id: "1831", miles: 7654.2, jurisdictions: 1, mpg: 6.5 },
  ],
  "Mar 2026": [
    { id: "1824", miles: 19450.6, jurisdictions: 3, mpg: 6.1 },
    { id: "1826", miles: 17210.9, jurisdictions: 3, mpg: 5.8 },
    { id: "1828", miles: 13102.4, jurisdictions: 3, mpg: 5.6 },
    { id: "1830", miles: 8920.1, jurisdictions: 2, mpg: 6.2 },
    { id: "1831", miles: 9445.7, jurisdictions: 2, mpg: 6.3 },
  ],
};

const troubleshootingData = [
  { vehicle: "1825", issue: "GPS gap detected", date: "Jan 14, 2026", miles: 42.3, status: "unresolved" },
  { vehicle: "1827", issue: "Jurisdiction boundary crossing mismatch", date: "Jan 18, 2026", miles: 12.8, status: "unresolved" },
  { vehicle: "1829", issue: "Odometer discrepancy", date: "Jan 22, 2026", miles: 85.1, status: "unresolved" },
];

export default function IFTAPage() {
  const [activeTab, setActiveTab] = useState<TabId>("jurisdiction");
  const [month, setMonth] = useState({ label: "Jan 2026", index: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"code" | "taxableMiles" | "totalMiles">("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const months = ["Jan 2026", "Feb 2026", "Mar 2026"];

  const prevMonth = () => {
    setMonth((m) => ({
      label: months[Math.max(0, m.index - 1)],
      index: Math.max(0, m.index - 1),
    }));
  };

  const nextMonth = () => {
    setMonth((m) => ({
      label: months[Math.min(months.length - 1, m.index + 1)],
      index: Math.min(months.length - 1, m.index + 1),
    }));
  };

  const jurisdictionData = jurisdictionDataByMonth[month.label] || jurisdictionDataByMonth["Jan 2026"];
  const vehicleData = vehicleDataByMonth[month.label] || vehicleDataByMonth["Jan 2026"];

  const filteredJurisdictions = jurisdictionData
    .filter(
      (j) =>
        j.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "code") return a.code.localeCompare(b.code) * dir;
      return ((a[sortField] ?? 0) - (b[sortField] ?? 0)) * dir;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const totalTaxableMiles = jurisdictionData.reduce((s, j) => s + j.taxableMiles, 0);
  const totalMiles = jurisdictionData.reduce((s, j) => s + j.totalMiles, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">IFTA Reporting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          International Fuel Tax Agreement mileage and tax reporting.
        </p>
      </div>

      {/* Tab bar + Month selector row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="ifta-tab"
                  className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              {"count" in tab && tab.count && (
                <span className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-xs font-medium text-red-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm">
            <button onClick={prevMonth} className="p-0.5 text-muted-foreground hover:text-foreground">
              <CaretLeft className="h-4 w-4" />
            </button>
            <CalendarBlank className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{month.label}</span>
            <button onClick={nextMonth} className="p-0.5 text-muted-foreground hover:text-foreground">
              <CaretRight className="h-4 w-4" />
            </button>
          </div>
          <button className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:text-foreground">
            Tags
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "jurisdiction" && (
          <motion.div
            key="jurisdiction"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            {/* Fleet IFTA Summary Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Fleet IFTA MPG Summary</h3>
              <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">IFTA Miles</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-foreground">
                    {totalTaxableMiles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Non-IFTA Miles</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-foreground">0 mi</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Miles</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-foreground">
                    {totalMiles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tax Paid Gallons</p>
                  <p className="mt-1 text-sm text-muted-foreground">No purchases available</p>
                  <button className="mt-1 text-xs font-medium text-primary hover:underline">
                    Add Purchases
                  </button>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">IFTA MPG</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-muted-foreground">--</p>
                </div>
              </div>
            </div>

            {/* Jurisdictions Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Jurisdictions</h3>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jurisdictions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3">
                        <button
                          onClick={() => handleSort("code")}
                          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                          Jurisdiction
                          <CaretUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-5 py-3">
                        <button
                          onClick={() => handleSort("taxableMiles")}
                          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                          Taxable Miles
                          <CaretUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-5 py-3">
                        <button
                          onClick={() => handleSort("totalMiles")}
                          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                          Total Miles
                          <CaretUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tax Paid Gallons
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredJurisdictions.map((j) => (
                      <tr key={j.code} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-foreground">{j.code}</span>
                          <span className="ml-2 text-sm text-muted-foreground">{j.name}</span>
                        </td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">
                          {j.taxableMiles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                        </td>
                        <td className="px-5 py-3">
                          <button className="flex items-center gap-1 font-mono text-sm text-primary hover:underline">
                            {j.totalMiles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                            <ArrowSquareOut className="h-3 w-3" />
                          </button>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {j.taxPaidGallons > 0 ? `${j.taxPaidGallons} gal` : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/20">
                      <td className="px-5 py-3 text-sm font-semibold text-foreground">Total</td>
                      <td className="px-5 py-3 font-mono text-sm font-semibold text-foreground">
                        {totalTaxableMiles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                      </td>
                      <td className="px-5 py-3 font-mono text-sm font-semibold text-foreground">
                        {totalMiles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">--</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "vehicle" && (
          <motion.div
            key="vehicle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Vehicle Mileage</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  IFTA mileage breakdown by vehicle for {month.label}.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Miles</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Jurisdictions</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg MPG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vehicleData.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-sm font-medium text-foreground">{v.id}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">
                          {v.miles.toLocaleString("en-US", { minimumFractionDigits: 1 })} mi
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground">{v.jurisdictions}</td>
                        <td className="px-5 py-3 font-mono text-sm text-foreground">{v.mpg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "troubleshooting" && (
          <motion.div
            key="troubleshooting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Data Issues</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  GPS gaps, boundary mismatches, and odometer discrepancies that may affect IFTA accuracy.
                </p>
              </div>
              <div className="divide-y divide-border">
                {troubleshootingData.map((item) => (
                  <div key={`${item.vehicle}-${item.date}`} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                        <span className="font-mono text-xs font-semibold text-red-600">{item.vehicle}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.issue}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date} &middot; {item.miles} mi affected
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
                      Unresolved
                    </span>
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
