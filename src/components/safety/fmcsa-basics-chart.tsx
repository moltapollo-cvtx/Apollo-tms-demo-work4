"use client";

import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ShieldCheck,
  TrendUp,
  TrendDown,
  Minus,
  Info,
} from "@phosphor-icons/react";

interface BasicsScore {
  category: string;
  currentScore: number;
  previousScore: number;
  percentile: number;
  threshold: number;
  status: "good" | "warning" | "alert";
  trend: "up" | "down" | "stable";
}

// Mock FMCSA BASICs data - will be replaced with API calls
const mockBasicsData: BasicsScore[] = [
  {
    category: "Unsafe Driving",
    currentScore: 12.4,
    previousScore: 10.8,
    percentile: 15,
    threshold: 65.0,
    status: "good",
    trend: "up",
  },
  {
    category: "Hours of Service",
    currentScore: 8.7,
    previousScore: 9.2,
    percentile: 8,
    threshold: 65.0,
    status: "good",
    trend: "down",
  },
  {
    category: "Vehicle Maintenance",
    currentScore: 22.1,
    previousScore: 20.5,
    percentile: 25,
    threshold: 80.0,
    status: "good",
    trend: "up",
  },
  {
    category: "Controlled Substances",
    currentScore: 0.0,
    previousScore: 0.0,
    percentile: 0,
    threshold: 80.0,
    status: "good",
    trend: "stable",
  },
  {
    category: "Hazmat Compliance",
    currentScore: 5.2,
    previousScore: 4.8,
    percentile: 12,
    threshold: 80.0,
    status: "good",
    trend: "up",
  },
  {
    category: "Driver Fitness",
    currentScore: 15.3,
    previousScore: 16.1,
    percentile: 18,
    threshold: 80.0,
    status: "good",
    trend: "down",
  },
  {
    category: "Crash Indicator",
    currentScore: 31.2,
    previousScore: 28.9,
    percentile: 35,
    threshold: 65.0,
    status: "warning",
    trend: "up",
  },
];

// Prepare data for radar chart (invert scores for better visualization)
const radarData = mockBasicsData.map((item) => ({
  category: item.category.replace(" ", "\n"),
  score: Math.max(0, 100 - item.currentScore), // Invert so higher is better
  threshold: Math.max(0, 100 - item.threshold),
  actualScore: item.currentScore,
  percentile: item.percentile,
}));

const getStatusColor = (status: BasicsScore["status"]) => {
  switch (status) {
    case "good":
      return "text-apollo-cyan-600";
    case "warning":
      return "text-amber-500";
    case "alert":
      return "text-red-600";
  }
};

const getTrendIcon = (trend: BasicsScore["trend"]) => {
  switch (trend) {
    case "up":
      return TrendUp;
    case "down":
      return TrendDown;
    case "stable":
      return Minus;
  }
};

const getTrendColor = (trend: BasicsScore["trend"], isGoodDirection: boolean) => {
  if (trend === "stable") return "text-slate-500";

  const isImproving =
    (trend === "down" && isGoodDirection) || // Score going down is good
    (trend === "up" && !isGoodDirection);   // Score going up might be bad depending on context

  return isImproving ? "text-apollo-cyan-600" : "text-red-600";
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { actualScore: number; percentile: number } }>; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{label.replace("\n", " ")}</p>
        <p className="text-sm text-muted-foreground font-mono">
          Score: {data.actualScore}% ({data.percentile}th percentile)
        </p>
      </div>
    );
  }
  return null;
};

export function FmcsaBasicsChart() {
  const overallScore = Math.round(
    mockBasicsData.reduce((acc, item) => acc + (100 - item.currentScore), 0) /
    mockBasicsData.length
  );

  const criticalAreas = mockBasicsData.filter(item => item.status !== "good");

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
            <ShieldCheck className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">FMCSA BASICs Scores</h3>
            <p className="text-sm text-muted-foreground">Current safety performance ratings</p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl font-semibold text-foreground">
            {overallScore}<span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div className="text-xs text-muted-foreground">Overall Safety Score</div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-6"
        >
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <PolarGrid className="stroke-border" />
              <PolarAngleAxis
                dataKey="category"
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                  textAnchor: "middle"
                }}
                className="text-xs font-medium"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                className="text-xs"
              />
              <Radar
                name="Threshold"
                dataKey="threshold"
                stroke="hsl(var(--muted-foreground))"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <Radar
                name="Current Score"
                dataKey="score"
                stroke="#00B4D8"
                fill="#00B4D8"
                fillOpacity={0.1}
                strokeWidth={3}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Score Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Score Details
            </h4>
            <div className="space-y-3">
              {mockBasicsData.map((item, index) => {
                const TrendIcon = getTrendIcon(item.trend);
                return (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {item.category}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.percentile}th percentile
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`font-mono text-sm font-semibold ${getStatusColor(item.status)}`}>
                        {item.currentScore}%
                      </div>
                      <TrendIcon
                        className={`h-3 w-3 ${getTrendColor(item.trend, true)}`}
                        weight="bold"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Critical Areas Alert */}
          {criticalAreas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4"
            >
              <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                <TrendUp className="h-4 w-4" />
                Areas for Improvement
              </h5>
              <div className="space-y-1">
                {criticalAreas.map((area) => (
                  <div key={area.category} className="text-sm text-amber-700 dark:text-amber-300">
                    • {area.category}: {area.currentScore}% ({area.percentile}th percentile)
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-apollo-cyan-600" />
          <span>Current Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-b-2 border-dashed border-muted-foreground" />
          <span>Alert Threshold</span>
        </div>
      </div>
    </div>
  );
}