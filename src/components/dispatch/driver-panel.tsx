"use client";

import { useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  User,
  Phone,
  EnvelopeSimple,
  MapPin,
  Truck,
  CheckCircle,
  ShieldCheck,
  Package,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Stop {
  id: number;
  type: string;
  city: string;
  state: string;
  scheduledDate: string;
  sequence: number;
  address?: string;
  isCompleted: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  commodity: string;
  weight: string;
  priorityLevel: string;
  status: string;
  totalRevenue: string;
  miles: string;
  customerReferenceNumber?: string;
}

interface Customer {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  assignment: {
    id: number;
    assignedAt: string;
    dispatchedAt?: string;
  };
  order: Order;
  customer: Customer;
  stops: Stop[];
}

interface Qualification {
  id: number;
  qualificationType: string;
  expirationDate: string;
  certificateNumber: string;
  isActive: boolean;
}

interface Certification {
  id: number;
  certificationType: string;
  expirationDate: string;
  certificateNumber: string;
  isActive: boolean;
}

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  status: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  hireDate?: string;
  cdlNumber?: string;
  cdlExpiration?: string;
  medicalCertExpiration?: string;
  homeTimePreference?: number;
  safetyScore?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentAssignments: Assignment[];
  currentTractor?: {
    id: number;
    unitNumber: string;
    make: string;
    model: string;
    year?: number;
    currentOdometer?: number;
  };
  currentTrailer?: {
    id: number;
    unitNumber: string;
    trailerType: string;
    make?: string;
    model?: string;
  };
  qualifications?: Qualification[];
  certifications?: Certification[];
}

interface DriverPanelProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignLoad?: (driverId: number) => void;
  onContactDriver?: (driverId: number, method: "phone" | "email") => void;
}

type DriverPanelTabId = "overview" | "loads" | "equipment" | "compliance";

const statusColors = {
  available: "text-apollo-cyan-500 bg-apollo-cyan-50 dark:bg-apollo-cyan-950/20",
  on_load: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  off_duty: "text-zinc-400 bg-zinc-50 dark:bg-zinc-950/20",
  sleeper: "text-sky-500 bg-sky-50 dark:bg-sky-950/20",
  driving: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
  on_break: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
} as const;

const statusLabels = {
  available: "Available",
  on_load: "On Load",
  off_duty: "Off Duty",
  sleeper: "Sleeper",
  driving: "Driving",
  on_break: "On Break",
} as const;

