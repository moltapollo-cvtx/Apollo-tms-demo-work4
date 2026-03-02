"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CaretLeft,
  CaretRight,
  Warning,
  Check,
  Clock,
} from "@phosphor-icons/react";

interface ExpirationItem {
  id: string;
  type: "cdl" | "medical" | "hazmat" | "endorsement" | "drug_test";
  driverName: string;
  description: string;
  expirationDate: Date;
  urgency: "critical" | "warning" | "ok";
}

// Mock data - will be replaced with API calls
const mockExpirationData: ExpirationItem[] = [
  {
    id: "1",
    type: "cdl",
    driverName: "Marcus Rodriguez",
    description: "CDL License",
    expirationDate: new Date(2026, 2, 15), // March 15
    urgency: "warning",
  },
  {
    id: "2",
    type: "medical",
    driverName: "Sarah Chen",
    description: "DOT Medical Certificate",
    expirationDate: new Date(2026, 2, 8), // March 8
    urgency: "critical",
  },
  {
    id: "3",
    type: "hazmat",
    driverName: "David Thompson",
    description: "HAZMAT Endorsement",
    expirationDate: new Date(2026, 2, 22), // March 22
    urgency: "warning",
  },
  {
    id: "4",
    type: "drug_test",
    driverName: "Lisa Park",
    description: "Random Drug Test Due",
    expirationDate: new Date(2026, 2, 5), // March 5
    urgency: "critical",
  },
];

const getUrgencyColor = (urgency: ExpirationItem["urgency"]) => {
  switch (urgency) {
    case "critical":
      return "bg-red-600 text-white";
    case "warning":
      return "bg-amber-500 text-white";
    case "ok":
      return "bg-apollo-cyan-600 text-white";
  }
};

const getUrgencyIcon = (urgency: ExpirationItem["urgency"]) => {
  switch (urgency) {
    case "critical":
      return Warning;
    case "warning":
      return Clock;
    case "ok":
      return Check;
  }
};

const formatTypeLabel = (type: ExpirationItem["type"]) => {
  switch (type) {
    case "cdl":
      return "CDL";
    case "medical":
      return "Medical";
    case "hazmat":
      return "HAZMAT";
    case "endorsement":
      return "Endorsement";
    case "drug_test":
      return "Drug Test";
  }
};

const _getDaysUntilExpiration = (date: Date) => {
  const now = new Date();
  const timeDiff = date.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff;
};

export function ExpirationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { year, month } = useMemo(() => {
    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
    };
  }, [currentDate]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Group expiration items by date
  const expirationsByDate = useMemo(() => {
    const grouped: Record<string, ExpirationItem[]> = {};

    mockExpirationData.forEach((item) => {
      const dateKey = `${item.expirationDate.getFullYear()}-${item.expirationDate.getMonth()}-${item.expirationDate.getDate()}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return grouped;
  }, []);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarDay = (day: number) => {
    const date = new Date(year, month, day);
    const dateKey = `${year}-${month}-${day}`;
    const expirations = expirationsByDate[dateKey] || [];

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return (
      <motion.div
        key={day}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: day * 0.005,
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        className={`
          group relative min-h-[80px] border border-border bg-card p-2
          hover:bg-muted/50 transition-colors cursor-pointer
          ${isToday ? "ring-2 ring-apollo-cyan-500 ring-offset-2 ring-offset-background" : ""}
        `}
      >
        <div className={`
          text-sm font-mono font-semibold
          ${isToday ? "text-apollo-cyan-600" : "text-foreground"}
        `}>
          {day}
        </div>

        {expirations.length > 0 && (
          <div className="mt-1 space-y-1">
            {expirations.slice(0, 2).map((expiration) => {
              const Icon = getUrgencyIcon(expiration.urgency);
              return (
                <motion.div
                  key={expiration.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                    ${getUrgencyColor(expiration.urgency)}
                  `}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate font-mono">
                    {formatTypeLabel(expiration.type)}
                  </span>
                </motion.div>
              );
            })}
            {expirations.length > 2 && (
              <div className="text-xs text-muted-foreground font-mono">
                +{expirations.length - 2} more
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
          <h3 className="text-lg font-semibold tracking-tight">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateMonth("prev")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border
                     bg-background hover:bg-muted transition-colors"
          >
            <CaretLeft className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateMonth("next")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border
                     bg-background hover:bg-muted transition-colors"
          >
            <CaretRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-muted py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] bg-muted/20" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span className="text-sm text-muted-foreground">Critical (≤7 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-muted-foreground">Warning (≤30 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-apollo-cyan-600" />
          <span className="text-sm text-muted-foreground">Good (&gt;30 days)</span>
        </div>
      </div>
    </div>
  );
}