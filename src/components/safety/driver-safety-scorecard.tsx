"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  User,
  ShieldCheck,
  Clock,
  TrendUp,
  TrendDown,
  Minus,
  Warning,
  CheckCircle,
  Target,
  Calendar,
} from "@phosphor-icons/react";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SafetyMetric {
  category: "hos_compliance" | "inspections" | "accidents" | "on_time" | "violations";
  score: number;
  maxScore: number;
  weight: number; // Weight in composite score calculation
  trend: "up" | "down" | "stable";
  details: {
    current: number;
    previous: number;
    target: number;
    unit: string;
  };
}

interface DriverSafetyRecord {
  driverId: string;
  driverName: string;
  compositeScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  metrics: SafetyMetric[];
  recentIncidents: {
    date: Date;
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }[];
  monthlyScores: {
    month: string;
    score: number;
  }[];
}

// Mock data - will be replaced with API calls
const mockDriverSafetyData: DriverSafetyRecord[] = [
  {
    driverId: "D001",
    driverName: "Marcus Rodriguez",
    compositeScore: 87,
    grade: "B",
    metrics: [
      {
        category: "hos_compliance",
        score: 92,
        maxScore: 100,
        weight: 0.3,
        trend: "up",
        details: { current: 92, previous: 88, target: 95, unit: "%" }
      },
      {
        category: "inspections",
        score: 85,
        maxScore: 100,
        weight: 0.25,
        trend: "stable",
        details: { current: 85, previous: 85, target: 90, unit: "%" }
      },
      {
        category: "accidents",
        score: 100,
        maxScore: 100,
        weight: 0.25,
        trend: "stable",
        details: { current: 0, previous: 0, target: 0, unit: "incidents" }
      },
      {
        category: "on_time",
        score: 78,
        maxScore: 100,
        weight: 0.15,
        trend: "down",
        details: { current: 78, previous: 82, target: 90, unit: "%" }
      },
      {
        category: "violations",
        score: 95,
        maxScore: 100,
        weight: 0.05,
        trend: "up",
        details: { current: 1, previous: 2, target: 0, unit: "violations" }
      }
    ],
    recentIncidents: [
      {
        date: new Date(2026, 1, 15),
        type: "Late Delivery",
        severity: "low",
        description: "Delayed 45 minutes due to traffic"
      }
    ],
    monthlyScores: [
      { month: "Sep", score: 82 },
      { month: "Oct", score: 85 },
      { month: "Nov", score: 84 },
      { month: "Dec", score: 88 },
      { month: "Jan", score: 87 },
      { month: "Feb", score: 87 },
    ]
  },
  {
    driverId: "D002",
    driverName: "Sarah Chen",
    compositeScore: 94,
    grade: "A",
    metrics: [
      {
        category: "hos_compliance",
        score: 98,
        maxScore: 100,
        weight: 0.3,
        trend: "up",
        details: { current: 98, previous: 96, target: 95, unit: "%" }
      },
      {
        category: "inspections",
        score: 95,
        maxScore: 100,
        weight: 0.25,
        trend: "up",
        details: { current: 95, previous: 92, target: 90, unit: "%" }
      },
      {
        category: "accidents",
        score: 100,
        maxScore: 100,
        weight: 0.25,
        trend: "stable",
        details: { current: 0, previous: 0, target: 0, unit: "incidents" }
      },
      {
        category: "on_time",
        score: 88,
        maxScore: 100,
        weight: 0.15,
        trend: "stable",
        details: { current: 88, previous: 87, target: 90, unit: "%" }
      },
      {
        category: "violations",
        score: 100,
        maxScore: 100,
        weight: 0.05,
        trend: "stable",
        details: { current: 0, previous: 0, target: 0, unit: "violations" }
      }
    ],
    recentIncidents: [],
    monthlyScores: [
      { month: "Sep", score: 89 },
      { month: "Oct", score: 91 },
      { month: "Nov", score: 92 },
      { month: "Dec", score: 93 },
      { month: "Jan", score: 94 },
      { month: "Feb", score: 94 },
    ]
  }
];

const getMetricLabel = (category: SafetyMetric["category"]) => {
  switch (category) {
    case "hos_compliance":
      return "HOS Compliance";
    case "inspections":
      return "Inspection Score";
    case "accidents":
      return "Safety Record";
    case "on_time":
      return "On-Time Performance";
    case "violations":
      return "Violation Record";
  }
};

const getMetricIcon = (category: SafetyMetric["category"]) => {
  switch (category) {
    case "hos_compliance":
      return Clock;
    case "inspections":
      return CheckCircle;
    case "accidents":
      return ShieldCheck;
    case "on_time":
      return Target;
    case "violations":
      return Warning;
  }
};

