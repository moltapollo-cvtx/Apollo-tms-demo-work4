"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretDown, Check, MagnifyingGlass, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  disabled?: boolean
  loading?: boolean
  error?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option...",
  multiple = false,
  searchable = false,
  disabled = false,
  loading = false,
  error = false,
  className,
  size = "md",
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    multiple ? (defaultValue as string[]) || [] : (defaultValue as string) || ""
  )

  const actualValue = value !== undefined ? value : internalValue
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  const handleValueChange = React.useCallback((newValue: string | string[]) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])

  const handleOptionClick = React.useCallback((optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(actualValue) ? actualValue : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      handleValueChange(newValues)
    } else {
      handleValueChange(optionValue)
      setIsOpen(false)
    }
  }, [multiple, actualValue, handleValueChange])

  const getDisplayValue = () => {
    if (multiple && Array.isArray(actualValue)) {
      if (actualValue.length === 0) return placeholder
      if (actualValue.length === 1) {
        const option = options.find(opt => opt.value === actualValue[0])
        return option?.label || actualValue[0]
      }
      return `${actualValue.length} items selected`
    } else {
      const option = options.find(opt => opt.value === actualValue)
      return option?.label || placeholder
    }
  }

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple && Array.isArray(actualValue)) {
      const newValues = actualValue.filter(v => v !== valueToRemove)
      handleValueChange(newValues)
    }
  }

  // Close on outside click and handle keyboard navigation
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isOpen) {
        switch (event.key) {
          case "Escape":
            setIsOpen(false)
            setSearchQuery("")
            break
          case "Enter":
          case " ":
            if (event.target && (event.target as HTMLElement).getAttribute('data-option')) {
              event.preventDefault()
              const optionValue = (event.target as HTMLElement).getAttribute('data-option')!
              handleOptionClick(optionValue)
            }
            break
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleOptionClick])

  const sizeClasses = {
    sm: "h-8 text-xs px-3",
    md: "h-9 text-sm px-3",
    lg: "h-10 text-base px-4",
  }

  const dropdownSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={cn(
          "relative w-full cursor-default rounded-2xl border bg-background text-left shadow-xs transition-all focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          sizeClasses[size],
          error && "border-destructive ring-destructive/20",
          disabled && "opacity-50 cursor-not-allowed",
          "hover:border-ring/50"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={multiple ? `Select multiple options. ${Array.isArray(actualValue) ? actualValue.length : 0} selected` : "Select an option"}
        whileTap={!disabled && !loading ? { scale: 0.99 } : undefined}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
      >
        <span className="block truncate text-foreground">
          {loading ? "Loading..." : getDisplayValue()}
        </span>

        {/* Selected values as badges for multi-select */}
        {multiple && Array.isArray(actualValue) && actualValue.length > 1 && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {actualValue.slice(0, 2).map((val) => {
              const option = options.find(opt => opt.value === val)
              return (
                <motion.div
                  key={val}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg text-xs font-medium"
                >
                  <span className="max-w-16 truncate">{option?.label || val}</span>
                  <X
                    className="size-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => removeValue(val, e)}
                  />
                </motion.div>
              )
            })}
          </div>
        )}

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <CaretDown className="size-4 text-muted-foreground" weight="bold" />
          </motion.div>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
            className="absolute z-50 mt-1 w-full rounded-2xl border bg-popover shadow-md"
            role="listbox"
            aria-multiselectable={multiple}
            aria-label={multiple ? "Options list (multiple selection allowed)" : "Options list"}
          >
            {searchable && (
              <div className="p-3 border-b">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 text-muted-foreground -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-2 bg-background border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search through available options"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            <div className={cn("max-h-60 overflow-auto p-1", dropdownSizeClasses[size])}>
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  {searchQuery ? "No options found" : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? Array.isArray(actualValue) && actualValue.includes(option.value)
                    : actualValue === option.value

                  return (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <button
                        type="button"
                        className={cn(
                          "relative w-full cursor-default select-none rounded-xl py-2 px-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                          option.disabled && "opacity-50 cursor-not-allowed",
                          isSelected && "bg-primary/10 text-primary"
                        )}
                        disabled={option.disabled}
                        onClick={() => !option.disabled && handleOptionClick(option.value)}
                        role="option"
                        aria-selected={isSelected}
                        aria-label={`${option.label}${isSelected ? ' (selected)' : ''}`}
                        data-option={option.value}
                        tabIndex={option.disabled ? -1 : 0}
                      >
                        <span className={cn("block truncate", isSelected && "font-medium")}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary"
                          >
                            <Check className="size-4" weight="bold" />
                          </motion.span>
                        )}
                      </button>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}