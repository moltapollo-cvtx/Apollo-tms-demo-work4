"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TrendUp, TrendDown } from "@phosphor-icons/react";

interface KpiCardProps {
  label: string;
  value: number;
  format: "currency" | "percentage" | "number";
  trend: number;
  sparklineData: { date: string; value: number }[];
  className?: string;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  format,
  trend,
  sparklineData,
  className = "",
  delay = 0,
}: KpiCardProps) {
  const chartId = React.useId().replace(/:/g, "");

  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "number":
        return new Intl.NumberFormat("en-US").format(val);
      default:
        return val.toString();
    }
  };

  const formatTrend = (trendVal: number) => {
    return `${trendVal > 0 ? "+" : ""}${trendVal.toFixed(1)}%`;
  };

  const getTrendColor = (trendVal: number) => {
    return trendVal >= 0 ? "text-apollo-cyan-600" : "text-red-500";
  };

  const chartStroke = trend >= 0 ? "#0096C7" : "#dc2626";
  const chartFill = trend >= 0 ? "#00B4D8" : "#f87171";
  const normalizedSparklineData = sparklineData
    .filter((point) => Number.isFinite(point.value))
    .map((point) => ({
      ...point,
      value: Number(point.value),
    }));
  const chartData =
    normalizedSparklineData.length > 1
      ? normalizedSparklineData
      : [
          { date: "start", value },
          { date: "end", value },
        ];

  const getTrendIcon = (trendVal: number) => {
    return trendVal >= 0 ? (
      <TrendUp className="h-3 w-3" weight="bold" />
    ) : (
      <TrendDown className="h-3 w-3" weight="bold" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: delay * 0.1,
      }}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>

      {/* Main Value */}
      <div className="mb-4">
        <motion.p
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: delay * 0.1 + 0.2,
          }}
          className="font-mono text-3xl font-bold tracking-tight text-foreground"
        >
          {formatValue(value, format)}
        </motion.p>
      </div>

      {/* Trend and Sparkline Container */}
      <div className="flex items-end justify-between">
        {/* Trend Indicator */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: delay * 0.1 + 0.3,
          }}
          className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor(trend)}`}
        >
          {getTrendIcon(trend)}
          <span className="font-mono">{formatTrend(trend)}</span>
        </motion.div>

        {/* Sparkline Chart */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: delay * 0.1 + 0.4,
          }}
          className="h-10 w-28"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`sparkline-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartFill} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartFill} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={false}
                contentStyle={{
                  borderRadius: "0.6rem",
                  borderColor: "var(--border)",
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "11px",
                }}
                formatter={(tooltipValue: number | string | undefined) => [
                  formatValue(Number(tooltipValue || 0), format),
                  label,
                ]}
                labelFormatter={() => ""}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={`url(#sparkline-${chartId})`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartStroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 2, fill: chartStroke }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-apollo-cyan-50/20 to-transparent dark:from-apollo-cyan-950/10" />
    </motion.div>
  );
}