const getGradeColor = (grade: DriverSafetyRecord["grade"]) => {
  switch (grade) {
    case "A":
      return "text-apollo-cyan-600 bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20";
    case "B":
      return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
    case "C":
      return "text-amber-600 bg-amber-100 dark:bg-amber-900/20";
    case "D":
      return "text-orange-600 bg-orange-100 dark:bg-orange-900/20";
    case "F":
      return "text-red-600 bg-red-100 dark:bg-red-900/20";
  }
};

const getTrendIcon = (trend: SafetyMetric["trend"]) => {
  switch (trend) {
    case "up":
      return TrendUp;
    case "down":
      return TrendDown;
    case "stable":
      return Minus;
  }
};

const getTrendColor = (trend: SafetyMetric["trend"]) => {
  switch (trend) {
    case "up":
      return "text-apollo-cyan-600";
    case "down":
      return "text-red-600";
    case "stable":
      return "text-slate-500";
  }
};

const getIncidentSeverityColor = (severity: "low" | "medium" | "high") => {
  switch (severity) {
    case "low":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    case "medium":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
  }
};

interface DriverSafetyScorecardProps {
  className?: string;
}

export function DriverSafetyScorecard({ className }: DriverSafetyScorecardProps) {
  const [selectedDriverId, setSelectedDriverId] = useState(mockDriverSafetyData[0].driverId);

  const selectedDriver = useMemo(() => {
    return mockDriverSafetyData.find(d => d.driverId === selectedDriverId);
  }, [selectedDriverId]);

  if (!selectedDriver) return null;

  // Prepare data for pie chart
  const pieData = selectedDriver.metrics.map(metric => ({
    name: getMetricLabel(metric.category),
    value: metric.score,
    color: metric.score >= 90 ? "#00B4D8" : metric.score >= 80 ? "#f59e0b" : "#ef4444"
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { month: string; score: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.month}</p>
          <p className="text-sm text-muted-foreground font-mono">
            Score: {data.score}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Driver Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
            <User className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Driver Safety Scorecard</h3>
            <p className="text-sm text-muted-foreground">Comprehensive safety performance metrics</p>
          </div>
        </div>

        <Select
          value={selectedDriverId}
          onValueChange={(value) => setSelectedDriverId(value as string)}
          options={mockDriverSafetyData.map(driver => ({
            value: driver.driverId,
            label: driver.driverName
          }))}
        />
      </div>

      {/* Driver Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
              <User className="h-8 w-8 text-apollo-cyan-600" weight="duotone" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{selectedDriver.driverName}</h2>
              <p className="text-sm text-muted-foreground font-mono">{selectedDriver.driverId}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`font-mono ${getGradeColor(selectedDriver.grade)}`}>
                  Grade {selectedDriver.grade}
                </Badge>
                {selectedDriver.recentIncidents.length === 0 && (
                  <Badge variant="secondary" className="text-apollo-cyan-600">
                    No Recent Incidents
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-3xl font-semibold text-foreground">
              {selectedDriver.compositeScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <p className="text-sm text-muted-foreground">Composite Safety Score</p>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Individual Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          <h4 className="text-base font-semibold text-foreground">Performance Breakdown</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {selectedDriver.metrics.map((metric, index) => {
              const Icon = getMetricIcon(metric.category);
              const TrendIcon = getTrendIcon(metric.trend);

              return (
                <motion.div
                  key={metric.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" weight="duotone" />
                      <span className="text-sm font-medium text-foreground">
                        {getMetricLabel(metric.category)}
                      </span>
                    </div>
                    <TrendIcon className={`h-4 w-4 ${getTrendColor(metric.trend)}`} weight="bold" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-semibold text-foreground">
                        {metric.details.current}
                        <span className="text-sm text-muted-foreground ml-1">
                          {metric.details.unit === "%" ? "%" : metric.details.unit}
                        </span>
                      </span>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>Target: {metric.details.target}{metric.details.unit === "%" ? "%" : ""}</div>
                        <div>Prev: {metric.details.previous}{metric.details.unit === "%" ? "%" : ""}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                        className={`h-2 rounded-full ${
                          metric.score >= 90
                            ? "bg-apollo-cyan-600"
                            : metric.score >= 80
                            ? "bg-amber-500"
                            : "bg-red-600"
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Score Visualization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <h4 className="text-base font-semibold text-foreground">Score Distribution</h4>
          <div className="rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Incidents */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Warning className="h-4 w-4 text-muted-foreground" />
              Recent Incidents
            </h5>
            {selectedDriver.recentIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No recent incidents
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDriver.recentIncidents.map((incident, index) => (
                  <div
                    key={index}
                    className={`rounded-lg px-3 py-2 text-xs ${getIncidentSeverityColor(incident.severity)}`}
                  >
                    <div className="font-medium">{incident.type}</div>
                    <div className="opacity-75">{incident.description}</div>
                    <div className="opacity-60">{incident.date.toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          6-Month Safety Trend
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={selectedDriver.monthlyScores}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#00B4D8"
              strokeWidth={3}
              dot={{ fill: "#00B4D8", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#00B4D8", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}