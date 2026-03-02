"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X } from "@phosphor-icons/react"
import * as SheetPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      asChild
      {...props}
    >
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
        className={cn("fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm", className)}
      />
    </SheetPrimitive.Overlay>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const getInitialPosition = () => {
    switch (side) {
      case "right": return { x: "100%" }
      case "left": return { x: "-100%" }
      case "top": return { y: "-100%" }
      case "bottom": return { y: "100%" }
      default: return { x: "100%" }
    }
  }

  const getExitPosition = () => {
    switch (side) {
      case "right": return { x: "100%" }
      case "left": return { x: "-100%" }
      case "top": return { y: "-100%" }
      case "bottom": return { y: "100%" }
      default: return { x: "100%" }
    }
  }

  const getPositionClasses = () => {
    switch (side) {
      case "right": return "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm"
      case "left": return "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm"
      case "top": return "inset-x-0 top-0 h-auto border-b"
      case "bottom": return "inset-x-0 bottom-0 h-auto border-t"
      default: return "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm"
    }
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        asChild
        {...props}
      >
        <motion.div
          initial={getInitialPosition()}
          animate={{ x: 0, y: 0 }}
          exit={getExitPosition()}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 25,
            mass: 0.7,
          }}
          className={cn(
            "bg-background fixed z-50 flex flex-col gap-4 shadow-lg border border-border rounded-2xl",
            getPositionClasses(),
            className
          )}
        >
          {children}
          {showCloseButton && (
            <motion.button
              className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xl opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none p-2 hover:bg-accent hover:text-accent-foreground"
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </motion.button>
          )}
        </motion.div>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
