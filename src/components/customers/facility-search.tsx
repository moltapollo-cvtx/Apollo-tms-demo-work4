"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  MagnifyingGlass,
  MapPin,
  Star,
  Clock,
  Truck,
  Phone,
  ListBullets,
  Globe,
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tabs } from "@/components/ui/tabs"
import { LocationDetail } from "./location-detail"
import type { Location } from "@/types"

interface FacilitySearchProps {
  onLocationSelect?: (location: Location) => void
}

export function FacilitySearch({ onLocationSelect }: FacilitySearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [_facilityTypeFilter, _setFacilityTypeFilter] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  const [activeView, setActiveView] = useState<"list" | "map">("list")
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  // Mock facility data - in real app, this would come from API
  const facilities = useMemo(() => generateMockFacilities(), [])

  const filteredFacilities = useMemo(() => {
    return facilities.filter(facility => {
      const matchesSearch = !searchQuery ||
        facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.state.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesState = !stateFilter || facility.state === stateFilter

      const matchesRating = !ratingFilter ||
        (facility.rating && parseFloat(facility.rating) >= parseFloat(ratingFilter))

      return matchesSearch && matchesState && matchesRating
    })
  }, [facilities, searchQuery, stateFilter, ratingFilter])

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location)
    onLocationSelect?.(location)
  }

  const handleBackToSearch = () => {
    setSelectedLocation(null)
  }

  if (selectedLocation) {
    return <LocationDetail location={selectedLocation} onBack={handleBackToSearch} />
  }

  const tabs = [
    {
      value: "list",
      label: "List View",
      icon: <ListBullets className="h-4 w-4" />
    },
    {
      value: "map",
      label: "Map View",
      icon: <Globe className="h-4 w-4" />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Facility Search</h2>
          <p className="text-sm text-muted-foreground">
            Find customer facilities, dock information, and driver ratings
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {filteredFacilities.length} facilities found
        </div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border"
      >
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facilities by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 w-full bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
          />
        </div>
        <Select
          value={stateFilter}
          onValueChange={(value) => setStateFilter(Array.isArray(value) ? value[0] : value)}
          options={[
            { value: "", label: "All States" },
            { value: "AZ", label: "Arizona" },
            { value: "CA", label: "California" },
            { value: "CO", label: "Colorado" },
            { value: "NV", label: "Nevada" },
            { value: "TX", label: "Texas" },
            { value: "UT", label: "Utah" },
          ]}
          placeholder="Filter by state"
        />
        <Select
          value={ratingFilter}
          onValueChange={(value) => setRatingFilter(Array.isArray(value) ? value[0] : value)}
          options={[
            { value: "", label: "All Ratings" },
            { value: "4.5", label: "4.5+ Stars" },
            { value: "4.0", label: "4.0+ Stars" },
            { value: "3.5", label: "3.5+ Stars" },
            { value: "3.0", label: "3.0+ Stars" },
          ]}
          placeholder="Min rating"
        />
      </motion.div>

      {/* View Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as "list" | "map")}
        tabs={tabs}
      />

      {/* Content */}
      {activeView === "list" ? (
        <FacilityListView
          facilities={filteredFacilities}
          onFacilityClick={handleLocationClick}
        />
      ) : (
        <FacilityMapView
          facilities={filteredFacilities}
          onFacilityClick={handleLocationClick}
        />
      )}
    </div>
  )
}

