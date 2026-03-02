"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Truck, Wrench, ChartLine, TrendUp, TrendDown } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { useTractors, useTrailers } from "@/lib/hooks/api/use-equipment"
import { cn } from "@/lib/utils"
import type { EquipmentStatus } from "@/types"

interface UtilizationData {
  name: string
  value: number
  color: string
}

interface UtilizationEquipmentRow {
  status?: EquipmentStatus | null
}

export function EquipmentUtilizationDashboard() {
  // Fetch all tractors and trailers for utilization calculation
  const { data: tractorsResponse, isLoading: tractorsLoading } = useTractors({ pageSize: 1000 })
  const { data: trailersResponse, isLoading: trailersLoading } = useTrailers({ pageSize: 1000 })

  const utilizationStats = useMemo(() => {
    const tractors = tractorsResponse?.data || []
    const trailers = trailersResponse?.data || []

    const tractorStats = calculateUtilization(tractors)
    const trailerStats = calculateUtilization(trailers)
    const combinedStats = calculateCombinedUtilization(tractors, trailers)

    return {
      tractors: tractorStats,
      trailers: trailerStats,
      combined: combinedStats,
    }
  }, [tractorsResponse?.data, trailersResponse?.data])

  const isLoading = tractorsLoading || trailersLoading

  if (isLoading) {
    return <UtilizationDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UtilizationStatsCard
          title="Total Tractors"
          value={utilizationStats.tractors.total}
          subvalue={`${utilizationStats.tractors.utilizationRate}% utilized`}
          icon={<Truck className="h-5 w-5" />}
          trend={2.3}
        />
        <UtilizationStatsCard
          title="Total Trailers"
          value={utilizationStats.trailers.total}
          subvalue={`${utilizationStats.trailers.utilizationRate}% utilized`}
          icon={<Truck className="h-5 w-5" />}
          trend={1.8}
        />
        <UtilizationStatsCard
          title="In Maintenance"
          value={utilizationStats.combined.maintenance}
          subvalue={`${((utilizationStats.combined.maintenance / utilizationStats.combined.total) * 100).toFixed(1)}% of fleet`}
          icon={<Wrench className="h-5 w-5" />}
          trend={-0.5}
        />
        <UtilizationStatsCard
          title="Overall Utilization"
          value={`${utilizationStats.combined.utilizationRate}%`}
          subvalue="This month"
          icon={<ChartLine className="h-5 w-5" />}
          trend={3.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tractor Utilization */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Tractor Utilization</h3>
              <p className="text-sm text-muted-foreground">Current status breakdown</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationStats.tractors.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {utilizationStats.tractors.chartData.map((entry, index) => (
                      <Cell key={`tractor-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} units`, name]}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <UtilizationLegend data={utilizationStats.tractors.chartData} />
          </div>
        </Card>

        {/* Trailer Utilization */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Trailer Utilization</h3>
              <p className="text-sm text-muted-foreground">Current status breakdown</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationStats.trailers.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {utilizationStats.trailers.chartData.map((entry, index) => (
                      <Cell key={`trailer-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} units`, name]}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <UtilizationLegend data={utilizationStats.trailers.chartData} />
          </div>
        </Card>

        {/* Daily Utilization Trend */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Utilization Trend</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generateTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Utilization']}
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="utilization" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function calculateUtilization(equipment: UtilizationEquipmentRow[]) {
  const total = equipment.length
  const inUse = equipment.filter(e => e.status === 'in_use' || e.status === 'assigned').length
  const available = equipment.filter(e => e.status === 'available').length
  const maintenance = equipment.filter(e => e.status === 'maintenance').length
  const outOfService = equipment.filter(e => e.status === 'out_of_service').length

  const utilizationRate = total > 0 ? Math.round((inUse / total) * 100) : 0

  return {
    total,
    inUse,
    available,
    maintenance,
    outOfService,
    utilizationRate,
    chartData: [
      { name: 'In Use', value: inUse, color: 'hsl(var(--primary))' },
      { name: 'Available', value: available, color: '#00B4D8' },
      { name: 'Maintenance', value: maintenance, color: '#f59e0b' },
      { name: 'Out of Service', value: outOfService, color: 'hsl(var(--destructive))' },
    ].filter(item => item.value > 0)
  }
}

function calculateCombinedUtilization(
  tractors: UtilizationEquipmentRow[],
  trailers: UtilizationEquipmentRow[]
) {
  const total = tractors.length + trailers.length
  const inUse = tractors.filter(e => e.status === 'in_use' || e.status === 'assigned').length +
                trailers.filter(e => e.status === 'in_use' || e.status === 'assigned').length
  const maintenance = tractors.filter(e => e.status === 'maintenance').length +
                      trailers.filter(e => e.status === 'maintenance').length

  const utilizationRate = total > 0 ? Math.round((inUse / total) * 100) : 0

  return {
    total,
    inUse,
    maintenance,
    utilizationRate,
  }
}

function generateTrendData() {
  // Generate mock trend data for last 7 days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(day => ({
    day,
    utilization: Math.floor(Math.random() * 15) + 80, // Random between 80-95%
  }))
}

function UtilizationStatsCard({
  title,
  value,
  subvalue,
  icon,
  trend,
}: {
  title: string
  value: string | number
  subvalue: string
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
            <p className="text-xs text-muted-foreground">{subvalue}</p>
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

function UtilizationLegend({ data }: { data: UtilizationData[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">
            {item.name}: <span className="font-mono font-medium">{item.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function UtilizationDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse mx-auto w-1/2" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
