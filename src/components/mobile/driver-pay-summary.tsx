"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Truck,
  Download,
  Eye,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PayPeriod {
  id: string;
  startDate: string;
  endDate: string;
  status: "pending" | "processing" | "paid";
  grossPay: number;
  deductions: number;
  netPay: number;
  miles: number;
  loads: number;
}

interface PayDetail {
  category: string;
  amount: number;
  description?: string;
  type: "earning" | "deduction";
}

interface WeeklyStats {
  currentWeek: {
    grossPay: number;
    loads: number;
    miles: number;
  };
  lastWeek: {
    grossPay: number;
    loads: number;
    miles: number;
  };
}

export function DriverPaySummary() {
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [payPeriods] = useState<PayPeriod[]>([
    {
      id: "1",
      startDate: "Mar 4, 2024",
      endDate: "Mar 10, 2024",
      status: "paid",
      grossPay: 2450.75,
      deductions: 387.25,
      netPay: 2063.50,
      miles: 2847,
      loads: 4
    },
    {
      id: "2",
      startDate: "Mar 11, 2024",
      endDate: "Mar 17, 2024",
      status: "paid",
      grossPay: 2180.25,
      deductions: 362.40,
      netPay: 1817.85,
      miles: 2534,
      loads: 3
    },
    {
      id: "3",
      startDate: "Mar 18, 2024",
      endDate: "Mar 24, 2024",
      status: "processing",
      grossPay: 2675.50,
      deductions: 398.75,
      netPay: 2276.75,
      miles: 3102,
      loads: 5
    },
    {
      id: "4",
      startDate: "Mar 25, 2024",
      endDate: "Mar 31, 2024",
      status: "pending",
      grossPay: 1820.00,
      deductions: 298.50,
      netPay: 1521.50,
      miles: 2156,
      loads: 3
    }
  ]);

  const [weeklyStats] = useState<WeeklyStats>({
    currentWeek: {
      grossPay: 1820.00,
      loads: 3,
      miles: 2156
    },
    lastWeek: {
      grossPay: 2675.50,
      loads: 5,
      miles: 3102
    }
  });

  const [payDetails] = useState<PayDetail[]>([
    { category: "Base Pay", amount: 1450.00, type: "earning", description: "Percentage of load revenue" },
    { category: "Fuel Bonus", amount: 125.50, type: "earning", description: "Fuel efficiency incentive" },
    { category: "Safety Bonus", amount: 100.00, type: "earning", description: "No incidents this period" },
    { category: "Detention Pay", amount: 144.50, type: "earning", description: "4.5 hours @ $32/hour" },
    { category: "Health Insurance", amount: -125.00, type: "deduction", description: "Employee portion" },
    { category: "401(k) Contribution", amount: -87.50, type: "deduction", description: "5% of gross" },
    { category: "Fuel Card Advance", amount: -86.00, type: "deduction", description: "Fuel purchases" },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const getStatusConfig = (status: string) => {
    const statusMap = {
      pending: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
      processing: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Processing" },
      paid: { color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200", label: "Paid" }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const grossPayChange = calculateChange(weeklyStats.currentWeek.grossPay, weeklyStats.lastWeek.grossPay);
  const milesChange = calculateChange(weeklyStats.currentWeek.miles, weeklyStats.lastWeek.miles);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100">
      <AnimatePresence mode="wait">
        {!selectedPeriod ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Pay Summary</h1>
                <p className="text-sm text-slate-600">Mike Rodriguez</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-apollo-cyan-600 flex items-center justify-center">
                <CurrencyDollar className="h-6 w-6 text-white" weight="fill" />
              </div>
            </motion.div>

            {/* Current Week Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">This Week</h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CurrencyDollar className="h-4 w-4 text-apollo-cyan-600" />
                    <span className="text-sm text-slate-600">Gross Pay</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mb-1">
                    {formatCurrency(weeklyStats.currentWeek.grossPay)}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    grossPayChange.isPositive ? "text-apollo-cyan-600" : "text-red-600"
                  )}>
                    {grossPayChange.isPositive ? (
                      <TrendUp className="h-3 w-3" />
                    ) : (
                      <TrendDown className="h-3 w-3" />
                    )}
                    <span>{grossPayChange.percentage.toFixed(1)}% from last week</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-600">Miles</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mb-1">
                    {weeklyStats.currentWeek.miles.toLocaleString()}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    milesChange.isPositive ? "text-apollo-cyan-600" : "text-red-600"
                  )}>
                    {milesChange.isPositive ? (
                      <TrendUp className="h-3 w-3" />
                    ) : (
                      <TrendDown className="h-3 w-3" />
                    )}
                    <span>{milesChange.percentage.toFixed(1)}% from last week</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="text-center">
                  <div className="text-xs text-slate-600 mb-1">Loads</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {weeklyStats.currentWeek.loads}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-600 mb-1">Avg/Load</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {formatCurrency(weeklyStats.currentWeek.grossPay / weeklyStats.currentWeek.loads)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-600 mb-1">Per Mile</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    ${(weeklyStats.currentWeek.grossPay / weeklyStats.currentWeek.miles).toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pay Periods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-900">Recent Pay Periods</h2>

              {payPeriods.map((period, index) => {
                const statusConfig = getStatusConfig(period.status);

                return (
                  <motion.div
                    key={period.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {period.startDate} - {period.endDate}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {period.loads} loads • {period.miles.toLocaleString()} miles
                        </div>
                      </div>
                      <Badge className={cn("border font-mono text-xs", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-slate-600">Gross Pay</div>
                        <div className="text-sm font-semibold text-slate-900 font-mono">
                          {formatCurrency(period.grossPay)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">Deductions</div>
                        <div className="text-sm font-semibold text-red-600 font-mono">
                          -{formatCurrency(period.deductions)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">Net Pay</div>
                        <div className="text-sm font-semibold text-apollo-cyan-600 font-mono">
                          {formatCurrency(period.netPay)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Net Pay Progress</span>
                        <span>{((period.netPay / period.grossPay) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={(period.netPay / period.grossPay) * 100}
                        className="h-1.5"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Period Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    Pay Statement
                  </h1>
                  <p className="text-sm text-slate-600">
                    {selectedPeriod.startDate} - {selectedPeriod.endDate}
                  </p>
                </div>
                <Badge className={cn(
                  "border font-mono",
                  getStatusConfig(selectedPeriod.status).color
                )}>
                  {getStatusConfig(selectedPeriod.status).label}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-apollo-cyan-50 rounded-2xl">
                  <div className="text-xs text-slate-600 mb-1">Gross Pay</div>
                  <div className="text-lg font-bold text-apollo-cyan-700 font-mono">
                    {formatCurrency(selectedPeriod.grossPay)}
                  </div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-2xl">
                  <div className="text-xs text-slate-600 mb-1">Deductions</div>
                  <div className="text-lg font-bold text-red-700 font-mono">
                    -{formatCurrency(selectedPeriod.deductions)}
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-2xl">
                  <div className="text-xs text-slate-600 mb-1">Net Pay</div>
                  <div className="text-lg font-bold text-blue-700 font-mono">
                    {formatCurrency(selectedPeriod.netPay)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-600">Miles Driven</div>
                  <div className="text-sm font-semibold text-slate-900 font-mono">
                    {selectedPeriod.miles.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Loads Completed</div>
                  <div className="text-sm font-semibold text-slate-900 font-mono">
                    {selectedPeriod.loads}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pay Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200"
            >
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Pay Breakdown</h2>
              </div>

              <div className="p-4 space-y-4">
                {payDetails.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {detail.category}
                      </div>
                      {detail.description && (
                        <div className="text-xs text-slate-600 mt-1">
                          {detail.description}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "text-sm font-semibold font-mono",
                      detail.type === "earning" ? "text-apollo-cyan-600" : "text-red-600"
                    )}>
                      {detail.type === "earning" ? "+" : "-"}{formatCurrency(detail.amount)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}