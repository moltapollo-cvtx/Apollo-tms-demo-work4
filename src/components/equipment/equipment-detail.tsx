"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Truck,
  Wrench,
  MapPin,
  Clock,
  TrendUp,
  Calendar,
  User,
  FileText,
  ArrowLeft,
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { useTractor, useTrailer } from "@/lib/hooks/api/use-equipment"
import type { TractorWithDetails, TrailerWithDetails } from "@/types"
import { cn } from "@/lib/utils"

interface EquipmentDetailProps {
  id: number
  type: 'tractor' | 'trailer'
  onBack?: () => void
}

export function EquipmentDetail({ id, type, onBack }: EquipmentDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch equipment data based on type
  const {
    data: tractorData,
    isLoading: tractorLoading,
    error: tractorError
  } = useTractor(id, ['currentAssignment', 'maintenanceHistory'])

  const {
    data: trailerData,
    isLoading: trailerLoading,
    error: trailerError
  } = useTrailer(id, ['currentAssignment', 'maintenanceHistory'])

  const equipment = type === 'tractor' ? tractorData?.data : trailerData?.data
  const isLoading = type === 'tractor' ? tractorLoading : trailerLoading
  const error = type === 'tractor' ? tractorError : trailerError

  if (isLoading) {
    return <EquipmentDetailSkeleton />
  }

  if (error || !equipment) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          {error ? "Failed to load equipment details" : "Equipment not found"}
        </p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Equipment List
        </Button>
      </Card>
    )
  }

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "specifications", label: "Specifications" },
    { value: "maintenance", label: "Maintenance" },
    { value: "utilization", label: "Utilization" },
    { value: "documents", label: "Documents" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold font-mono">{equipment.unitNumber}</h1>
              <p className="text-muted-foreground">
                {equipment.make} {equipment.model} ({equipment.year})
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EquipmentStatusBadge status={equipment.status || "available"} />
          {type === 'trailer' && (
            <TrailerTypeBadge type={(equipment as TrailerWithDetails).trailerType} />
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Location"
          value="Phoenix, AZ"
          icon={<MapPin className="h-5 w-5" />}
          subvalue="Last updated 2h ago"
        />
        {type === 'tractor' && (
          <MetricCard
            title="Odometer"
            value={`${(equipment as TractorWithDetails).currentOdometer?.toLocaleString() || 'N/A'} mi`}
            icon={<TrendUp className="h-5 w-5" />}
            subvalue="This month: +3,200 mi"
          />
        )}
        <MetricCard
          title="Next Service"
          value="Mar 15, 2026"
          icon={<Wrench className="h-5 w-5" />}
          subvalue="In 28 days"
          alert={true}
        />
        <MetricCard
          title="Utilization"
          value="87%"
          icon={<Clock className="h-5 w-5" />}
          subvalue="This month"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <OverviewTab equipment={equipment} type={type} />
        )}
        {activeTab === "specifications" && (
          <SpecificationsTab equipment={equipment} type={type} />
        )}
        {activeTab === "maintenance" && (
          <MaintenanceTab equipment={equipment} />
        )}
        {activeTab === "utilization" && (
          <UtilizationTab equipment={equipment} />
        )}
        {activeTab === "documents" && (
          <DocumentsTab equipment={equipment} />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ equipment, type: _type }: {
  equipment: TractorWithDetails | TrailerWithDetails,
  type: 'tractor' | 'trailer'
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Assignment */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Current Assignment</h3>
        </div>
        {equipment.currentAssignment ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Driver</p>
              <p className="font-medium">
                {equipment.currentAssignment.driver?.firstName} {equipment.currentAssignment.driver?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Load</p>
              <p className="font-medium font-mono">
                {equipment.currentAssignment.order?.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Route</p>
              <p className="text-sm">Phoenix, AZ → Denver, CO</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="default">In Transit</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No current assignment</p>
            <p className="text-sm">Equipment is available</p>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {generateRecentActivity().map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SpecificationsTab({ equipment, type }: {
  equipment: TractorWithDetails | TrailerWithDetails,
  type: 'tractor' | 'trailer'
}) {
  const specs = type === 'tractor'
    ? getTractorSpecs(equipment as TractorWithDetails)
    : getTrailerSpecs(equipment as TrailerWithDetails)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {specs.map((section, index) => (
        <Card key={index} className="p-6">
          <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
          <div className="space-y-3">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn("font-medium", item.mono && "font-mono")}>
                  {item.value || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function MaintenanceTab({ equipment: _equipment }: { equipment: TractorWithDetails | TrailerWithDetails }) {
  return (
    <div className="space-y-6">
      {/* Maintenance Schedule */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Upcoming Maintenance</h3>
        </div>
        <div className="space-y-3">
          {generateMaintenanceSchedule().map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">{item.service}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{item.dueDate}</p>
                <Badge
                  variant={item.overdue ? "destructive" : item.soon ? "secondary" : "default"}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Maintenance History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Maintenance</h3>
        </div>
        <div className="space-y-3">
          {generateMaintenanceHistory().map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">{item.service}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.vendor}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{item.date}</p>
                <p className="text-xs text-muted-foreground font-mono">${item.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function UtilizationTab({ equipment: _equipment }: { equipment: TractorWithDetails | TrailerWithDetails }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Utilization</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Month</span>
              <span className="font-mono font-medium">87%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '87%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Previous Month</span>
              <span className="font-mono font-medium">83%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-muted-foreground h-2 rounded-full" style={{ width: '83%' }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Days in Service</span>
            <span className="font-mono font-medium">28</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Days Available</span>
            <span className="font-mono font-medium">2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Days Maintenance</span>
            <span className="font-mono font-medium">1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Revenue/Day</span>
            <span className="font-mono font-medium">$487</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DocumentsTab({ equipment: _equipment }: { equipment: TractorWithDetails | TrailerWithDetails }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Equipment Documents</h3>
      </div>
      <div className="space-y-3">
        {generateDocuments().map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-sm text-muted-foreground">{doc.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">{doc.date}</p>
              <Badge variant={doc.expired ? "destructive" : "default"}>
                {doc.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Helper functions
function getTractorSpecs(tractor: TractorWithDetails) {
  return [
    {
      title: "General Information",
      items: [
        { label: "Unit Number", value: tractor.unitNumber, mono: true },
        { label: "VIN", value: tractor.vin, mono: true },
        { label: "Make", value: tractor.make },
        { label: "Model", value: tractor.model },
        { label: "Year", value: tractor.year },
        { label: "License Plate", value: tractor.licensePlate, mono: true },
        { label: "Plate State", value: tractor.plateState },
      ]
    },
    {
      title: "Engine & Drivetrain",
      items: [
        { label: "Engine Make", value: tractor.engineMake },
        { label: "Engine Model", value: tractor.engineModel },
        { label: "Fuel Type", value: tractor.fuelType },
        { label: "Current Odometer", value: tractor.currentOdometer ? `${tractor.currentOdometer.toLocaleString()} mi` : null, mono: true },
      ]
    },
    {
      title: "Registration & Inspections",
      items: [
        { label: "Registration Exp.", value: tractor.registrationExpiration ? new Date(tractor.registrationExpiration).toLocaleDateString() : null },
        { label: "Inspection Exp.", value: tractor.inspectionExpiration ? new Date(tractor.inspectionExpiration).toLocaleDateString() : null },
      ]
    }
  ]
}

function getTrailerSpecs(trailer: TrailerWithDetails) {
  return [
    {
      title: "General Information",
      items: [
        { label: "Unit Number", value: trailer.unitNumber, mono: true },
        { label: "Type", value: trailer.trailerType },
        { label: "Make", value: trailer.make },
        { label: "Model", value: trailer.model },
        { label: "Year", value: trailer.year },
        { label: "License Plate", value: trailer.licensePlate, mono: true },
        { label: "Plate State", value: trailer.plateState },
      ]
    },
    {
      title: "Dimensions & Capacity",
      items: [
        { label: "Length", value: trailer.length ? `${trailer.length}'` : null, mono: true },
        { label: "Width", value: trailer.width ? `${trailer.width}'` : null, mono: true },
        { label: "Height", value: trailer.height ? `${trailer.height}'` : null, mono: true },
        { label: "Capacity", value: trailer.capacity ? `${trailer.capacity} lbs` : null, mono: true },
        { label: "Tare Weight", value: trailer.tareWeight ? `${trailer.tareWeight} lbs` : null, mono: true },
      ]
    },
    {
      title: "Registration & Inspections",
      items: [
        { label: "Registration Exp.", value: trailer.registrationExpiration ? new Date(trailer.registrationExpiration).toLocaleDateString() : null },
        { label: "Inspection Exp.", value: trailer.inspectionExpiration ? new Date(trailer.inspectionExpiration).toLocaleDateString() : null },
      ]
    }
  ]
}

// Mock data generators
function generateRecentActivity() {
  return [
    { description: "Arrived at delivery location", timestamp: "2 hours ago" },
    { description: "Started trip to Denver, CO", timestamp: "1 day ago" },
    { description: "Completed pre-trip inspection", timestamp: "1 day ago" },
    { description: "Assigned to Load #TMS-45678", timestamp: "2 days ago" },
  ]
}

function generateMaintenanceSchedule() {
  return [
    { service: "A-Service", description: "Oil change, filter replacement", dueDate: "Mar 15, 2026", status: "Due Soon", soon: true, overdue: false },
    { service: "DOT Inspection", description: "Annual safety inspection", dueDate: "Apr 2, 2026", status: "Scheduled", soon: false, overdue: false },
    { service: "Tire Rotation", description: "Rotate and balance tires", dueDate: "May 10, 2026", status: "Scheduled", soon: false, overdue: false },
  ]
}

function generateMaintenanceHistory() {
  return [
    { service: "B-Service", description: "Comprehensive maintenance", vendor: "Phoenix Truck Center", date: "Feb 1, 2026", cost: "1,247" },
    { service: "Brake Repair", description: "Front brake pad replacement", vendor: "Quick Fix Auto", date: "Jan 15, 2026", cost: "436" },
    { service: "Oil Change", description: "Engine oil and filter", vendor: "Phoenix Truck Center", date: "Dec 28, 2025", cost: "89" },
  ]
}

function generateDocuments() {
  return [
    { name: "Registration Certificate", type: "Registration", date: "Dec 1, 2025", status: "Valid", expired: false },
    { name: "Insurance Policy", type: "Insurance", date: "Jan 1, 2026", status: "Valid", expired: false },
    { name: "DOT Inspection Report", type: "Safety", date: "Apr 2, 2025", status: "Expired", expired: true },
    { name: "Maintenance Records", type: "Maintenance", date: "Feb 1, 2026", status: "Current", expired: false },
  ]
}

// Component helpers
function MetricCard({ title, value, icon, subvalue, alert }: {
  title: string
  value: string
  icon: React.ReactNode
  subvalue: string
  alert?: boolean
}) {
  return (
    <Card className={cn("p-4", alert && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20")}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-lg font-bold font-mono">{value}</p>
          <p className="text-xs text-muted-foreground">{subvalue}</p>
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </Card>
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

function EquipmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
        <div className="flex-1">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-20 bg-muted rounded animate-pulse" />
          </Card>
        ))}
      </div>
      <div className="h-12 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  )
}