function FacilityListView({
  facilities,
  onFacilityClick,
}: {
  facilities: Location[]
  onFacilityClick: (facility: Location) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {facilities.map((facility, index) => (
        <motion.div
          key={facility.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <FacilityCard
            facility={facility}
            onClick={() => onFacilityClick(facility)}
          />
        </motion.div>
      ))}
      {facilities.length === 0 && (
        <Card className="p-8 text-center col-span-2">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No facilities found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
        </Card>
      )}
    </div>
  )
}

function FacilityMapView({
  facilities,
  onFacilityClick,
}: {
  facilities: Location[]
  onFacilityClick: (facility: Location) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <Card className="lg:col-span-2 p-6">
        <div className="aspect-[16/10] bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Mock map background */}
          <div className="absolute inset-0 bg-gradient-to-br from-apollo-cyan-100 to-apollo-cyan-200 dark:from-apollo-cyan-950 dark:to-apollo-cyan-900" />

          {/* Mock road lines */}
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-0 right-0 h-1 bg-gray-400/30" />
            <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-gray-400/30" />
            <div className="absolute top-2/3 left-0 right-0 h-1 bg-gray-400/30" />
            <div className="absolute right-1/4 top-0 bottom-0 w-1 bg-gray-400/30" />
          </div>

          {/* Mock facility markers */}
          {facilities.slice(0, 8).map((facility, index) => {
            const positions = [
              { top: '25%', left: '20%' },
              { top: '45%', left: '35%' },
              { top: '30%', left: '60%' },
              { top: '55%', left: '25%' },
              { top: '70%', left: '50%' },
              { top: '40%', left: '80%' },
              { top: '65%', left: '75%' },
              { top: '20%', left: '45%' },
            ]
            const position = positions[index % positions.length]

            return (
              <motion.button
                key={facility.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute w-8 h-8 bg-primary rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
                style={position}
                onClick={() => onFacilityClick(facility)}
              >
                <MapPin className="h-4 w-4 text-white" />

                {/* Facility tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-background border border-border rounded-lg shadow-lg p-2 min-w-[150px] text-left">
                    <div className="font-medium text-sm">{facility.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {facility.city}, {facility.state}
                    </div>
                    {facility.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-mono">{facility.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}

          {/* Map controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button size="sm" variant="outline" className="w-8 h-8 p-0">+</Button>
            <Button size="sm" variant="outline" className="w-8 h-8 p-0">-</Button>
          </div>

          {/* Center text */}
          <div className="text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">Interactive Facility Map</p>
            <p className="text-sm text-muted-foreground">
              Click markers to view facility details
            </p>
          </div>
        </div>
      </Card>

      {/* Facility List Sidebar */}
      <Card className="p-4 max-h-[600px] overflow-y-auto">
        <h3 className="font-semibold mb-4">Facilities on Map</h3>
        <div className="space-y-3">
          {facilities.slice(0, 8).map((facility) => (
            <FacilityListItem
              key={facility.id}
              facility={facility}
              onClick={() => onFacilityClick(facility)}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

function FacilityCard({
  facility,
  onClick,
}: {
  facility: Location
  onClick: () => void
}) {
  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{facility.name}</h3>
            <p className="text-sm text-muted-foreground">
              {facility.city}, {facility.state} {facility.zipCode}
            </p>
          </div>
        </div>
        {facility.rating && (
          <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-1 rounded">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="font-mono text-sm">{facility.rating}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Truck className="h-4 w-4" />
          </div>
          <div className="font-mono font-medium">{facility.dockCount || "N/A"}</div>
          <div className="text-xs text-muted-foreground">Docks</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
          </div>
          <div className="font-mono font-medium">
            {facility.averageWaitTime ? `${facility.averageWaitTime}m` : "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">Wait Time</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Phone className="h-4 w-4" />
          </div>
          <div className="font-mono text-xs">
            {facility.phone ? "Available" : "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">Contact</div>
        </div>
      </div>

      {facility.notes && (
        <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          {facility.notes.slice(0, 100)}...
        </div>
      )}
    </Card>
  )
}

function FacilityListItem({
  facility,
  onClick,
}: {
  facility: Location
  onClick: () => void
}) {
  return (
    <div
      className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-primary rounded-full" />
        <span className="font-medium text-sm truncate">{facility.name}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {facility.city}, {facility.state}
      </div>
      {facility.rating && (
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 text-yellow-500" />
          <span className="text-xs font-mono">{facility.rating}</span>
        </div>
      )}
    </div>
  )
}

// Mock data generator
function generateMockFacilities(): Location[] {
  const facilities = [
    {
      id: 1,
      name: "Phoenix Distribution Center",
      address: "1234 Industrial Blvd",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85001",
      phone: "(602) 739-1842",
      latitude: "33.4484000",
      longitude: "-112.0740000",
      dockCount: 12,
      averageWaitTime: 45,
      rating: "4.6",
      notes: "Large facility with excellent dock access and fast turnaround times."
    },
    {
      id: 2,
      name: "Los Angeles Warehouse",
      address: "5678 Commerce Way",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90021",
      phone: "(213) 748-2391",
      latitude: "34.0522000",
      longitude: "-118.2437000",
      dockCount: 8,
      averageWaitTime: 75,
      rating: "3.9",
      notes: "Busy facility, recommend scheduling appointments in advance."
    },
    {
      id: 3,
      name: "Denver Logistics Hub",
      address: "9876 Freight Station Rd",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      phone: "(303) 515-4472",
      latitude: "39.7392000",
      longitude: "-104.9903000",
      dockCount: 16,
      averageWaitTime: 30,
      rating: "4.8",
      notes: "State-of-the-art facility with excellent driver amenities."
    },
    {
      id: 4,
      name: "Las Vegas Terminal",
      address: "4321 Desert Point Dr",
      city: "Las Vegas",
      state: "NV",
      zipCode: "89101",
      phone: "(702) 863-1154",
      latitude: "36.1699000",
      longitude: "-115.1398000",
      dockCount: 6,
      averageWaitTime: 60,
      rating: "4.2",
      notes: "Smaller facility but good customer service and quick processing."
    },
    {
      id: 5,
      name: "Dallas Freight Center",
      address: "2468 Cargo Ave",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      phone: "(214) 771-6398",
      latitude: "32.7767000",
      longitude: "-96.7970000",
      dockCount: 20,
      averageWaitTime: 40,
      rating: "4.5",
      notes: "Major hub with multiple dock configurations and 24/7 operations."
    },
    {
      id: 6,
      name: "Salt Lake Distribution",
      address: "1357 Mountain View Blvd",
      city: "Salt Lake City",
      state: "UT",
      zipCode: "84101",
      phone: "(801) 447-2836",
      latitude: "40.7608000",
      longitude: "-111.8910000",
      dockCount: 10,
      averageWaitTime: 35,
      rating: "4.7",
      notes: "Well-organized facility with excellent security and driver parking."
    },
  ]

  return facilities.map(f => ({
    ...f,
    customerId: null,
    operatingHours: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }))
}
