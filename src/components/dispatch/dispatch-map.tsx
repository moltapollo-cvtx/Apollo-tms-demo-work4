"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Truck,
  Plus as ZoomIn,
  Minus as ZoomOut,
  Crosshair,
  Stack as Layers,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  status: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTractor?: {
    unitNumber: string;
  };
}

interface Stop {
  id: number;
  type: string;
  city: string;
  state: string;
  latitude?: string;
  longitude?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  priorityLevel: string;
  stops: Stop[];
}

interface DispatchMapProps {
  drivers: Driver[];
  orders: Order[];
  className?: string;
}

const mockLocations = [
  // Major US cities for demonstration
  { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  { name: "Atlanta, GA", lat: 33.7490, lng: -84.3880 },
  { name: "Phoenix, AZ", lat: 33.4484, lng: -112.0740 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
];

const statusColors = {
  available: "text-apollo-cyan-500",
  on_load: "text-blue-500",
  off_duty: "text-zinc-400",
  sleeper: "text-sky-500",
  driving: "text-orange-500",
  on_break: "text-yellow-500",
} as const;

const priorityColors = {
  urgent: "text-red-500",
  high: "text-orange-500",
  normal: "text-blue-500",
  low: "text-zinc-500",
} as const;

export function DispatchMap({ drivers, orders, className }: DispatchMapProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Geographic center of US
  const [zoomLevel, setZoomLevel] = useState(4);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"drivers" | "orders" | "both">("both");
  const mapRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 12));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  };

  const handleRecenter = () => {
    setMapCenter({ lat: 39.8283, lng: -98.5795 });
    setZoomLevel(4);
  };

  const getPositionStyle = (lat: number, lng: number) => {
    // Simple projection for demonstration (not geographically accurate)
    const centerLat = mapCenter.lat;
    const centerLng = mapCenter.lng;
    const scale = zoomLevel * 10;

    const x = ((lng - centerLng) * scale) + 50;
    const y = ((centerLat - lat) * scale) + 50;

    return {
      left: `${Math.max(0, Math.min(100, x))}%`,
      top: `${Math.max(0, Math.min(100, y))}%`,
    };
  };

  const getDriverPosition = (driver: Driver) => {
    if (driver.currentLocation) {
      return getPositionStyle(driver.currentLocation.latitude, driver.currentLocation.longitude);
    }
    // Fallback to random mock position
    const mockLocation = mockLocations[driver.id % mockLocations.length];
    return getPositionStyle(mockLocation.lat, mockLocation.lng);
  };

  const getOrderStopPositions = (order: Order) => {
    return order.stops
      .filter(stop => stop.latitude && stop.longitude)
      .map(stop => ({
        ...stop,
        position: getPositionStyle(parseFloat(stop.latitude!), parseFloat(stop.longitude!))
      }));
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card", className)}>
      {/* Map Controls - Mobile Optimized */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Zoom & Navigation Controls */}
        <div className="flex gap-1 rounded-xl border border-border bg-background/95 backdrop-blur p-1 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 touch-manipulation"
                onClick={handleZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 touch-manipulation"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 touch-manipulation"
                onClick={handleRecenter}
                aria-label="Recenter map"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Recenter</TooltipContent>
          </Tooltip>
        </div>

        {/* View Mode Toggle - Simplified for Mobile */}
        <div className="flex gap-1 rounded-xl border border-border bg-background/95 backdrop-blur p-1 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "drivers" ? "primary" : "ghost"}
                size="sm"
                className="h-9 w-9 p-0 touch-manipulation"
                onClick={() => setViewMode("drivers")}
                aria-label="Show drivers only"
                aria-pressed={viewMode === "drivers"}
              >
                <Truck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Show Drivers Only</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "orders" ? "primary" : "ghost"}
                size="sm"
                className="h-9 w-9 p-0 touch-manipulation"
                onClick={() => setViewMode("orders")}
                aria-label="Show orders only"
                aria-pressed={viewMode === "orders"}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Show Orders Only</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "both" ? "primary" : "ghost"}
                size="sm"
                className="h-9 w-9 p-0 touch-manipulation"
                onClick={() => setViewMode("both")}
                aria-label="Show both drivers and orders"
                aria-pressed={viewMode === "both"}
              >
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Show Both</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Map Legend - Mobile Optimized */}
      <div className="absolute top-3 left-3 z-20 rounded-xl border border-border bg-background/95 backdrop-blur p-3 shadow-sm lg:block">
        {/* Desktop Legend */}
        <div className="hidden sm:block">
          <h4 className="text-sm font-medium text-foreground mb-2" id="map-legend">Map Legend</h4>
          <div className="space-y-1.5 text-xs" role="list" aria-labelledby="map-legend">
            <div className="flex items-center gap-2" role="listitem">
              <Truck className="h-3 w-3 text-apollo-cyan-500" aria-hidden="true" />
              <span>Available Drivers</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <Truck className="h-3 w-3 text-blue-500" aria-hidden="true" />
              <span>Drivers On Load</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <MapPin className="h-3 w-3 text-red-500" aria-hidden="true" />
              <span>Urgent Pickup/Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono" aria-label={`Current zoom level: ${zoomLevel}`}>Zoom: {zoomLevel}</div>
            </div>
          </div>
        </div>

        {/* Mobile Compact Legend */}
        <div className="block sm:hidden">
          <div className="flex items-center gap-2 text-xs">
            <Truck className="h-3 w-3 text-apollo-cyan-500" aria-hidden="true" />
            <span className="font-mono">{zoomLevel}x</span>
          </div>
        </div>
      </div>

      {/* Map Container - Touch & Accessibility Optimized */}
      <div
        ref={mapRef}
        className="relative w-full h-full min-h-[300px] sm:min-h-[400px] bg-gradient-to-br from-slate-50 via-slate-75 to-slate-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 touch-pan-x touch-pan-y overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(99,102,241,0.08) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(34,197,94,0.08) 2px, transparent 2px),
            radial-gradient(circle at 50% 10%, rgba(251,191,36,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px),
            linear-gradient(0deg, rgba(148,163,184,0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${40 / Math.max(zoomLevel, 1)}px ${40 / Math.max(zoomLevel, 1)}px, ${60 / Math.max(zoomLevel, 1)}px ${60 / Math.max(zoomLevel, 1)}px, ${30 / Math.max(zoomLevel, 1)}px ${30 / Math.max(zoomLevel, 1)}px, ${20 / Math.max(zoomLevel, 1)}px ${20 / Math.max(zoomLevel, 1)}px, ${20 / Math.max(zoomLevel, 1)}px ${20 / Math.max(zoomLevel, 1)}px`,
          backgroundPosition: '0 0, 10px 10px, 5px 5px, 0 0, 0 0'
        }}
        role="img"
        aria-label="Live fleet map showing driver and order locations"
        tabIndex={0}
      >
        {/* Enhanced Map Visual */}
        <div className="absolute inset-0">
          {/* Geographic terrain features */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 15% 25%, rgba(34, 197, 94, 0.12) 0%, transparent 45%),
                radial-gradient(ellipse at 85% 15%, rgba(59, 130, 246, 0.1) 0%, transparent 55%),
                radial-gradient(ellipse at 65% 85%, rgba(251, 191, 36, 0.08) 0%, transparent 40%),
                radial-gradient(ellipse at 40% 60%, rgba(168, 85, 247, 0.06) 0%, transparent 35%),
                radial-gradient(ellipse at 75% 45%, rgba(239, 68, 68, 0.05) 0%, transparent 30%)
              `,
              backgroundSize: `${300 / Math.max(zoomLevel, 1)}px ${200 / Math.max(zoomLevel, 1)}px, ${250 / Math.max(zoomLevel, 1)}px ${300 / Math.max(zoomLevel, 1)}px, ${200 / Math.max(zoomLevel, 1)}px ${250 / Math.max(zoomLevel, 1)}px, ${180 / Math.max(zoomLevel, 1)}px ${180 / Math.max(zoomLevel, 1)}px, ${150 / Math.max(zoomLevel, 1)}px ${220 / Math.max(zoomLevel, 1)}px`
            }}
          />

          {/* Terrain elevation lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(100,116,139,0.1) 2px, rgba(100,116,139,0.1) 3px),
                repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(148,163,184,0.08) 3px, rgba(148,163,184,0.08) 4px)
              `,
              backgroundSize: `${25 / Math.max(zoomLevel, 1)}px ${25 / Math.max(zoomLevel, 1)}px, ${35 / Math.max(zoomLevel, 1)}px ${35 / Math.max(zoomLevel, 1)}px`
            }}
          />

          {/* Interstate highway system */}
          <svg className="absolute inset-0 w-full h-full opacity-25" style={{ zIndex: 5 }}>
            <defs>
              <pattern id="highway-pattern" patternUnits="userSpaceOnUse" width="8" height="4">
                <rect width="8" height="4" fill="transparent" />
                <rect width="6" height="2" x="1" y="1" fill="rgba(59,130,246,0.4)" />
                <rect width="2" height="2" x="1" y="1" fill="rgba(255,255,255,0.6)" />
                <rect width="2" height="2" x="5" y="1" fill="rgba(255,255,255,0.6)" />
              </pattern>
              <pattern id="road-pattern" patternUnits="userSpaceOnUse" width="6" height="2">
                <rect width="6" height="2" fill="transparent" />
                <rect width="4" height="1" x="1" y="0.5" fill="rgba(100,116,139,0.5)" />
                <rect width="1" height="1" x="1" y="0.5" fill="rgba(255,255,255,0.3)" />
                <rect width="1" height="1" x="4" y="0.5" fill="rgba(255,255,255,0.3)" />
              </pattern>
            </defs>

            {/* Major interstates */}
            <path
              d="M 5,150 Q 120,130 240,140 Q 360,150 480,135 Q 600,120 720,140 Q 840,160 950,145"
              stroke="url(#highway-pattern)"
              strokeWidth="4"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 150,5 Q 170,120 160,240 Q 150,360 165,480 Q 180,600 155,720"
              stroke="url(#highway-pattern)"
              strokeWidth="4"
              fill="none"
              opacity="0.5"
            />

            {/* Secondary highways */}
            <path
              d="M 50,200 Q 200,180 350,195 Q 500,210 650,190"
              stroke="url(#road-pattern)"
              strokeWidth="3"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 200,50 Q 220,180 210,310 Q 200,440 215,570"
              stroke="url(#road-pattern)"
              strokeWidth="3"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 100,100 Q 300,120 500,105 Q 700,90 900,110"
              stroke="url(#road-pattern)"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>

          {/* City markers */}
          <div className="absolute inset-0 opacity-20">
            {mockLocations.slice(0, 5).map((location, index) => {
              const position = getPositionStyle(location.lat, location.lng);
              return (
                <div
                  key={index}
                  className="absolute w-1 h-1 bg-slate-600 rounded-full"
                  style={{
                    ...position,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })}
          </div>

          {/* Map attribution */}
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground/60 font-mono bg-background/80 px-2 py-1 rounded backdrop-blur">
            Apollo TMS • Live Fleet Map
          </div>
        </div>

        {/* Driver positions */}
        {(viewMode === "drivers" || viewMode === "both") && drivers.map((driver) => {
          const position = getDriverPosition(driver);
          const statusColor = statusColors[driver.status as keyof typeof statusColors] || statusColors.available;

          return (
            <Tooltip key={driver.id}>
              <TooltipTrigger asChild>
                <motion.div
                  className={cn(
                    "absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2",
                    selectedDriver === driver.id && "z-20"
                  )}
                  style={position}
                  initial={{ scale: 0, rotate: -180, opacity: 0, y: 20 }}
                  animate={{
                    scale: selectedDriver === driver.id ? 1.3 : 1,
                    rotate: 0,
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 0.6,
                    delay: 0.1 + (driver.id % 10) * 0.02,
                  }}
                  whileHover={{
                    scale: selectedDriver === driver.id ? 1.4 : 1.2,
                    y: -3,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 20,
                      mass: 0.4
                    }
                  }}
                  whileTap={{
                    scale: selectedDriver === driver.id ? 1.2 : 0.95,
                    transition: {
                      type: "spring",
                      stiffness: 600,
                      damping: 25,
                      mass: 0.3
                    }
                  }}
                  onClick={() => setSelectedDriver(selectedDriver === driver.id ? null : driver.id)}
                >
                  <div className="relative">
                    {/* Truck icon with enhanced styling */}
                    <motion.div
                      className={cn(
                        "relative p-1.5 rounded-lg shadow-md backdrop-blur-sm",
                        selectedDriver === driver.id
                          ? "bg-white/95 border-2 border-primary"
                          : "bg-white/80 border border-white/60"
                      )}
                      animate={{
                        boxShadow: selectedDriver === driver.id
                          ? "0 4px 20px rgba(0,0,0,0.15)"
                          : "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      <Truck className={cn("h-5 w-5", statusColor)} />
                    </motion.div>

                    {/* Status indicator rings */}
                    {driver.status === "driving" && (
                      <>
                        <motion.div
                          className="absolute -inset-2 rounded-full border-2 border-orange-400/60"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.8, 0.3, 0.8]
                          }}
                          transition={{ type: "tween", repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="absolute -inset-3 rounded-full border border-orange-300/40"
                          animate={{
                            scale: [1, 1.6, 1],
                            opacity: [0.6, 0.1, 0.6]
                          }}
                          transition={{ type: "tween", repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.3 }}
                        />
                      </>
                    )}

                    {driver.status === "available" && selectedDriver !== driver.id && (
                      <motion.div
                        className="absolute -inset-1.5 rounded-full border border-apollo-cyan-400/50"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ type: "tween", repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      />
                    )}

                    {selectedDriver === driver.id && (
                      <motion.div
                        className="absolute -inset-3 rounded-full border-2 border-primary/50"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: [0.8, 1.2, 0.8],
                          opacity: [0, 0.7, 0]
                        }}
                        transition={{ type: "tween", repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <div className="space-y-1">
                  <div className="font-medium">
                    {driver.firstName} {driver.lastName}
                  </div>
                  <div className="text-sm font-mono">{driver.employeeId}</div>
                  {driver.currentTractor && (
                    <div className="text-sm">Tractor: {driver.currentTractor.unitNumber}</div>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {driver.status.replace("_", " ")}
                  </Badge>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Order stop positions */}
        {(viewMode === "orders" || viewMode === "both") && orders.map((order) => {
          const stopPositions = getOrderStopPositions(order);
          const priorityColor = priorityColors[order.priorityLevel as keyof typeof priorityColors] || priorityColors.normal;

          return stopPositions.map((stop) => (
            <Tooltip key={`${order.id}-${stop.id}`}>
              <TooltipTrigger asChild>
                <motion.div
                  className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-full"
                  style={stop.position}
                  initial={{ scale: 0, y: -30, opacity: 0, rotate: -15 }}
                  animate={{
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    rotate: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 28,
                    mass: 0.5,
                    delay: 0.2 + (stop.id % 5) * 0.05,
                  }}
                  whileHover={{
                    scale: 1.2,
                    y: -4,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 18,
                      mass: 0.3
                    }
                  }}
                  whileTap={{
                    scale: 0.9,
                    transition: {
                      type: "spring",
                      stiffness: 600,
                      damping: 25,
                      mass: 0.2
                    }
                  }}
                >
                  <div className="relative">
                    {/* Pin with enhanced styling */}
                    <motion.div
                      className="relative"
                      whileHover={{
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                      }}
                    >
                      <MapPin className={cn("h-6 w-6", priorityColor)} />

                      {/* Priority pulse for urgent orders */}
                      {order.priorityLevel === "urgent" && (
                        <motion.div
                          className="absolute top-1 left-1 right-1 bottom-2 rounded-full bg-red-400/30"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 0.2, 0.6]
                          }}
                          transition={{
                            type: "tween",
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut"
                          }}
                        />
                      )}

                      {/* High priority indicator */}
                      {order.priorityLevel === "high" && (
                        <motion.div
                          className="absolute top-1 left-1 right-1 bottom-2 rounded-full bg-orange-400/25"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.1, 0.5]
                          }}
                          transition={{
                            type: "tween",
                            repeat: Infinity,
                            duration: 2.5,
                            ease: "easeInOut"
                          }}
                        />
                      )}
                    </motion.div>

                    {/* Small connecting line to ground */}
                    <div className="absolute -bottom-1 left-1/2 w-0.5 h-2 bg-current opacity-40 transform -translate-x-1/2" />
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <div className="space-y-1">
                  <div className="font-medium">{order.orderNumber}</div>
                  <div className="text-sm capitalize">
                    {stop.type} at {stop.city}, {stop.state}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {order.priorityLevel} Priority
                  </Badge>
                </div>
              </TooltipContent>
            </Tooltip>
          ));
        })}

        {/* Real-time update indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-sm"
        >
          <div className="relative">
            <motion.div
              className="h-2 w-2 rounded-full bg-apollo-cyan-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ type: "tween", repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 h-2 w-2 rounded-full bg-apollo-cyan-500/50"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{ type: "tween", repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 h-2 w-2 rounded-full bg-apollo-cyan-500/30"
              animate={{
                scale: [1, 2.5, 1],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{
                type: "tween",
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
          </div>
          <span className="font-mono text-muted-foreground">Live Updates</span>
        </motion.div>
      </div>
    </div>
  );
}
