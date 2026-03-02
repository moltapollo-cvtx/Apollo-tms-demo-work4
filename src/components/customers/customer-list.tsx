"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Buildings,
  Plus,
  MagnifyingGlass,
  MapPin,
  Star,
  TrendUp,
  TrendDown,
} from "@phosphor-icons/react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useCustomers } from "@/lib/hooks/api/use-customers"
import type { CustomerWithDetails } from "@/types"
import { cn } from "@/lib/utils"

interface CustomerListProps {
  onAddCustomer?: () => void
  onViewCustomer?: (id: number) => void
}

export function CustomerList({ onAddCustomer, onViewCustomer }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [regionFilter, setRegionFilter] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Fetch customers
  const {
    data: customersResponse,
    isLoading,
    error
  } = useCustomers({
    page,
    pageSize,
    search: searchQuery,
    isActive: statusFilter.includes("inactive") ? false : undefined,
    include: ['contacts', 'locations', 'recentOrders']
  })

  const columns: Column<CustomerWithDetails>[] = [
    {
      key: "name",
      title: "Customer",
      sortable: true,
      render: (value, row) => (
        <button
          onClick={() => onViewCustomer?.(row.id)}
          className="flex items-start gap-3 text-left hover:text-primary transition-colors"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Buildings className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{String(value)}</div>
            <div className="text-sm text-muted-foreground">{row.code}</div>
          </div>
        </button>
      ),
    },
    {
      key: "location",
      title: "Primary Location",
      render: (_, row) => {
        const locations = (row.locations ?? []) as Array<
          NonNullable<CustomerWithDetails["locations"]>[number] & { isPrimary?: boolean }
        >
        const primaryLocation = locations.find((location) => location.isPrimary) || locations[0]
        if (!primaryLocation) {
          return <span className="text-muted-foreground">No location</span>
        }
        return (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm">{primaryLocation.city}, {primaryLocation.state}</div>
              <div className="text-xs text-muted-foreground truncate">
                {primaryLocation.address}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: "contacts",
      title: "Primary Contact",
      render: (contacts) => {
        const contactRows = (Array.isArray(contacts) ? contacts : []) as Array<
          NonNullable<CustomerWithDetails["contacts"]>[number] & { isPrimary?: boolean }
        >
        if (contactRows.length === 0) {
          return <span className="text-muted-foreground">No contact</span>
        }
        const primaryContact = contactRows.find((contact) => contact.isPrimary) || contactRows[0]
        return (
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {primaryContact.firstName} {primaryContact.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{primaryContact.title}</div>
            {primaryContact.phone && (
              <div className="text-xs text-muted-foreground font-mono">
                {primaryContact.phone}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: "paymentTerms",
      title: "Terms",
      render: (value: string | null) => value ? (
        <Badge variant="outline">{value}</Badge>
      ) : (
        <span className="text-muted-foreground">Net 30</span>
      ),
    },
    {
      key: "recentOrders",
      title: "Recent Activity",
      render: (orders: Array<{ createdAt: string | Date; orderNumber: string }> | null | undefined) => {
        if (!orders || orders.length === 0) {
          return <span className="text-muted-foreground text-sm">No recent orders</span>
        }

        const lastOrder = orders[0]
        const daysSince = Math.floor(
          (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )

        return (
          <div className="text-sm">
            <div className="font-mono font-medium">
              {lastOrder.orderNumber}
            </div>
            <div className="text-xs text-muted-foreground">
              {daysSince === 0 ? 'Today' : `${daysSince} days ago`}
            </div>
          </div>
        )
      },
    },
    {
      key: "performance",
      title: "Performance",
      align: "right",
      render: (_value, _row) => {
        // Mock performance data - in real app, this would come from API
        const onTimeRate = Math.floor(Math.random() * 20) + 80 // 80-99%
        const volumeTrend = (Math.random() - 0.5) * 20 // -10% to +10%

        return (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="font-mono text-sm">{onTimeRate}%</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              {volumeTrend > 0 ? (
                <TrendUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "font-mono text-xs",
                volumeTrend > 0 ? "text-green-600" : "text-red-600"
              )}>
                {volumeTrend > 0 ? '+' : ''}{volumeTrend.toFixed(1)}%
              </span>
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground">
            Manage customer relationships, contacts, and service history
          </p>
        </div>
        <Button onClick={onAddCustomer} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Customers"
          value={customersResponse?.pagination.total || 0}
          subtitle="Active accounts"
          icon={<Buildings className="h-5 w-5" />}
          trend={2.3}
        />
        <StatsCard
          title="New This Month"
          value={12}
          subtitle="vs last month"
          icon={<TrendUp className="h-5 w-5" />}
          trend={15.2}
        />
        <StatsCard
          title="Avg Satisfaction"
          value="4.6"
          subtitle="rating"
          icon={<Star className="h-5 w-5" />}
          trend={0.3}
        />
        <StatsCard
          title="Active Orders"
          value={89}
          subtitle="in progress"
          icon={<Buildings className="h-5 w-5" />}
          trend={-2.1}
        />
      </div>

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
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 w-full bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
          />
        </div>
        <Select
          value={statusFilter.join(",")}
          onValueChange={(value) => {
            const stringValue = Array.isArray(value) ? value[0] : value;
            setStatusFilter(stringValue === "all" ? [] : [stringValue])
          }}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active Only" },
            { value: "inactive", label: "Inactive Only" },
          ]}
          placeholder="Filter by status"
        />
        <Select
          value={regionFilter}
          onValueChange={(value) => {
            const stringValue = Array.isArray(value) ? value[0] : value;
            setRegionFilter(stringValue);
          }}
          options={[
            { value: "", label: "All Regions" },
            { value: "west", label: "West" },
            { value: "midwest", label: "Midwest" },
            { value: "south", label: "South" },
            { value: "northeast", label: "Northeast" },
          ]}
          placeholder="Filter by region"
        />
      </motion.div>

      {/* Customer Table */}
      <DataTable
        data={customersResponse?.data || []}
        columns={columns}
        loading={isLoading}
        error={error?.message || null}
        emptyState={{
          icon: <Buildings className="h-full w-full" />,
          title: "No customers found",
          description: "Start building your customer base by adding shippers and consignees to work with.",
          action: {
            label: "Add Customer",
            onClick: onAddCustomer || (() => {}),
            variant: "primary"
          }
        }}
        searchable={false} // We have custom search above
        pagination={{
          page,
          pageSize,
          total: customersResponse?.pagination.total || 0,
          onPageChange: setPage,
        }}
        onRowClick={(customer) => onViewCustomer?.(customer.id)}
      />
    </div>
  )
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  trend: number
}) {
  const isPositive = trend > 0
  const TrendIcon = isPositive ? TrendUp : TrendDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-primary">{icon}</div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend)}%
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
