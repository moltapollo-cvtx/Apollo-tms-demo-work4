"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Calendar as CalendarIcon,
  CaretLeft,
  CaretRight,
  Wrench,
  Clock,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MaintenanceItem {
  id: number
  equipmentId: number
  unitNumber: string
  equipmentType: 'tractor' | 'trailer'
  serviceType: string
  description: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'scheduled' | 'overdue' | 'completed' | 'in_progress'
  estimatedDuration: number // hours
  cost?: number
  vendor?: string
}

interface MaintenanceCalendarProps {
  onScheduleClick?: (item: MaintenanceItem) => void
  onDateClick?: (date: Date) => void
}

export function MaintenanceCalendar({ onScheduleClick, onDateClick }: MaintenanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Mock maintenance data - in real app, this would come from API
  const maintenanceItems = useMemo(() => generateMaintenanceItems(), [])

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - monthStart.getDay())
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()))

  const days = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const getItemsForDate = (date: Date) => {
    return maintenanceItems.filter(item => {
      const itemDate = new Date(item.dueDate)
      return itemDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : []

  const getDateClassNames = (date: Date, items: MaintenanceItem[]) => {
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
    const isToday = date.toDateString() === new Date().toDateString()
    const isSelected = selectedDate?.toDateString() === date.toDateString()

    let bgColor = ""
    if (items.length > 0) {
      const hasOverdue = items.some(item => item.status === 'overdue')
      const hasHighPriority = items.some(item => item.priority === 'high')
      const hasInProgress = items.some(item => item.status === 'in_progress')

      if (hasOverdue) bgColor = "bg-red-100 dark:bg-red-950"
      else if (hasHighPriority) bgColor = "bg-yellow-100 dark:bg-yellow-950"
      else if (hasInProgress) bgColor = "bg-blue-100 dark:bg-blue-950"
      else bgColor = "bg-green-100 dark:bg-green-950"
    }

    return cn(
      "relative flex flex-col items-center justify-start p-1 h-24 cursor-pointer transition-colors hover:bg-muted/50",
      !isCurrentMonth && "text-muted-foreground",
      isToday && "ring-2 ring-primary",
      isSelected && "bg-primary/10",
      bgColor
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Maintenance Schedule</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigateMonth('prev')} variant="outline" size="sm">
              <CaretLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium min-w-[200px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <Button onClick={() => navigateMonth('next')} variant="outline" size="sm">
              <CaretRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button className="gap-2">
          <Wrench className="h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 border border-border rounded-lg overflow-hidden">
              {days.map((date, index) => {
                const items = getItemsForDate(date)
                return (
                  <motion.div
                    key={date.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={getDateClassNames(date, items)}
                    onClick={() => {
                      setSelectedDate(date)
                      onDateClick?.(date)
                    }}
                  >
                    <span className="text-sm font-medium">
                      {date.getDate()}
                    </span>
                    {items.length > 0 && (
                      <div className="mt-1 space-y-1 w-full">
                        {items.slice(0, 2).map((item, _itemIndex) => (
                          <MaintenanceCalendarItem
                            key={item.id}
                            item={item}
                            compact
                            onClick={() => onScheduleClick?.(item)}
                          />
                        ))}
                        {items.length > 2 && (
                          <div className="text-xs text-center bg-muted/80 rounded px-1">
                            +{items.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm">Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span className="text-sm">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm">Scheduled</span>
              </div>
            </div>
          </Card>

          {/* Selected Date Items */}
          {selectedDate && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h4>
              {selectedDateItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No maintenance scheduled</p>
              ) : (
                <div className="space-y-2">
                  {selectedDateItems.map(item => (
                    <MaintenanceCalendarItem
                      key={item.id}
                      item={item}
                      onClick={() => onScheduleClick?.(item)}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Upcoming Maintenance */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Upcoming This Week</h4>
            <div className="space-y-2">
              {getUpcomingMaintenance(maintenanceItems, 7).map(item => (
                <MaintenanceCalendarItem
                  key={item.id}
                  item={item}
                  showDate
                  onClick={() => onScheduleClick?.(item)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MaintenanceCalendarItem({
  item,
  compact = false,
  showDate = false,
  onClick,
}: {
  item: MaintenanceItem
  compact?: boolean
  showDate?: boolean
  onClick?: () => void
}) {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'overdue':
        return <Warning className="h-3 w-3 text-red-500" />
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      default:
        return <Wrench className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-muted'
    }
  }

  if (compact) {
    return (
      <div
        className="text-xs bg-background/80 rounded px-1 py-0.5 cursor-pointer hover:bg-background transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        <div className="flex items-center gap-1">
          <div className={cn("w-2 h-2 rounded-full", getPriorityColor())} />
          <span className="font-mono text-xs truncate">{item.unitNumber}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-2 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            {getStatusIcon()}
            <span className="font-mono text-sm font-medium">{item.unitNumber}</span>
            <Badge variant="outline" className="text-xs">
              {item.equipmentType}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {item.serviceType}
          </p>
          {showDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(item.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className={cn("w-2 h-8 rounded-full", getPriorityColor())} />
      </div>
    </div>
  )
}

// Helper functions
function generateMaintenanceItems(): MaintenanceItem[] {
  const items: MaintenanceItem[] = []
  const serviceTypes = [
    'A-Service', 'B-Service', 'C-Service', 'Oil Change', 'DOT Inspection',
    'Tire Rotation', 'Brake Inspection', 'Engine Tune-up', 'Transmission Service'
  ]

  const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']
  const statuses: ('scheduled' | 'overdue' | 'completed' | 'in_progress')[] = ['scheduled', 'overdue', 'completed', 'in_progress']

  // Generate items for the next 90 days
  for (let i = 0; i < 50; i++) {
    const daysOffset = Math.floor(Math.random() * 90) - 30 // -30 to +60 days from today
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysOffset)

    items.push({
      id: i + 1,
      equipmentId: Math.floor(Math.random() * 100) + 1,
      unitNumber: `${Math.floor(Math.random() * 9000) + 1000}`,
      equipmentType: Math.random() > 0.6 ? 'tractor' : 'trailer',
      serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      description: `Routine maintenance service for equipment`,
      dueDate: dueDate.toISOString(),
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: daysOffset < 0 ? 'overdue' : statuses[Math.floor(Math.random() * statuses.length)],
      estimatedDuration: Math.floor(Math.random() * 8) + 1,
      cost: Math.floor(Math.random() * 1000) + 100,
      vendor: 'Phoenix Truck Center'
    })
  }

  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

function getUpcomingMaintenance(items: MaintenanceItem[], days: number): MaintenanceItem[] {
  const now = new Date()
  const future = new Date()
  future.setDate(now.getDate() + days)

  return items
    .filter(item => {
      const dueDate = new Date(item.dueDate)
      return dueDate >= now && dueDate <= future && item.status !== 'completed'
    })
    .slice(0, 5) // Limit to 5 items
}