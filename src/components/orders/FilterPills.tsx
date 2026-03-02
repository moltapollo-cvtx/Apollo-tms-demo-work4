"use client";

import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface FilterPillsProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}

export default function FilterPills({ filters, onRemove, onClearAll }: FilterPillsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
            "bg-primary/10 text-primary text-xs font-medium",
            "hover:bg-primary/20 transition-colors",
            "group",
          )}
        >
          <span>
            {filter.label}: {filter.value}
          </span>
          <X className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
      {filters.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
