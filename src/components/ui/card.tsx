"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  padding?: "none" | "sm" | "md" | "lg"
  interactive?: boolean
  loading?: boolean
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  interactive = false,
  loading = false,
  className,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-card border border-border shadow-xs",
    outline: "bg-transparent border border-border",
    ghost: "bg-transparent border-transparent",
  }

  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }

  const baseClassName = cn(
    "rounded-2xl transition-colors",
    variants[variant],
    !interactive && padding !== "none" && paddingClasses[padding],
    interactive && "cursor-pointer hover:bg-accent/50",
    loading && "animate-pulse",
    className
  )

  if (interactive) {
    return (
      <motion.div
        className={baseClassName}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {padding !== "none" ? (
          <div className={paddingClasses[padding]}>{children}</div>
        ) : (
          children
        )}
      </motion.div>
    )
  }

  return (
    <div
      className={baseClassName}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("pt-0", className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn("flex items-center pt-0", className)} {...props}>
      {children}
    </div>
  )
}

// Stat card for KPIs and metrics
interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
    trend?: "up" | "down" | "neutral"
  }
  description?: string
  className?: string
}

export function StatCard({ title, value, change, description, className }: StatCardProps) {
  const getTrendColor = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-apollo-cyan-600 dark:text-apollo-cyan-400"
      case "down":
        return "text-red-600 dark:text-red-400"
      case "neutral":
      default:
        return "text-muted-foreground"
    }
  }

  const formatChange = (changeValue: number) => {
    const prefix = changeValue > 0 ? "+" : ""
    return `${prefix}${changeValue}%`
  }

  return (
    <Card variant="default" padding="md" className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-mono">{value}</CardTitle>
      </CardHeader>
      {(change || description) && (
        <CardContent>
          {change && (
            <p className={cn("text-xs font-medium", getTrendColor(change.trend))}>
              {formatChange(change.value)} from {change.period}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Loading card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card loading padding="md" className={className}>
      <CardHeader>
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </CardContent>
    </Card>
  )
}
