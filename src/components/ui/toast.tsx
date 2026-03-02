"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Warning, XCircle, Info, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void
}

interface ToasterProps {
  className?: string
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
  maxToasts?: number
}

// Toast context for managing global toast state
const ToastContext = React.createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
  removeAllToasts: () => void
} | null>(null)

// Toast provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = React.useCallback((toastData: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2)
    const toast: Toast = {
      id,
      duration: 5000,
      ...toastData,
    }

    setToasts((prev) => [...prev, toast])

    // Auto remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }

    return id
  }, [removeToast])

  const removeAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts,
      }}
    >
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

// Hook to use toast functionality
export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  const { addToast, removeToast, removeAllToasts } = context

  // Convenience methods for different toast types
  const toast = React.useMemo(
    () => ({
      success: (title: string, description?: string, options?: Partial<Toast>) =>
        addToast({ ...options, type: "success", title, description }),
      error: (title: string, description?: string, options?: Partial<Toast>) =>
        addToast({ ...options, type: "error", title, description }),
      warning: (title: string, description?: string, options?: Partial<Toast>) =>
        addToast({ ...options, type: "warning", title, description }),
      info: (title: string, description?: string, options?: Partial<Toast>) =>
        addToast({ ...options, type: "info", title, description }),
      custom: (toast: Omit<Toast, "id">) => addToast(toast),
      dismiss: removeToast,
      dismissAll: removeAllToasts,
    }),
    [addToast, removeToast, removeAllToasts]
  )

  return toast
}

// Individual toast component
function ToastComponent({ id, type, title, description, action, onRemove }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: Warning,
    info: Info,
  }

  const Icon = icons[type]

  const typeStyles = {
    success: "border-apollo-cyan-200 bg-apollo-cyan-50 dark:border-apollo-cyan-800 dark:bg-apollo-cyan-950",
    error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  }

  const iconColors = {
    success: "text-apollo-cyan-600 dark:text-apollo-cyan-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, x: 100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 100 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm max-w-md w-full",
        typeStyles[type]
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", iconColors[type])} weight="fill" />

      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
        {action && (
          <motion.button
            onClick={action.onClick}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            {action.label}
          </motion.button>
        )}
      </div>

      <motion.button
        onClick={() => onRemove(id)}
        className="shrink-0 p-1 rounded-lg hover:bg-zinc-950/5 dark:hover:bg-white/5 transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        <X className="size-4 text-muted-foreground" weight="bold" />
        <span className="sr-only">Close</span>
      </motion.button>
    </motion.div>
  )
}

// Toaster container component
export function Toaster({ className, position = "top-right", maxToasts = 5 }: ToasterProps) {
  const context = React.useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  const displayedToasts = toasts.slice(-maxToasts)

  const positionStyles = {
    "top-right": "top-4 right-4 sm:top-6 sm:right-6",
    "top-left": "top-4 left-4 sm:top-6 sm:left-6",
    "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
    "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
    "top-center": "top-4 left-1/2 -translate-x-1/2 sm:top-6",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6",
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 pointer-events-none",
        positionStyles[position],
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {displayedToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent {...toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Default toast instances for convenience
export const toast = {
  success: (title: string, description?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", title, description },
        })
      )
    }
  },
  error: (title: string, description?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", title, description },
        })
      )
    }
  },
  warning: (title: string, description?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "warning", title, description },
        })
      )
    }
  },
  info: (title: string, description?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "info", title, description },
        })
      )
    }
  },
}
