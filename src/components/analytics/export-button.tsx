"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, FileCsv, FileText, CaretDown } from "@phosphor-icons/react";

interface ExportButtonProps {
  onExport: (format: "csv" | "pdf") => void;
  isLoading?: boolean;
  className?: string;
}

export function ExportButton({
  onExport,
  isLoading = false,
  className = "",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const exportOptions = [
    {
      format: "csv" as const,
      label: "Export CSV",
      icon: FileCsv,
      description: "Comma-separated values",
    },
    {
      format: "pdf" as const,
      label: "Export PDF",
      icon: FileText,
      description: "Portable document format",
    },
  ];

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="h-4 w-4 text-muted-foreground" />
        <span>Export</span>
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
            className="absolute right-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {exportOptions.map((option, index) => (
              <motion.button
                key={option.format}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onExport(option.format);
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <option.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}