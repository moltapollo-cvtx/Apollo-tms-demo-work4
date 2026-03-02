"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

interface ModalContentProps {
  className?: string
  children: React.ReactNode
}

interface ModalHeaderProps {
  className?: string
  children: React.ReactNode
}

interface ModalTitleProps {
  className?: string
  children: React.ReactNode
}

interface ModalDescriptionProps {
  className?: string
  children: React.ReactNode
}

interface ModalBodyProps {
  className?: string
  children: React.ReactNode
}

interface ModalFooterProps {
  className?: string
  children: React.ReactNode
}

const ModalContext = React.createContext<{
  onClose: () => void
} | null>(null)

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
}

export function Modal({ open, onOpenChange, children, size = "md" }: ModalProps) {
  const onClose = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  return (
    <ModalContext.Provider value={{ onClose }}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 30,
                  rotateX: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  rotateX: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: 20,
                  rotateX: -5,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                  mass: 0.7,
                }}
                className={cn(
                  "relative w-full bg-card border border-border rounded-3xl shadow-lg",
                  sizeClasses[size],
                  size === "full" ? "h-[calc(100vh-2rem)]" : "max-h-[90vh]"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  )
}

export function ModalContent({ className, children }: ModalContentProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {children}
    </div>
  )
}

export function ModalHeader({ className, children }: ModalHeaderProps) {
  const context = React.useContext(ModalContext)

  return (
    <div className={cn("flex items-center justify-between p-6 border-b border-border", className)}>
      <div className="flex-1">{children}</div>
      <motion.button
        onClick={context?.onClose}
        className="ml-4 p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors"
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        <X className="size-4" weight="bold" />
        <span className="sr-only">Close</span>
      </motion.button>
    </div>
  )
}

export function ModalTitle({ className, children }: ModalTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}>
      {children}
    </h2>
  )
}

export function ModalDescription({ className, children }: ModalDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1", className)}>
      {children}
    </p>
  )
}

export function ModalBody({ className, children }: ModalBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-6", className)}>
      {children}
    </div>
  )
}

export function ModalFooter({ className, children }: ModalFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3 p-6 border-t border-border", className)}>
      {children}
    </div>
  )
}

// Convenience hook for modal state
export function useModal(defaultOpen = false) {
  const [open, setOpen] = React.useState(defaultOpen)

  const openModal = React.useCallback(() => setOpen(true), [])
  const closeModal = React.useCallback(() => setOpen(false), [])
  const toggleModal = React.useCallback(() => setOpen(prev => !prev), [])

  return {
    open,
    setOpen,
    openModal,
    closeModal,
    toggleModal,
  }
}

// Confirmation dialog preset
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "primary" | "danger"
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onOpenChange(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Simple Modal wrapper with title and onClose support
interface SimpleModalProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  title?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  children: React.ReactNode
}

export function SimpleModal({
  isOpen,
  open,
  onClose,
  title,
  size = "md",
  children
}: SimpleModalProps) {
  const modalOpen = isOpen !== undefined ? isOpen : open !== undefined ? open : false;

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open && onClose) {
      onClose()
    }
  }, [onClose])

  if (!onClose) {
    return null
  }

  return (
    <Modal open={modalOpen} onOpenChange={handleOpenChange} size={size}>
      <ModalContent>
        {title && (
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
          </ModalHeader>
        )}
        <ModalBody>
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}