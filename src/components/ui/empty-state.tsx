"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /**
   * The icon or illustration to display
   */
  icon?: React.ReactNode;
  /**
   * The main heading text
   */
  title: string;
  /**
   * Supporting description text
   */
  description: string;
  /**
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline" | "secondary";
  };
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8 px-6",
      icon: "h-12 w-12 mb-4",
      title: "text-lg",
      description: "text-sm",
      spacing: "space-y-3",
    },
    md: {
      container: "py-12 px-8",
      icon: "h-16 w-16 mb-6",
      title: "text-xl",
      description: "text-base",
      spacing: "space-y-4",
    },
    lg: {
      container: "py-16 px-10",
      icon: "h-20 w-20 mb-8",
      title: "text-2xl",
      description: "text-lg",
      spacing: "space-y-6",
    },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        classes.container,
        classes.spacing,
        className
      )}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            delay: 0.1,
          }}
          className={cn(
            "flex items-center justify-center text-muted-foreground/60",
            classes.icon
          )}
        >
          {icon}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-2"
      >
        <h3 className={cn("font-semibold text-foreground", classes.title)}>
          {title}
        </h3>
        <p className={cn("text-muted-foreground max-w-sm", classes.description)}>
          {description}
        </p>
      </motion.div>

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.3,
          }}
          className="flex items-center gap-3"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
              size={size === "sm" ? "sm" : "md"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === "sm" ? "sm" : "md"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}