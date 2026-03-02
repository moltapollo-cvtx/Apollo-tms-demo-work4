"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  keywords?: string[]
  group?: string
  action: () => void
  shortcut?: string[]
}

export interface CommandGroup {
  id: string
  title: string
  items: CommandItem[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandItem[]
  groups?: CommandGroup[]
  placeholder?: string
  emptyMessage?: string
  className?: string
}

interface CommandPaletteProviderProps {
  children: React.ReactNode
  items: CommandItem[]
  groups?: CommandGroup[]
}

// Context for command palette state
const CommandPaletteContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  items: CommandItem[]
  groups?: CommandGroup[]
} | null>(null)

export function CommandPaletteProvider({ children, items, groups }: CommandPaletteProviderProps) {
  const [open, setOpen] = React.useState(false)

  // Listen for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }

      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, items, groups }}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        groups={groups}
      />
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext)
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return context
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  groups,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter and group items
  const filteredData = React.useMemo(() => {
    const lowercaseQuery = query.toLowerCase()

    const filterItems = (itemList: CommandItem[]) => {
      if (!query) return itemList

      return itemList.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(lowercaseQuery)
        const descMatch = item.description?.toLowerCase().includes(lowercaseQuery)
        const keywordMatch = item.keywords?.some(keyword =>
          keyword.toLowerCase().includes(lowercaseQuery)
        )
        return titleMatch || descMatch || keywordMatch
      })
    }

    if (groups) {
      return groups
        .map(group => ({
          ...group,
          items: filterItems(group.items)
        }))
        .filter(group => group.items.length > 0)
    }

    return [{ id: "default", title: "", items: filterItems(items) }]
  }, [query, items, groups])

  // Flatten all items for keyboard navigation
  const allFilteredItems = React.useMemo(() => {
    return filteredData.flatMap(group => group.items)
  }, [filteredData])

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement

    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      })
    }
  }, [selectedIndex])

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < allFilteredItems.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case "Enter":
        e.preventDefault()
        if (allFilteredItems[selectedIndex]) {
          allFilteredItems[selectedIndex].action()
          onOpenChange(false)
        }
        break
      case "Escape":
        e.preventDefault()
        onOpenChange(false)
        break
    }
  }

  const handleItemClick = (item: CommandItem) => {
    item.action()
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Command palette */}
          <div className="fixed inset-0 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
              }}
              className={cn(
                "w-full max-w-2xl bg-background border border-border rounded-2xl shadow-lg overflow-hidden",
                className
              )}
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <MagnifyingGlass className="size-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-80 overflow-y-auto py-2"
              >
                {allFilteredItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredData.map((group, groupIndex) => (
                      <div key={group.id}>
                        {group.title && (
                          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {group.title}
                          </div>
                        )}
                        {group.items.map((item, itemIndex) => {
                          const globalIndex = filteredData
                            .slice(0, groupIndex)
                            .reduce((acc, g) => acc + g.items.length, 0) + itemIndex
                          const isSelected = selectedIndex === globalIndex

                          return (
                            <motion.button
                              type="button"
                              key={item.id}
                              data-index={globalIndex}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-3 mx-2 rounded-xl cursor-pointer transition-colors text-left touch-manipulation active:bg-primary/15 active:scale-[0.98]",
                                isSelected
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                              onClick={() => handleItemClick(item)}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                handleItemClick(item);
                              }}
                              whileHover={{ x: 2 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                              }}
                            >
                              {item.icon && (
                                <item.icon className="size-4 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              {item.shortcut && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {item.shortcut.map((key, index) => (
                                    <React.Fragment key={index}>
                                      <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">
                                        {key}
                                      </kbd>
                                      {index < item.shortcut!.length - 1 && (
                                        <span className="text-muted-foreground">+</span>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}
                              {isSelected && (
                                <ArrowRight className="size-4 text-primary" />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border">↑↓</kbd>
                    <span>to navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border">⏎</kbd>
                    <span>to select</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border">esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Helper hook for triggering command palette
export function useCommandPaletteShortcut() {
  const { setOpen } = useCommandPalette()

  return React.useCallback(() => {
    setOpen(true)
  }, [setOpen])
}