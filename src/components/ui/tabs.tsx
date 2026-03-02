"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface TabItem {
  value: string
  label: string
  disabled?: boolean
  badge?: string | number
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  variant?: "line" | "pills" | "cards"
  size?: "sm" | "md" | "lg"
  className?: string
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  variant: "line" | "pills" | "cards"
  size: "sm" | "md" | "lg"
} | null>(null)

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  children,
  variant = "line",
  size = "md",
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || tabs[0]?.value || "")
  const actualValue = value !== undefined ? value : internalValue

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: actualValue, onValueChange: handleValueChange, variant, size }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: TabsListProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsList must be used within Tabs")

  const { variant, size } = context

  const sizeClasses = {
    sm: "h-8 p-1",
    md: "h-9 p-1",
    lg: "h-10 p-1.5",
  }

  const variantClasses = {
    line: "border-b border-border bg-transparent",
    pills: cn("bg-muted rounded-2xl", sizeClasses[size]),
    cards: "bg-transparent border-b border-border",
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-start",
        variantClasses[variant],
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, disabled = false, className, children }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")

  const { value: selectedValue, onValueChange, variant, size } = context
  const isSelected = selectedValue === value
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-6 py-2 text-base",
  }

  const variantClasses = {
    line: cn(
      "relative px-4 py-2 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:text-foreground",
      "border-b-2 border-transparent data-[state=active]:border-primary",
      disabled ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground"
    ),
    pills: cn(
      "relative rounded-xl font-medium transition-all",
      sizeClasses[size],
      disabled ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
    ),
    cards: cn(
      "relative px-4 py-3 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:text-foreground",
      "border-b-2 border-transparent data-[state=active]:border-primary",
      disabled ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground"
    ),
  }

  return (
    <motion.button
      ref={triggerRef}
      className={cn(variantClasses[variant], className)}
      disabled={disabled}
      data-state={isSelected ? "active" : "inactive"}
      onClick={() => !disabled && onValueChange(value)}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      role="tab"
      aria-selected={isSelected}
    >
      {variant === "pills" && isSelected && (
        <motion.div
          layoutId="pill-background"
          className="absolute inset-0 bg-background border border-border rounded-xl shadow-sm"
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
      )}

      {variant === "line" && isSelected && (
        <motion.div
          layoutId="line-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
      )}

      {variant === "cards" && isSelected && (
        <motion.div
          layoutId="card-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")

  const { value: selectedValue } = context
  const isSelected = selectedValue === value

  return (
    <AnimatePresence mode="wait">
      {isSelected && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
          className={cn("mt-4", className)}
          role="tabpanel"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Convenience component for simple usage
export function SimpleTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  variant = "line",
  size = "md",
  className,
}: {
  tabs: (TabItem & { content: React.ReactNode })[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  variant?: "line" | "pills" | "cards"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  return (
    <Tabs
      tabs={tabs}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      variant={variant}
      size={size}
      className={className}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            <div className="flex items-center gap-2">
              {tab.label}
              {tab.badge && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 text-xs font-medium bg-primary/10 text-primary rounded-full px-1">
                  {tab.badge}
                </span>
              )}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}