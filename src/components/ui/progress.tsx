"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "danger"
  showValue?: boolean
  label?: string
  className?: string
  animated?: boolean
}

interface CircularProgressProps extends Omit<ProgressProps, "size"> {
  size?: number
  strokeWidth?: number
}

interface StepProgressProps {
  steps: Array<{
    id: string
    label: string
    description?: string
    completed?: boolean
    current?: boolean
  }>
  className?: string
  orientation?: "horizontal" | "vertical"
}

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showValue = false,
  label,
  className,
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3",
  }

  const variantClasses = {
    default: "bg-primary",
    success: "bg-apollo-cyan-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-muted-foreground font-mono">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", variantClasses[variant])}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={
            animated
              ? {
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                }
              : { duration: 0 }
          }
        />

        {/* Indeterminate animation */}
        {percentage === 0 && animated && (
          <motion.div
            className={cn(
              "absolute top-0 h-full rounded-full",
              variantClasses[variant],
              "w-1/3"
            )}
            animate={{
              x: ["0%", "300%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </div>
  )
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  variant = "default",
  showValue = true,
  label,
  className,
  animated = true,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const variantClasses = {
    default: "text-primary",
    success: "text-apollo-cyan-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-secondary"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={variantClasses[variant]}
            strokeDasharray={strokeDasharray}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={
              animated
                ? {
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }
                : { duration: 0 }
            }
          />
        </svg>

        {/* Center content */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium font-mono text-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="text-sm font-medium text-center text-foreground">
          {label}
        </span>
      )}
    </div>
  )
}

export function StepProgress({
  steps,
  className,
  orientation = "horizontal",
}: StepProgressProps) {
  const _currentStepIndex = steps.findIndex((step) => step.current)
  const completedSteps = steps.filter((step) => step.completed).length

  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => {
          const isCompleted = step.completed
          const isCurrent = step.current
          const isUpcoming = !isCompleted && !isCurrent

          return (
            <div key={step.id} className="flex gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isUpcoming && "border-muted bg-background text-muted-foreground"
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                >
                  {isCompleted ? "✓" : index + 1}
                </motion.div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-12 mt-2",
                      index < completedSteps ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-8">
                <h4 className={cn(
                  "font-medium",
                  isCompleted && "text-foreground",
                  isCurrent && "text-foreground",
                  isUpcoming && "text-muted-foreground"
                )}>
                  {step.label}
                </h4>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = step.completed
        const isCurrent = step.current
        const isUpcoming = !isCompleted && !isCurrent

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  isUpcoming && "border-muted bg-background text-muted-foreground"
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                }}
              >
                {isCompleted ? "✓" : index + 1}
              </motion.div>

              <div className="mt-2 text-center">
                <h4 className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-foreground",
                  isCurrent && "text-foreground",
                  isUpcoming && "text-muted-foreground"
                )}>
                  {step.label}
                </h4>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 -mt-8">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{
                    width: index < completedSteps ? "100%" : "0%"
                  }}
                  transition={{
                    delay: (index + 1) * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                />
                <div className="h-full bg-muted -mt-0.5" />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}