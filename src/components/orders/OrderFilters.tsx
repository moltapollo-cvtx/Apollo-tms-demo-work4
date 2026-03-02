"use client";

import { useRef, useEffect, useCallback } from "react";
import { MagnifyingGlass as Search, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type OrderView = "active" | "available" | "in_transit" | "completed" | "all";

interface OrderFiltersProps {
  view: OrderView;
  onViewChange: (view: OrderView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalOrders: number;
}

const viewTabs: { value: OrderView; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "available", label: "Available" },
  { value: "in_transit", label: "In Transit" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

export default function OrderFilters({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  totalOrders,
}: OrderFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  const clearSearch = () => {
    onSearchChange("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by order, customer, route, commodity, equipment..."
          defaultValue={searchQuery}
          onChange={handleSearchInput}
          className={cn(
            "h-10 w-full rounded-xl bg-muted/50 pl-10 pr-10 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background",
            "border border-transparent focus:border-primary/20",
            "transition-colors",
          )}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* View Tabs + Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onViewChange(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                view === tab.value
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-sm text-muted-foreground font-mono shrink-0">
          {totalOrders.toLocaleString()} {totalOrders === 1 ? "order" : "orders"}
        </span>
      </div>
    </div>
  );
}
