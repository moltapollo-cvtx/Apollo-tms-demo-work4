"use client";

import { useState, useRef, useEffect } from "react";
import { CaretLeft, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split("-");
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, label, className, placeholder = "Select date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();

  const selectedDate = isoToDate(value);
  const initialViewDate = selectedDate ?? today;

  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sync view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDate = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toIso(d));
    setOpen(false);
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const todayIso = toIso(today);
  const selectedIso = value;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "mt-1 flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "hover:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
          !displayValue && "text-muted-foreground"
        )}
      >
        <CalendarBlank className="size-4 shrink-0 text-muted-foreground" weight="light" />
        <span className="flex-1 text-left">{displayValue || placeholder}</span>
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-xl border border-border bg-popover shadow-lg">
          {/* Month / year nav */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors">
              <CaretLeft className="size-4" weight="bold" />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors">
              <CaretRight className="size-4" weight="bold" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const iso = toIso(new Date(viewYear, viewMonth, day));
              const isSelected = iso === selectedIso;
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : isToday
                      ? "border border-primary text-primary font-medium hover:bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
