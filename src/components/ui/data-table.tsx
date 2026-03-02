"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CaretUp,
  CaretDown,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  DotsThree,
  X,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

type BivariantCallback<Args extends unknown[], ReturnType> = {
  bivarianceHack(...args: Args): ReturnType
}["bivarianceHack"]

export interface Column<T = unknown> {
  key: string
  title: string
  sortable?: boolean
  filterable?: boolean
  filterOptions?: Array<{ value: string; label: string }>
  getFilterValue?: (row: T) => string | number | boolean | null | undefined
  render?: BivariantCallback<[value: unknown, row: T, index: number], React.ReactNode>
  width?: string | number
  align?: "left" | "center" | "right"
  className?: string
}

export interface DataTableProps<T = unknown> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  emptyState?: {
    icon?: React.ReactNode
    title?: string
    description?: string
    action?: {
      label: string
      onClick: () => void
      variant?: "primary" | "outline" | "secondary"
    }
  }
  searchable?: boolean
  searchPlaceholder?: string
  filterable?: boolean
  sortable?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    pageSizeOptions?: number[]
  }
  defaultPageSize?: number
  defaultPageSizeOptions?: number[]
  onSort?: (key: string, direction: "asc" | "desc" | null) => void
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, string>) => void
  className?: string
  rowClassName?: (row: T, index: number) => string
  onRowClick?: (row: T, index: number) => void
  selection?: {
    selectedRows: string[]
    onSelectionChange: (selectedRows: string[]) => void
    getRowId: (row: T) => string
  }
}

type SortState = {
  key: string | null
  direction: "asc" | "desc" | null
}

const ALL_FILTER_VALUE = "__all"

function toLowerText(value: unknown): string {
  if (value == null) return ""
  if (value instanceof Date) return value.toISOString().toLowerCase()
  if (typeof value === "string") return value.toLowerCase()
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).toLowerCase()
  }
  if (Array.isArray(value)) {
    return value.map((entry) => toLowerText(entry)).join(" ")
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((entry) => toLowerText(entry))
      .join(" ")
  }
  return ""
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" })
}

function getRowValue<T>(row: T, key: string): unknown {
  const record = row as Record<string, unknown>
  return record[key]
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.tr
          key={`skeleton-row-${rowIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.04 }}
          className="border-b border-border"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="p-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </motion.tr>
      ))}
    </>
  )
}

function SkeletonCards({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={`skeleton-card-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
          </div>
        </motion.div>
      ))}
    </>
  )
}

