"use client";

import React from "react";
import { motion } from "framer-motion";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react";

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const dateRangeOptions = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "Last 7 Days" },
  { value: "mtd", label: "Month to Date" },
  { value: "ytd", label: "Year to Date" },
];

export function DateRangePicker({
  value,
  onChange,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentLabel = dateRangeOptions.find(opt => opt.value === value)?.label || "Month to Date";

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
      >
        <CalendarBlank className="h-4 w-4 text-muted-foreground" />
        <span>{currentLabel}</span>
        <CaretDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="absolute right-0 top-full z-20 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {dateRangeOptions.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent ${
                  value === option.value
                    ? "bg-apollo-cyan-50 text-apollo-cyan-700 dark:bg-apollo-cyan-950 dark:text-apollo-cyan-300"
                    : "text-foreground"
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}