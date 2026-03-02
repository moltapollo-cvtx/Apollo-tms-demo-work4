"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Truck,
  Plus,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { SimpleTabs } from "@/components/ui/tabs"
import { useTractors, useTrailers } from "@/lib/hooks/api/use-equipment"
import type { EquipmentStatus, TractorWithDetails, TrailerWithDetails } from "@/types"
import { cn } from "@/lib/utils"

interface EquipmentListProps {
  onAddEquipment?: () => void
  onViewEquipment?: (id: number, type: 'tractor' | 'trailer') => void
}

export function EquipmentList({ onAddEquipment, onViewEquipment }: EquipmentListProps) {
  const [activeTab, setActiveTab] = useState<"tractors" | "trailers">("tractors")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Fetch tractors
  const {
    data: tractorsResponse,
    isLoading: tractorsLoading,
    error: tractorsError
  } = useTractors({
    page,
    pageSize,
    search: searchQuery,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    include: ['currentAssignment']
  })

  // Fetch trailers
  const {
    data: trailersResponse,
    isLoading: trailersLoading,
    error: trailersError
  } = useTrailers({
    page,
    pageSize,
    search: searchQuery,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    include: ['currentAssignment']
  })

  const tractorColumns: Column<TractorWithDetails>[] = [
    {
      key: "unitNumber",
      title: "Unit #",
      sortable: true,
      className: "font-mono",
      render: (value, row) => (
        <button
          onClick={() => onViewEquipment?.(row.id, 'tractor')}
          className="font-mono font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {value}
        </button>
      ),
    },
    {
      key: "make",
      title: "Make/Model",
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.make} {row.model}</div>
          <div className="text-sm text-muted-foreground">{row.year}</div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value) => <EquipmentStatusBadge status={value} />,
    },
    {
      key: "currentAssignment",
      title: "Assignment",
      render: (assignment) => {
        if (!assignment) {
          return <span className="text-muted-foreground">Available</span>
        }
        return (
          <div>
            <div className="font-medium text-sm">
              {assignment.driver?.firstName} {assignment.driver?.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {assignment.order?.orderNumber}
            </div>
          </div>
        )
      },
    },
    {
      key: "currentOdometer",
      title: "Odometer",
      align: "right",
      className: "font-mono",
      render: (value) => value ? `${value.toLocaleString()} mi` : "—",
    },
    {
      key: "inspectionExpiration",
      title: "Next Inspection",
      render: (value) => {
        if (!value) return "—"
        const date = new Date(value)
        const now = new Date()
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <div className="text-sm">
            <div className={cn(
              "font-medium",
              daysUntil < 30 && "text-destructive",
              daysUntil < 60 && daysUntil >= 30 && "text-yellow-600"
            )}>
              {date.toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {daysUntil < 0 ? 'Overdue' : `${daysUntil} days`}
            </div>
          </div>
        )
      },
    },
  ]

  const trailerColumns: Column<TrailerWithDetails>[] = [
    {
      key: "unitNumber",
      title: "Unit #",
      sortable: true,
      className: "font-mono",
      render: (value, row) => (
        <button
          onClick={() => onViewEquipment?.(row.id, 'trailer')}
          className="font-mono font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {value}
        </button>
      ),
    },
    {
      key: "trailerType",
      title: "Type",
      render: (value) => <TrailerTypeBadge type={value} />,
    },
    {
      key: "make",
      title: "Make/Model",
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.make} {row.model}</div>
          <div className="text-sm text-muted-foreground">{row.year}</div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value) => <EquipmentStatusBadge status={value} />,
    },
    {
      key: "currentAssignment",
      title: "Assignment",
      render: (assignment) => {
        if (!assignment) {
          return <span className="text-muted-foreground">Available</span>
        }
        return (
          <div>
            <div className="font-medium text-sm">
              {assignment.driver?.firstName} {assignment.driver?.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {assignment.order?.orderNumber}
            </div>
          </div>
        )
      },
    },
    {
      key: "length",
      title: "Dimensions",
      align: "right",
      className: "font-mono",
      render: (_, row) => {
        if (!row.length) return "—"
        return `${row.length}' × ${row.width}' × ${row.height}'`
      },
    },
    {
      key: "inspectionExpiration",
      title: "Next Inspection",
      render: (value) => {
        if (!value) return "—"
        const date = new Date(value)
        const now = new Date()
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <div className="text-sm">
            <div className={cn(
              "font-medium",
              daysUntil < 30 && "text-destructive",
              daysUntil < 60 && daysUntil >= 30 && "text-yellow-600"
            )}>
              {date.toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {daysUntil < 0 ? 'Overdue' : `${daysUntil} days`}
            </div>
          </div>
        )
      },
    },
  ]

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "assigned", label: "Assigned" },
    { value: "in_use", label: "In Use" },
    { value: "maintenance", label: "Maintenance" },
    { value: "out_of_service", label: "Out of Service" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Fleet Equipment</h2>
          <p className="text-sm text-muted-foreground">
            Manage tractors and trailers, track maintenance, and monitor utilization
          </p>
        </div>
        <Button onClick={onAddEquipment} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Tabs */}
      <SimpleTabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "tractors" | "trailers")
          setPage(1) // Reset to first page when switching tabs
        }}
        tabs={[
          {
            value: "tractors",
            label: "Tractors",
            icon: <Truck className="h-4 w-4" />,
            badge: tractorsResponse?.pagination.total,
            content: (
              <DataTable
                data={tractorsResponse?.data || []}
                columns={tractorColumns}
                loading={tractorsLoading}
                error={tractorsError?.message || null}
                emptyMessage="No tractors found"
                emptyState={{
                  title: "No tractors found",
                  description: "Try adjusting filters or add new equipment.",
                  action: onAddEquipment
                    ? {
                        label: "Add Tractor",
                        onClick: onAddEquipment,
                      }
                    : undefined,
                }}
                searchable={false}
                pagination={{
                  page,
                  pageSize,
                  total: tractorsResponse?.pagination.total || 0,
                  onPageChange: setPage,
                }}
              />
            )
          },
          {
            value: "trailers",
            label: "Trailers",
            icon: <Truck className="h-4 w-4" />,
            badge: trailersResponse?.pagination.total,
            content: (
              <DataTable
                data={trailersResponse?.data || []}
                columns={trailerColumns}
                loading={trailersLoading}
                error={trailersError?.message || null}
                emptyMessage="No trailers found"
                emptyState={{
                  title: "No trailers found",
                  description: "Try adjusting filters or add new equipment.",
                  action: onAddEquipment
                    ? {
                        label: "Add Trailer",
                        onClick: onAddEquipment,
                      }
                    : undefined,
                }}
                searchable={false}
                pagination={{
                  page,
                  pageSize,
                  total: trailersResponse?.pagination.total || 0,
                  onPageChange: setPage,
                }}
              />
            )
          },
        ]}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border"
      >
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 w-full bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
          />
        </div>
        <Select
          value={statusFilter[0] ?? "all"}
          onValueChange={(value) => {
            const stringValue = Array.isArray(value) ? value[0] : value;
            if (stringValue === "all") {
              setStatusFilter([])
            } else {
              setStatusFilter([stringValue as EquipmentStatus])
            }
            setPage(1)
          }}
          options={[
            { value: "all", label: "All Status" },
            ...statusOptions
          ]}
          placeholder="Filter by status"
        />
      </motion.div>
    </div>
  )
}

function EquipmentStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    available: { label: "Available", variant: "default" as const },
    assigned: { label: "Assigned", variant: "outline" as const },
    in_use: { label: "In Use", variant: "default" as const },
    maintenance: { label: "Maintenance", variant: "secondary" as const },
    out_of_service: { label: "Out of Service", variant: "destructive" as const },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function TrailerTypeBadge({ type }: { type: string }) {
  const typeConfig = {
    dry_van: { label: "Dry Van", variant: "secondary" as const },
    reefer: { label: "Reefer", variant: "outline" as const },
    flatbed: { label: "Flatbed", variant: "secondary" as const },
    tanker: { label: "Tanker", variant: "outline" as const },
    step_deck: { label: "Step Deck", variant: "secondary" as const },
    double_drop: { label: "Double Drop", variant: "secondary" as const },
    conestoga: { label: "Conestoga", variant: "secondary" as const },
  }

  const config = typeConfig[type as keyof typeof typeConfig] || {
    label: type,
    variant: "secondary" as const
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
