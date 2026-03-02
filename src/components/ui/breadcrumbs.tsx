"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CaretRight, House } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: React.ComponentType<{ className?: string }>
  maxItems?: number
  className?: string
  size?: "sm" | "md" | "lg"
  showHome?: boolean
}

export function Breadcrumbs({
  items,
  separator: Separator = CaretRight,
  maxItems,
  className,
  size = "md",
  showHome = true,
}: BreadcrumbsProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const iconSizeClasses = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  }

  // Add home item if requested and not already present
  const allItems = React.useMemo(() => {
    const hasHome = items.some(item => item.href === "/" || item.label.toLowerCase() === "home")
    if (showHome && !hasHome && items.length > 0) {
      return [
        { label: "Home", href: "/", icon: House },
        ...items,
      ]
    }
    return items
  }, [items, showHome])

  // Truncate items if maxItems is specified
  const displayItems = React.useMemo(() => {
    if (!maxItems || allItems.length <= maxItems) {
      return allItems
    }

    const firstItem = allItems[0]
    const lastItems = allItems.slice(-(maxItems - 2))
    const currentItem = allItems[allItems.length - 1]

    return [
      firstItem,
      { label: "...", href: undefined },
      ...lastItems.slice(0, -1),
      currentItem,
    ]
  }, [allItems, maxItems])

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const content = (
      <div className="flex items-center gap-1.5">
        {item.icon && (
          <item.icon className={cn(iconSizeClasses[size], "shrink-0")} />
        )}
        <span className={cn(isLast ? "font-medium" : "")}>
          {item.label}
        </span>
      </div>
    )

    if (item.href && !isLast) {
      return (
        <motion.div
          key={item.href || index}
          whileHover={{ x: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        >
          <Link
            href={item.href}
            className={cn(
              "inline-flex items-center hover:text-foreground transition-colors",
              isLast ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {content}
          </Link>
        </motion.div>
      )
    }

    return (
      <span
        key={item.label + index}
        className={cn(
          "inline-flex items-center",
          isLast ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {content}
      </span>
    )
  }

  if (displayItems.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex items-center gap-1", sizeClasses[size])}>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1

          return (
            <li key={item.href || item.label + index} className="flex items-center gap-1">
              {renderBreadcrumbItem(item, index, isLast)}

              {!isLast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                  className="flex items-center"
                >
                  <Separator className={cn(iconSizeClasses[size], "text-muted-foreground mx-1")} />
                </motion.div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Convenience hook for building breadcrumb items from pathname
export function useBreadcrumbsFromPath(pathname: string, routeMap?: Record<string, string>) {
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const items: BreadcrumbItem[] = []

    let currentPath = ""
    segments.forEach((segment) => {
      currentPath += `/${segment}`
      const label = routeMap?.[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)

      items.push({
        label,
        href: currentPath,
      })
    })

    // Mark the last item as current
    if (items.length > 0) {
      items[items.length - 1].current = true
    }

    return items
  }, [pathname, routeMap])
}

// Skeleton for loading state
export function BreadcrumbsSkeleton({
  items = 3,
  className,
  size = "md"
}: {
  items?: number
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-3",
    md: "h-4",
    lg: "h-5",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <React.Fragment key={index}>
          <div className={cn("bg-muted animate-pulse rounded", sizeClasses[size], "w-16")} />
          {index < items - 1 && (
            <div className={cn("bg-muted animate-pulse rounded", sizeClasses[size], "w-2")} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}