export function DriverPanel({
  driver,
  isOpen,
  onClose,
  onAssignLoad,
  onContactDriver
}: DriverPanelProps) {
  const [activeTab, setActiveTab] = useState<DriverPanelTabId>("overview");

  if (!driver) return null;

  const formatRevenue = (revenue: string | number) => {
    const num = typeof revenue === "string" ? parseFloat(revenue) : revenue;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const timeDiff = expDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getExpirationStatus = (days: number) => {
    if (days < 0) return { label: "EXPIRED", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-950/20" };
    if (days <= 30) return { label: `${days}d`, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-950/20" };
    return { label: `${days}d`, color: "text-apollo-cyan-600", bgColor: "bg-apollo-cyan-100 dark:bg-apollo-cyan-950/20" };
  };

  const statusInfo = statusColors[driver.status as keyof typeof statusColors] || statusColors.available;
  const statusLabel = statusLabels[driver.status as keyof typeof statusLabels] || "Unknown";

  const totalRevenue = driver.currentAssignments.reduce((sum, assignment) => {
    return sum + parseFloat(assignment.order.totalRevenue || "0");
  }, 0);

  const totalMiles = driver.currentAssignments.reduce((sum, assignment) => {
    return sum + parseFloat(assignment.order.miles || "0");
  }, 0);

  // Mock HOS data (would come from ELD integration)
  const hosData = {
    drive: { used: 8.5, limit: 11 },
    onDuty: { used: 12, limit: 14 },
    cycle: { used: 65, limit: 70 },
  };

  const tabs: Array<{ id: DriverPanelTabId; label: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "Overview", icon: User },
    { id: "loads", label: "Current Loads", icon: Package },
    { id: "equipment", label: "Equipment", icon: Truck },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="border-b border-border p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 bg-muted">
                    <div className="flex h-full w-full items-center justify-center text-lg font-mono font-bold">
                      {driver.firstName[0]}{driver.lastName[0]}
                    </div>
                  </Avatar>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background", statusInfo.split(" ")[0])} />
                </div>

                <div>
                  <SheetTitle className="text-lg">
                    {driver.firstName} {driver.lastName}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono text-muted-foreground">{driver.employeeId}</span>
                    <Badge className={cn("text-xs h-5", statusInfo)}>
                      {statusLabel}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {driver.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContactDriver?.(driver.id, "phone")}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {driver.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContactDriver?.(driver.id, "email")}
                  >
                    <EnvelopeSimple className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAssignLoad?.(driver.id)}
                  disabled={driver.status !== "available"}
                >
                  Assign Load
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Tab Navigation */}
          <div className="border-b border-border px-6">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg",
                      activeTab === tab.id
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="space-y-6"
                >
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-lg font-mono font-bold text-foreground">
                        {driver.currentAssignments.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Loads</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-lg font-mono font-bold text-foreground">
                        {totalMiles.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Miles</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-lg font-mono font-bold text-foreground">
                        {formatRevenue(totalRevenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>

                  {/* HOS Status */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Hours of Service</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Drive Time</span>
                          <span className="font-mono">{hosData.drive.used}/{hosData.drive.limit}h</span>
                        </div>
                        <Progress value={(hosData.drive.used / hosData.drive.limit) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>On Duty</span>
                          <span className="font-mono">{hosData.onDuty.used}/{hosData.onDuty.limit}h</span>
                        </div>
                        <Progress value={(hosData.onDuty.used / hosData.onDuty.limit) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>70-Hour Cycle</span>
                          <span className="font-mono">{hosData.cycle.used}/{hosData.cycle.limit}h</span>
                        </div>
                        <Progress value={(hosData.cycle.used / hosData.cycle.limit) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      {driver.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{driver.phone}</span>
                        </div>
                      )}
                      {driver.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <EnvelopeSimple className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{driver.email}</span>
                        </div>
                      )}
                      {driver.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{driver.address}</div>
                            <div>{driver.city}, {driver.state} {driver.zipCode}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver Details */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Driver Details</h4>
                    <div className="space-y-2 text-sm">
                      {driver.hireDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hire Date</span>
                          <span className="font-mono">{formatDate(driver.hireDate)}</span>
                        </div>
                      )}
                      {driver.homeTimePreference && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Home Time</span>
                          <span className="font-mono">{driver.homeTimePreference} days</span>
                        </div>
                      )}
                      {driver.safetyScore && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Safety Score</span>
                          <span className="font-mono">{parseFloat(driver.safetyScore).toFixed(0)}/100</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "loads" && (
                <motion.div
                  key="loads"
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="space-y-4"
                >
                  {driver.currentAssignments.length > 0 ? (
                    driver.currentAssignments.map((assignment) => (
                      <div key={assignment.assignment.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-mono font-medium text-sm">
                              {assignment.order.orderNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.customer.name}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {assignment.order.status}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">{assignment.order.commodity}</div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{assignment.order.miles} miles</span>
                            <span className="font-mono">{formatRevenue(assignment.order.totalRevenue)}</span>
                          </div>
                        </div>

                        {/* Stops */}
                        <div className="mt-3 space-y-2">
                          {assignment.stops
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((stop) => (
                              <div key={stop.id} className="flex items-center gap-3 text-xs">
                                <div className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full text-white",
                                  stop.isCompleted ? "bg-apollo-cyan-500" : stop.type === "pickup" ? "bg-blue-500" : "bg-orange-500"
                                )}>
                                  {stop.isCompleted ? <CheckCircle className="h-3 w-3" /> : stop.sequence}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize font-medium">{stop.type}</span>
                                    {stop.isCompleted && <CheckCircle className="h-3 w-3 text-apollo-cyan-500" />}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {stop.city}, {stop.state} • {formatDateTime(stop.scheduledDate)}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2 text-sm">No active loads</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "equipment" && (
                <motion.div
                  key="equipment"
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="space-y-6"
                >
                  {/* Tractor */}
                  {driver.currentTractor && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Assigned Tractor</h4>
                      <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-blue-500" />
                            <span className="font-mono font-medium">{driver.currentTractor.unitNumber}</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Make/Model</span>
                            <span>{driver.currentTractor.make} {driver.currentTractor.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Year</span>
                            <span className="font-mono">{driver.currentTractor.year ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Odometer</span>
                            <span className="font-mono">
                              {driver.currentTractor.currentOdometer !== undefined
                                ? `${driver.currentTractor.currentOdometer.toLocaleString()} mi`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trailer */}
                  {driver.currentTrailer && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Assigned Trailer</h4>
                      <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-orange-500" />
                            <span className="font-mono font-medium">{driver.currentTrailer.unitNumber}</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="capitalize">{driver.currentTrailer.trailerType.replace("_", " ")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Make/Model</span>
                            <span>
                              {[driver.currentTrailer.make, driver.currentTrailer.model]
                                .filter((item) => item && item.trim().length > 0)
                                .join(" ") || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!driver.currentTractor && !driver.currentTrailer && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2 text-sm">No equipment assigned</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "compliance" && (
                <motion.div
                  key="compliance"
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="space-y-6"
                >
                  {/* CDL Information */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">CDL Information</h4>
                    <div className="space-y-2 text-sm">
                      {driver.cdlNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CDL Number</span>
                          <span className="font-mono">{driver.cdlNumber}</span>
                        </div>
                      )}
                      {driver.cdlExpiration && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">CDL Expiration</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{formatDate(driver.cdlExpiration)}</span>
                            {(() => {
                              const days = getDaysUntilExpiration(driver.cdlExpiration);
                              const status = getExpirationStatus(days);
                              return (
                                <Badge className={cn("text-xs h-5", status.color, status.bgColor)}>
                                  {status.label}
                                </Badge>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {driver.medicalCertExpiration && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Medical Cert</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{formatDate(driver.medicalCertExpiration)}</span>
                            {(() => {
                              const days = getDaysUntilExpiration(driver.medicalCertExpiration);
                              const status = getExpirationStatus(days);
                              return (
                                <Badge className={cn("text-xs h-5", status.color, status.bgColor)}>
                                  {status.label}
                                </Badge>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Qualifications */}
                  {driver.qualifications && driver.qualifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Qualifications</h4>
                      <div className="space-y-2">
                        {driver.qualifications
                          .filter(qual => qual.isActive)
                          .map((qual) => {
                            const days = getDaysUntilExpiration(qual.expirationDate);
                            const status = getExpirationStatus(days);
                            return (
                              <div key={qual.id} className="flex items-center justify-between text-sm">
                                <span>{qual.qualificationType}</span>
                                <Badge className={cn("text-xs h-5", status.color, status.bgColor)}>
                                  {status.label}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {driver.certifications && driver.certifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Certifications</h4>
                      <div className="space-y-2">
                        {driver.certifications
                          .filter(cert => cert.isActive)
                          .map((cert) => {
                            const days = getDaysUntilExpiration(cert.expirationDate);
                            const status = getExpirationStatus(days);
                            return (
                              <div key={cert.id} className="flex items-center justify-between text-sm">
                                <span>{cert.certificationType}</span>
                                <Badge className={cn("text-xs h-5", status.color, status.bgColor)}>
                                  {status.label}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