export function DataTable<T = unknown>({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  emptyState,
  searchable = true,
  searchPlaceholder = "Search...",
  filterable = true,
  sortable = true,
  pagination,
  defaultPageSize = 10,
  defaultPageSizeOptions = [10, 25, 50, 100],
  onSort,
  onSearch,
  onFilter,
  className,
  rowClassName,
  onRowClick,
  selection,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortState, setSortState] = React.useState<SortState>({ key: null, direction: null })
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [internalPage, setInternalPage] = React.useState(1)
  const [internalPageSize, setInternalPageSize] = React.useState(defaultPageSize)

  const isExternalPagination = Boolean(pagination)
  const isExternalSorting = Boolean(onSort)
  const isExternalSearch = Boolean(onSearch)

  const activeFilterColumns = React.useMemo(() => {
    if (!filterable) return []

    return columns.filter((column) => {
      if (column.filterable === true) return true
      if (column.filterable === false) return false

      const sampleValues = data
        .slice(0, 50)
        .map((row) => (column.getFilterValue ? column.getFilterValue(row) : getRowValue(row, column.key)))
        .filter((value) => value !== null && value !== undefined && String(value).trim().length > 0)

      if (sampleValues.length === 0) return false

      const hasComplexObject = sampleValues.some(
        (value) => typeof value === "object" && !(value instanceof Date)
      )
      if (hasComplexObject) return false

      const hasCategoricalValues = sampleValues.some(
        (value) => typeof value === "string" || typeof value === "boolean"
      )
      if (!hasCategoricalValues) return false

      const uniqueCount = new Set(sampleValues.map((value) => String(value))).size
      return uniqueCount <= 30
    })
  }, [columns, data, filterable])

  const filterOptionsByColumn = React.useMemo(() => {
    return activeFilterColumns.reduce<Record<string, Array<{ value: string; label: string }>>>(
      (acc, column) => {
        if (column.filterOptions && column.filterOptions.length > 0) {
          acc[column.key] = column.filterOptions
          return acc
        }

        const uniqueValues = new Set<string>()

        for (const row of data) {
          const filterSource = column.getFilterValue ? column.getFilterValue(row) : getRowValue(row, column.key)
          const textValue = String(filterSource ?? "").trim()
          if (!textValue) continue
          uniqueValues.add(textValue)
        }

        acc[column.key] = Array.from(uniqueValues)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
          .map((value) => ({ value, label: value }))

        return acc
      },
      {}
    )
  }, [activeFilterColumns, data])

  const hasActiveFilters = React.useMemo(
    () => Object.values(filters).some((value) => value !== ALL_FILTER_VALUE),
    [filters]
  )

  React.useEffect(() => {
    setFilters((prev) => {
      if (activeFilterColumns.length === 0) {
        return Object.keys(prev).length > 0 ? {} : prev
      }

      const next: Record<string, string> = {}
      for (const column of activeFilterColumns) {
        next[column.key] = prev[column.key] || ALL_FILTER_VALUE
      }

      const hasSameKeys = Object.keys(prev).length === Object.keys(next).length
      const hasSameValues = hasSameKeys && Object.entries(next).every(([key, value]) => prev[key] === value)
      return hasSameValues ? prev : next
    })
  }, [activeFilterColumns])

  const filteredAndSortedData = React.useMemo(() => {
    let workingRows = [...data]

    if (searchable && !isExternalSearch && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()

      workingRows = workingRows.filter((row, index) => {
        return columns.some((column) => {
          const rawValue = getRowValue(row, column.key)
          const rendered = column.render?.(rawValue, row, index)

          if (typeof rendered === "string" || typeof rendered === "number") {
            return String(rendered).toLowerCase().includes(query)
          }

          return toLowerText(rawValue).includes(query)
        })
      })
    }

    if (activeFilterColumns.length > 0) {
      for (const column of activeFilterColumns) {
        const activeValue = filters[column.key]
        if (!activeValue || activeValue === ALL_FILTER_VALUE) continue

        workingRows = workingRows.filter((row) => {
          const filterSource = column.getFilterValue ? column.getFilterValue(row) : getRowValue(row, column.key)
          return String(filterSource ?? "") === activeValue
        })
      }
    }

    if (sortable && !isExternalSorting && sortState.key && sortState.direction) {
      const sortColumn = columns.find((column) => column.key === sortState.key)
      if (sortColumn) {
        workingRows.sort((rowA, rowB) => {
          const valueA = getRowValue(rowA, sortColumn.key)
          const valueB = getRowValue(rowB, sortColumn.key)
          const result = compareValues(valueA, valueB)
          return sortState.direction === "asc" ? result : -result
        })
      }
    }

    return workingRows
  }, [
    activeFilterColumns,
    columns,
    data,
    filters,
    isExternalSearch,
    isExternalSorting,
    searchQuery,
    searchable,
    sortState.direction,
    sortState.key,
    sortable,
  ])

  const pageSizeOptions = pagination?.pageSizeOptions || defaultPageSizeOptions
  const currentPage = pagination?.page ?? internalPage
  const currentPageSize = pagination?.pageSize ?? internalPageSize
  const totalRows = pagination?.total ?? filteredAndSortedData.length
  const totalPages = Math.max(1, Math.ceil(Math.max(totalRows, 1) / currentPageSize))

  React.useEffect(() => {
    if (isExternalPagination) return
    setInternalPage((prev) => Math.min(Math.max(prev, 1), totalPages))
  }, [isExternalPagination, totalPages])

  React.useEffect(() => {
    if (isExternalPagination) return
    setInternalPageSize(defaultPageSize)
  }, [defaultPageSize, isExternalPagination])

  const paginatedData = React.useMemo(() => {
    if (isExternalPagination) return filteredAndSortedData

    const start = (currentPage - 1) * currentPageSize
    return filteredAndSortedData.slice(start, start + currentPageSize)
  }, [currentPage, currentPageSize, filteredAndSortedData, isExternalPagination])

  const tableRows = paginatedData

  const handleSort = (key: string) => {
    if (!sortable) return

    let newDirection: "asc" | "desc" | null = "asc"

    if (sortState.key === key) {
      if (sortState.direction === "asc") {
        newDirection = "desc"
      } else if (sortState.direction === "desc") {
        newDirection = null
      }
    }

    const nextState: SortState = {
      key: newDirection ? key : null,
      direction: newDirection,
    }

    setSortState(nextState)
    onSort?.(key, newDirection)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setInternalPage(1)
    onSearch?.(query)
  }

  const handleFilterChange = (columnKey: string, value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] : value
    const nextFilters = {
      ...filters,
      [columnKey]: selectedValue,
    }

    setFilters(nextFilters)
    setInternalPage(1)

    const outboundFilters = Object.fromEntries(
      Object.entries(nextFilters).filter(([, filterValue]) => filterValue !== ALL_FILTER_VALUE)
    )

    onFilter?.(outboundFilters)
  }

  const clearFilters = () => {
    const resetFilters: Record<string, string> = {}
    for (const column of activeFilterColumns) {
      resetFilters[column.key] = ALL_FILTER_VALUE
    }
    setFilters(resetFilters)
    setInternalPage(1)
    onFilter?.({})
  }

  const getSortIcon = (columnKey: string) => {
    if (sortState.key !== columnKey) {
      return <DotsThree className="size-3 rotate-90 text-muted-foreground" />
    }

    return sortState.direction === "asc" ? (
      <CaretUp className="size-3 text-foreground" weight="bold" />
    ) : (
      <CaretDown className="size-3 text-foreground" weight="bold" />
    )
  }

  const visibleRowIds = React.useMemo(() => {
    if (!selection) return []
    return tableRows.map((row) => selection.getRowId(row))
  }, [selection, tableRows])

  const isAllSelected = selection
    ? visibleRowIds.length > 0 && visibleRowIds.every((id) => selection.selectedRows.includes(id))
    : false

  const isIndeterminate = selection
    ? visibleRowIds.some((id) => selection.selectedRows.includes(id)) && !isAllSelected
    : false

  const handleSelectAll = () => {
    if (!selection) return

    if (isAllSelected) {
      const rowsAfterRemove = selection.selectedRows.filter((id) => !visibleRowIds.includes(id))
      selection.onSelectionChange(rowsAfterRemove)
      return
    }

    const next = Array.from(new Set([...selection.selectedRows, ...visibleRowIds]))
    selection.onSelectionChange(next)
  }

  const handleRowSelect = (rowId: string) => {
    if (!selection) return

    if (selection.selectedRows.includes(rowId)) {
      selection.onSelectionChange(selection.selectedRows.filter((id) => id !== rowId))
      return
    }

    selection.onSelectionChange([...selection.selectedRows, rowId])
  }

  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * currentPageSize + 1
  const endRow = totalRows === 0 ? 0 : Math.min(currentPage * currentPageSize, totalRows)
  const canChangePageSize = !isExternalPagination || Boolean(pagination?.onPageSizeChange)

  const changePage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages)

    if (isExternalPagination) {
      pagination?.onPageChange(boundedPage)
      return
    }

    setInternalPage(boundedPage)
  }

  const changePageSize = (value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] : value
    const nextPageSize = Number(selectedValue)
    if (Number.isNaN(nextPageSize) || nextPageSize <= 0) return

    if (isExternalPagination) {
      pagination?.onPageSizeChange?.(nextPageSize)
      return
    }

    setInternalPageSize(nextPageSize)
    setInternalPage(1)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(searchable || activeFilterColumns.length > 0) && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {searchable && (
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => handleSearch(event.target.value)}
                  className="h-9 w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
              </div>
            )}

            {activeFilterColumns.map((column) => {
              const options = filterOptionsByColumn[column.key] || []
              return (
                <Select
                  key={column.key}
                  value={filters[column.key] || ALL_FILTER_VALUE}
                  onValueChange={(value) => handleFilterChange(column.key, value)}
                  options={[
                    { value: ALL_FILTER_VALUE, label: `All ${column.title}` },
                    ...options,
                  ]}
                  size="sm"
                  className="min-w-40"
                />
              )
            })}

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="size-4" />
                Clear filters
              </Button>
            )}
          </div>

          {selection && selection.selectedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-muted-foreground"
            >
              <span className="font-mono">{selection.selectedRows.length}</span> selected
            </motion.div>
          )}
        </div>
      )}

      <div className="hidden overflow-hidden rounded-2xl border border-border sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {selection && (
                  <th className="w-12 p-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = isIndeterminate
                          }
                        }}
                        onChange={handleSelectAll}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </div>
                  </th>
                )}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "border-b border-border p-4 text-left font-medium text-muted-foreground",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable !== false &&
                        sortable &&
                        "cursor-pointer select-none transition-colors hover:text-foreground",
                      column.className
                    )}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={() => column.sortable !== false && sortable && handleSort(column.key)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      <span className="text-sm">{column.title}</span>
                      {column.sortable !== false && sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <AnimatePresence mode="wait">
                {loading ? (
                  <SkeletonRows
                    key="desktop-skeleton"
                    columns={columns.length + (selection ? 1 : 0)}
                    rows={currentPageSize}
                  />
                ) : error ? (
                  <tr key="desktop-error">
                    <td colSpan={columns.length + (selection ? 1 : 0)} className="p-8 text-center">
                      <div className="text-destructive">{error}</div>
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr key="desktop-empty">
                    <td colSpan={columns.length + (selection ? 1 : 0)} className="p-0">
                      {emptyState ? (
                        <EmptyState
                          icon={emptyState.icon}
                          title={emptyState.title || "No data found"}
                          description={emptyState.description || "There are no items to display at the moment."}
                          action={emptyState.action}
                          size="sm"
                        />
                      ) : (
                        <div className="px-6 py-8 text-center text-muted-foreground">{emptyMessage}</div>
                      )}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, index) => {
                    const rowId = selection?.getRowId(row)
                    const isSelected = rowId ? selection?.selectedRows.includes(rowId) : false
                    const fallbackRowId =
                      rowId ||
                      (() => {
                        const rowValue = getRowValue(row, "id")
                        if (typeof rowValue === "string" || typeof rowValue === "number") {
                          return String(rowValue)
                        }
                        return `row-${index}`
                      })()

                    return (
                      <motion.tr
                        key={fallbackRowId}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={cn(
                          "border-b border-border transition-colors hover:bg-muted/50",
                          isSelected && "bg-primary/5",
                          onRowClick && "cursor-pointer",
                          rowClassName?.(row, index)
                        )}
                        onClick={() => onRowClick?.(row, index)}
                      >
                        {selection && (
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={Boolean(isSelected)}
                                onChange={() => rowId && handleRowSelect(rowId)}
                                onClick={(event) => event.stopPropagation()}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                            </div>
                          </td>
                        )}

                        {columns.map((column) => {
                          const value = getRowValue(row, column.key)
                          const cellContent = column.render ? column.render(value, row, index) : value

                          return (
                            <td
                              key={column.key}
                              className={cn(
                                "p-4 text-sm",
                                column.align === "center" && "text-center",
                                column.align === "right" && "text-right",
                                (typeof value === "number" ||
                                  (typeof value === "string" && /^[$€£-]?\d[\d,.%]*$/.test(value.trim()))) &&
                                  "font-mono tabular-nums",
                                column.className
                              )}
                              style={column.width ? { width: column.width } : undefined}
                            >
                              {cellContent as React.ReactNode}
                            </td>
                          )
                        })}
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 sm:hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <SkeletonCards key="mobile-skeleton" rows={currentPageSize} />
          ) : error ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="text-destructive">{error}</div>
            </div>
          ) : tableRows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              {emptyState ? (
                <EmptyState
                  icon={emptyState.icon}
                  title={emptyState.title || "No data found"}
                  description={emptyState.description || "There are no items to display at the moment."}
                  action={emptyState.action}
                  size="sm"
                />
              ) : (
                <div className="text-muted-foreground">{emptyMessage}</div>
              )}
            </div>
          ) : (
            tableRows.map((row, index) => {
              const rowId = selection?.getRowId(row)
              const isSelected = rowId ? selection?.selectedRows.includes(rowId) : false
              const fallbackRowId =
                rowId ||
                (() => {
                  const rowValue = getRowValue(row, "id")
                  if (typeof rowValue === "string" || typeof rowValue === "number") {
                    return String(rowValue)
                  }
                  return `mobile-row-${index}`
                })()

              return (
                <motion.div
                  key={fallbackRowId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className={cn(
                    "rounded-2xl border border-border bg-card p-4 shadow-sm",
                    isSelected && "border-primary/20 bg-primary/5",
                    onRowClick && "cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    rowClassName?.(row, index)
                  )}
                  onClick={() => onRowClick?.(row, index)}
                  role={onRowClick ? "button" : "article"}
                  aria-label={onRowClick ? `Click to view details for item ${index + 1}` : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onRowClick(row, index)
                    }
                  } : undefined}
                >
                  {selection && rowId && (
                    <div className="mb-3 flex items-center justify-end">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(rowId)}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                        aria-label={`Select item ${index + 1}`}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    {columns.slice(0, 4).map((column) => {
                      const value = getRowValue(row, column.key)
                      const cellContent = column.render ? column.render(value, row, index) : value

                      if (!cellContent && cellContent !== 0) return null

                      return (
                        <div key={column.key} className="flex items-start justify-between gap-3">
                          <span className="flex-shrink-0 text-sm font-medium text-muted-foreground">
                            {column.title}:
                          </span>
                          <div className="min-w-0 flex-1 text-right text-sm">{cellContent as React.ReactNode}</div>
                        </div>
                      )
                    })}

                    {columns.length > 4 && (
                      <div className="border-t border-border/50 pt-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {columns.slice(4).map((column) => {
                            const value = getRowValue(row, column.key)
                            const cellContent = column.render ? column.render(value, row, index) : value

                            if (!cellContent && cellContent !== 0) return null

                            return (
                              <div key={column.key} className="space-y-1">
                                <div className="truncate font-medium text-muted-foreground">{column.title}</div>
                                <div className="min-w-0">{cellContent as React.ReactNode}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            Showing <span className="font-mono">{startRow}</span> to <span className="font-mono">{endRow}</span> of{" "}
            <span className="font-mono">{totalRows}</span> results
          </span>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={changePageSize}
              options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
              size="sm"
              className="w-20"
              disabled={!canChangePageSize}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}>
            <CaretLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <CaretRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
