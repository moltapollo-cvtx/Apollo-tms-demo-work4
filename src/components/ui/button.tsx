import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import { motion } from "framer-motion"
import { CircleNotch } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        danger:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-xl",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  children: React.ReactNode
}

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const buttonContent = (
    <>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <CircleNotch
            className={cn(
              "animate-spin",
              size === "sm" && "size-3.5",
              size === "md" && "size-4",
              size === "lg" && "size-4"
            )}
            weight="bold"
          />
        </motion.div>
      )}
      {!loading && children}
    </>
  )

  if (asChild) {
    return (
      <Slot
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {buttonContent}
      </Slot>
    )
  }

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {buttonContent}
    </motion.button>
  )
}

export { Button, buttonVariants }
