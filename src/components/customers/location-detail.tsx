"use client"

import { useState } from "react"
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Camera,
  FileText,
  Truck,
  Users,
  Warning,
  CheckCircle,
  ArrowLeft,
  PencilSimple,
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import type { Location } from "@/types"
import { cn } from "@/lib/utils"

interface LocationDetailProps {
  location: Location
  onBack?: () => void
}

interface OperatingHours {
  [key: string]: {
    open?: string
    close?: string
    closed?: boolean
  }
}

interface LocationPhoto {
  id: number
  url: string
  caption: string
  uploadedAt: string
}

interface DriverReview {
  id: number
  driverName: string
  rating: number
  comment: string
  createdAt: string
  orderNumber?: string
}

export function LocationDetail({ location, onBack }: LocationDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock operating hours - in real app, this would come from location.operatingHours
  const operatingHours: OperatingHours = {
    monday: { open: "06:00", close: "18:00" },
    tuesday: { open: "06:00", close: "18:00" },
    wednesday: { open: "06:00", close: "18:00" },
    thursday: { open: "06:00", close: "18:00" },
    friday: { open: "06:00", close: "18:00" },
    saturday: { open: "08:00", close: "14:00" },
    sunday: { closed: true },
  }

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "docks", label: "Dock Info" },
    { value: "reviews", label: "Driver Reviews" },
    { value: "photos", label: "Photos" },
    { value: "instructions", label: "Instructions" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{location.name}</h1>
                {location.rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-1 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-mono font-medium text-sm">{location.rating}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location.city}, {location.state} {location.zipCode}</span>
                </div>
                {location.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span className="font-mono">{location.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button className="gap-2">
          <PencilSimple className="h-4 w-4" />
          PencilSimple Location
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Loading Docks"
          value={location.dockCount?.toString() || "N/A"}
          icon={<Truck className="h-5 w-5" />}
          subtitle="Available bays"
        />
        <MetricCard
          title="Avg Wait Time"
          value={location.averageWaitTime ? `${location.averageWaitTime}m` : "N/A"}
          icon={<Clock className="h-5 w-5" />}
          subtitle="Driver waiting"
          alert={location.averageWaitTime ? location.averageWaitTime > 60 : false}
        />
        <MetricCard
          title="Driver Rating"
          value={location.rating?.toString() || "N/A"}
          icon={<Star className="h-5 w-5" />}
          subtitle="Based on reviews"
        />
        <MetricCard
          title="Recent Deliveries"
          value="23"
          icon={<CheckCircle className="h-5 w-5" />}
          subtitle="This week"
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
          <OverviewTab location={location} operatingHours={operatingHours} />
        )}
        {activeTab === "docks" && <DocksTab location={location} />}
        {activeTab === "reviews" && <ReviewsTab location={location} />}
        {activeTab === "photos" && <PhotosTab location={location} />}
        {activeTab === "instructions" && <InstructionsTab location={location} />}
      </div>
    </div>
  )
}

