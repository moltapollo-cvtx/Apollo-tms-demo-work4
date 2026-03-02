"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  shimmer?: boolean
  pulse?: boolean
}

interface SkeletonTextProps {
  lines?: number
  className?: string
  lineClassName?: string
  shimmer?: boolean
}

interface SkeletonCardProps {
  className?: string
  hasHeader?: boolean
  hasFooter?: boolean
  shimmer?: boolean
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
  shimmer?: boolean
}

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  shimmer?: boolean
}

export function Skeleton({
  className,
  shimmer = true,
  pulse = false,
  ...props
}: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        pulse && "animate-pulse",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.div>)}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
  shimmer = true,
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => {
        // Vary line widths for more realistic appearance
        const widths = ["w-full", "w-5/6", "w-4/5", "w-3/4", "w-2/3"]
        const width = index === lines - 1 ? widths[Math.min(index + 1, widths.length - 1)] : "w-full"

        return (
          <Skeleton
            key={index}
            className={cn("h-4", width, lineClassName)}
            shimmer={shimmer}
          />
        )
      })}
    </div>
  )
}

export function SkeletonCard({
  className,
  hasHeader = true,
  hasFooter = false,
  shimmer = true,
}: SkeletonCardProps) {
  return (
    <div className={cn("border border-border rounded-2xl p-6 space-y-4", className)}>
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/3" shimmer={shimmer} />
          <Skeleton className="h-4 w-2/3" shimmer={shimmer} />
        </div>
      )}

      <div className="space-y-3">
        <SkeletonText lines={3} shimmer={shimmer} />
      </div>

      {hasFooter && (
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-8 w-20" shimmer={shimmer} />
          <Skeleton className="h-8 w-16" shimmer={shimmer} />
        </div>
      )}
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  shimmer = true,
}: SkeletonTableProps) {
  return (
    <div className={cn("border border-border rounded-2xl overflow-hidden", className)}>
      {/* Table header */}
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              className="h-4 flex-1"
              shimmer={shimmer}
            />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <motion.div
            key={rowIndex}
            className="p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rowIndex * 0.1 }}
          >
            <div className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`row-${rowIndex}-col-${colIndex}`}
                  className="h-4 flex-1"
                  shimmer={shimmer}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonAvatar({
  size = "md",
  className,
  shimmer = true,
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  }

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      shimmer={shimmer}
    />
  )
}

// Specialized skeleton for different layout patterns
export function SkeletonList({
  items = 5,
  className,
  shimmer = true,
}: {
  items?: number
  className?: string
  shimmer?: boolean
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <SkeletonAvatar shimmer={shimmer} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" shimmer={shimmer} />
            <Skeleton className="h-3 w-3/4" shimmer={shimmer} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function SkeletonStats({
  items = 4,
  className,
  shimmer = true,
}: {
  items?: number
  className?: string
  shimmer?: boolean
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          className="border border-border rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" shimmer={shimmer} />
            <Skeleton className="h-8 w-3/4" shimmer={shimmer} />
            <Skeleton className="h-3 w-full" shimmer={shimmer} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function SkeletonForm({
  fields = 5,
  className,
  shimmer = true,
}: {
  fields?: number
  className?: string
  shimmer?: boolean
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <motion.div
          key={index}
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Skeleton className="h-4 w-1/4" shimmer={shimmer} />
          <Skeleton className="h-9 w-full rounded-xl" shimmer={shimmer} />
        </motion.div>
      ))}

      <motion.div
        className="flex items-center justify-end gap-3 pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: fields * 0.1 + 0.2 }}
      >
        <Skeleton className="h-9 w-20 rounded-xl" shimmer={shimmer} />
        <Skeleton className="h-9 w-16 rounded-xl" shimmer={shimmer} />
      </motion.div>
    </div>
  )
}

// Add the shimmer animation to globals.css
export const skeletonStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
`