function OverviewTab({
  location,
  operatingHours,
}: {
  location: Location
  operatingHours: OperatingHours
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Location Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Location Details</h3>
        </div>
        <div className="space-y-4">
          <InfoField label="Facility Name" value={location.name} />
          <InfoField label="Address" value={location.address || "N/A"} />
          <InfoField label="City/State" value={`${location.city}, ${location.state}`} />
          <InfoField label="ZIP Code" value={location.zipCode} />
          <InfoField label="Phone" value={location.phone || undefined} mono />
          <InfoField label="Loading Docks" value={location.dockCount?.toString()} />
          <InfoField label="Average Wait" value={location.averageWaitTime ? `${location.averageWaitTime} minutes` : "N/A"} />
        </div>
      </Card>

      {/* Operating Hours */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Operating Hours</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground capitalize">
                {day}
              </span>
              <span className="text-sm font-medium font-mono">
                {hours.closed ? (
                  <Badge variant="secondary">Closed</Badge>
                ) : (
                  `${hours.open} - ${hours.close}`
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Warning className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> Hours may vary on holidays. Call ahead to confirm availability.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DocksTab({ location }: { location: Location }) {
  return (
    <div className="space-y-6">
      {/* Dock Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Loading Dock Information</h3>
          </div>
          <Badge variant="outline">{location.dockCount || 0} Total Docks</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Dock Specifications</h4>
            <InfoField label="Total Docks" value={location.dockCount?.toString() || "N/A"} />
            <InfoField label="Dock Height" value="48 inches" />
            <InfoField label="Door Width" value="8 feet" />
            <InfoField label="Maximum Trailer Length" value="53 feet" />
            <InfoField label="Overhead Clearance" value="13'6&quot;" />
            <InfoField label="Dock Levelers" value="Hydraulic" />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Equipment Available</h4>
            <div className="space-y-2">
              {[
                { item: "Dock Plates", available: true },
                { item: "Yard Jockeys", available: true },
                { item: "Forklifts", available: true },
                { item: "Pallet Jacks", available: true },
                { item: "Scale", available: false },
                { item: "Wash Bay", available: false },
              ].map((equipment, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">{equipment.item}</span>
                  <Badge variant={equipment.available ? "default" : "secondary"}>
                    {equipment.available ? "Available" : "Not Available"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Warning className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Important:</strong> Appointments required for all deliveries.
              Contact facility 24 hours in advance to schedule dock time.
            </div>
          </div>
        </div>
      </Card>

      {/* Current Dock Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Dock Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: location.dockCount || 8 }, (_, index) => (
            <DockStatusCard key={index} dockNumber={index + 1} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function ReviewsTab({ location }: { location: Location }) {
  const reviews = generateDriverReviews()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Driver Reviews</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-mono font-medium">{location.rating || "4.2"}</span>
            <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

function PhotosTab({ location: _location }: { location: Location }) {
  const photos = generateLocationPhotos()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Location Photos</h3>
        <Button size="sm" className="gap-2">
          <Camera className="h-4 w-4" />
          Add Photos
        </Button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No photos available</p>
          <p className="text-sm text-muted-foreground">Add photos to help drivers navigate</p>
        </Card>
      )}
    </div>
  )
}

function InstructionsTab({ location: _location }: { location: Location }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Special Instructions</h3>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
              Delivery Instructions
            </h4>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <ul className="text-sm space-y-1">
                <li>• Use entrance on North side of building</li>
                <li>• Check in at security gate with photo ID</li>
                <li>• Maximum wait time: 2 hours before detention charges apply</li>
                <li>• Driver must remain with vehicle at all times</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-2">
              Safety Requirements
            </h4>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <ul className="text-sm space-y-1">
                <li>• Hard hat required in loading area</li>
                <li>• High-visibility vest mandatory</li>
                <li>• No smoking anywhere on property</li>
                <li>• Speed limit: 10 mph maximum</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
              Restrictions & Prohibited Items
            </h4>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <ul className="text-sm space-y-1">
                <li>• No hazardous materials accepted</li>
                <li>• Overnight parking not permitted</li>
                <li>• Cell phone use prohibited in loading area</li>
                <li>• Maximum combined vehicle weight: 80,000 lbs</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
              Contact Information
            </h4>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-sm space-y-2">
                <div>
                  <strong>Shipping Office:</strong> <span className="font-mono">(602) 739-1842</span>
                </div>
                <div>
                  <strong>Security:</strong> <span className="font-mono">(602) 739-1846</span>
                </div>
                <div>
                  <strong>Emergency:</strong> <span className="font-mono">(602) 739-1991</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Helper Components
function MetricCard({
  title,
  value,
  icon,
  subtitle,
  alert = false,
}: {
  title: string
  value: string
  icon: React.ReactNode
  subtitle: string
  alert?: boolean
}) {
  return (
    <Card className={cn("p-4", alert && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20")}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </Card>
  )
}

function InfoField({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono")}>
        {value || "—"}
      </span>
    </div>
  )
}

const DOCK_STATUSES = ["available", "occupied", "maintenance", "reserved"] as const;

const DOCK_STATUS_CONFIG = {
  available: { color: "bg-green-500", label: "Available" },
  occupied: { color: "bg-red-500", label: "Occupied" },
  maintenance: { color: "bg-yellow-500", label: "Maintenance" },
  reserved: { color: "bg-blue-500", label: "Reserved" },
};

function DockStatusCard({ dockNumber }: { dockNumber: number }) {
  const [status] = useState(() => DOCK_STATUSES[Math.floor(Math.random() * DOCK_STATUSES.length)]);

  const config = DOCK_STATUS_CONFIG[status]

  return (
    <div className="p-3 border rounded-lg text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className={cn("w-2 h-2 rounded-full", config.color)} />
        <span className="font-mono font-medium">Dock {dockNumber}</span>
      </div>
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  )
}

function ReviewCard({ review }: { review: DriverReview }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-medium">{review.driverName}</span>
              {review.orderNumber && (
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  {review.orderNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < review.rating ? "text-yellow-500" : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{review.comment}</p>
    </Card>
  )
}

function PhotoCard({ photo }: { photo: LocationPhoto }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center">
        <Camera className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium">{photo.caption}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(photo.uploadedAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  )
}

// Mock data generators
function generateDriverReviews(): DriverReview[] {
  return [
    {
      id: 1,
      driverName: "Mike Johnson",
      rating: 5,
      comment: "Great facility! Quick loading, friendly staff. Dock height was perfect for my trailer.",
      createdAt: "2026-03-10",
      orderNumber: "TMS-67890"
    },
    {
      id: 2,
      driverName: "Sarah Miller",
      rating: 4,
      comment: "Easy to find, good parking. Wait time was a bit longer than expected but overall good experience.",
      createdAt: "2026-03-08",
      orderNumber: "TMS-67845"
    },
    {
      id: 3,
      driverName: "Carlos Rodriguez",
      rating: 5,
      comment: "Excellent security, well-organized loading process. Would definitely deliver here again.",
      createdAt: "2026-03-05",
      orderNumber: "TMS-67801"
    },
  ]
}

function generateLocationPhotos(): LocationPhoto[] {
  return [
    {
      id: 1,
      url: "/photos/location-entrance.jpg",
      caption: "Main entrance - North side",
      uploadedAt: "2026-02-15"
    },
    {
      id: 2,
      url: "/photos/loading-docks.jpg",
      caption: "Loading docks 1-4",
      uploadedAt: "2026-02-15"
    },
    {
      id: 3,
      url: "/photos/parking-area.jpg",
      caption: "Driver parking area",
      uploadedAt: "2026-02-15"
    },
  ]
}
