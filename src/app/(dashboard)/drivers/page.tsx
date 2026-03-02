"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UsersThree as Users,
  Plus,
  CheckCircle as UserCheck,
  XCircle as UserX,
  Clock,
  MagnifyingGlass as Search,
  FunnelSimple as Filter,
  MapPin,
  Phone,
  Car,
  UserCircle,
  X,
  CheckCircle,
} from "@phosphor-icons/react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { useDrivers } from "@/lib/hooks/api/use-drivers";
import type { DriverWithDetails, DriverStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "All Drivers" },
  { value: "available", label: "Available" },
  { value: "on_load", label: "On Load" },
  { value: "off_duty", label: "Off Duty" },
  { value: "driving", label: "Driving" },
  { value: "sleeper", label: "Sleeper" },
  { value: "on_break", label: "On Break" },
];

const getStatusBadge = (status: DriverStatus) => {
  const statusConfig = {
    available: { color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200", label: "Available" },
    on_load: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "On Load" },
    off_duty: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Off Duty" },
    sleeper: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Sleeper" },
    driving: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Driving" },
    on_break: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "On Break" },
  };

  const config = statusConfig[status] || statusConfig.available;
  return (
    <Badge className={cn("border font-mono text-xs", config.color)}>
      {config.label}
    </Badge>
  );
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

// Mock HOS data - in real app this would come from ELD integration
const getMockHOSData = (driverId: number) => {
  const variations = [
    { drive: 8.5, remaining: 2.5, total: 11 },
    { drive: 6.2, remaining: 4.8, total: 11 },
    { drive: 10.1, remaining: 0.9, total: 11 },
    { drive: 3.4, remaining: 7.6, total: 11 },
    { drive: 9.8, remaining: 1.2, total: 11 },
  ];
  return variations[driverId % variations.length];
};

const HosGauge = ({ driverId }: { driverId: number }) => {
  const hos = getMockHOSData(driverId);
  const percentage = (hos.drive / hos.total) * 100;
  const isLowTime = hos.remaining < 2;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={isLowTime ? "text-red-500" : "text-apollo-cyan-500"}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-semibold">
            {hos.remaining.toFixed(1)}h
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Drive time remaining</p>
        <p className={cn("text-xs font-mono", isLowTime ? "text-red-600" : "text-foreground")}>
          {hos.drive.toFixed(1)} / {hos.total}h
        </p>
      </div>
    </div>
  );
};

export default function DriversPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDriverForm, setShowAddDriverForm] = useState(false);
  const [driverToast, setDriverToast] = useState<string | null>(null);
  const [newDriver, setNewDriver] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cdlState: "",
    homeTerminal: "",
  });

  const handleAddDriver = () => {
    const empId = `DRV-${(1000 + Math.floor(Math.random() * 9000)).toString()}`;
    setShowAddDriverForm(false);
    setDriverToast(`${newDriver.firstName} ${newDriver.lastName} (${empId})`);
    setNewDriver({ firstName: "", lastName: "", email: "", phone: "", cdlState: "", homeTerminal: "" });
    setTimeout(() => setDriverToast(null), 4000);
  };

  // Prepare filters for API
  const filters = {
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : [statusFilter as DriverStatus],
    page: currentPage,
    pageSize,
    include: ["qualifications", "certifications", "currentAssignment"],
  };

  const { data, isLoading, error } = useDrivers(filters);

  // Calculate status counts
  const statusCounts = {
    available: data?.data?.filter(d => d.status === "available").length || 0,
    on_load: data?.data?.filter(d => d.status === "on_load").length || 0,
    off_duty: data?.data?.filter(d => d.status === "off_duty").length || 0,
    total: data?.pagination?.total || 0,
  };

  const columns: Column<DriverWithDetails>[] = [
    {
      key: "driver",
      title: "Driver",
      sortable: true,
      width: 200,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <div className="bg-slate-100 h-8 w-8 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-slate-600">
                {row.firstName[0]}{row.lastName[0]}
              </span>
            </div>
          </Avatar>
          <button
            type="button"
            className="text-left rounded-md px-1 py-0.5 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/drivers/${row.id}`);
            }}
          >
            <div className="font-medium text-foreground">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {row.employeeId}
            </div>
          </button>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      width: 120,
      render: (value) => getStatusBadge(value as DriverStatus),
    },
    {
      key: "location",
      title: "Location",
      render: (value, row) => (
        <div className="min-w-0">
          {row.currentLocation ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">
                {row.city}, {row.state}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Unknown</span>
          )}
        </div>
      ),
    },
    {
      key: "assignment",
      title: "Current Assignment",
      render: (value, row) => {
        const assignment = row.currentAssignment;
        if (!assignment || !assignment.order) {
          return <span className="text-sm text-muted-foreground">Unassigned</span>;
        }

        return (
          <div className="min-w-0">
            <div className="font-mono text-sm font-medium text-foreground">
              {assignment.order.orderNumber}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {assignment.tractor?.unitNumber && (
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {assignment.tractor.unitNumber}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "hos",
      title: "HOS",
      width: 140,
      render: (value, row) => <HosGauge driverId={row.id} />,
    },
    {
      key: "qualifications",
      title: "CDL",
      width: 120,
      render: (value, row) => (
        <div>
          <div className="text-sm font-mono text-foreground">
            {row.cdlState && (
              <span className="font-semibold">{row.cdlState}</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.cdlExpiration && (
              <span className={cn(
                "font-mono",
                new Date(row.cdlExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  ? "text-red-600"
                  : "text-muted-foreground"
              )}>
                Exp: {formatDate(row.cdlExpiration)}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      render: (value, row) => (
        <div>
          {row.phone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="text-xs text-muted-foreground truncate">
              {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "performance",
      title: "Safety Score",
      align: "right",
      width: 100,
      render: (value, row) => {
        const score = row.safetyScore ? Number(row.safetyScore) : 85; // Mock score
        const isGoodScore = score >= 90;
        const isWarningScore = score >= 75 && score < 90;

        return (
          <div className="text-right">
            <div className={cn(
              "font-mono font-semibold",
              isGoodScore ? "text-apollo-cyan-600" : isWarningScore ? "text-amber-600" : "text-red-600"
            )}>
              {score.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Safety
            </div>
          </div>
        );
      },
    },
    {
      key: "hireDate",
      title: "Hire Date",
      sortable: true,
      width: 100,
      render: (value) => (
        <div className="font-mono text-sm text-muted-foreground">
          {formatDate(value as string | Date | null | undefined)}
        </div>
      ),
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (status: string | string[]) => {
    const statusValue = Array.isArray(status) ? status[0] : status;
    setStatusFilter(statusValue);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRowClick = (driver: DriverWithDetails) => {
    router.push(`/drivers/${driver.id}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Drivers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Driver profiles, qualifications, HOS status, settlements, and performance tracking.
          </p>
        </div>
        <Button
          onClick={() => setShowAddDriverForm(true)}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {driverToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 top-20 z-50 w-[340px] rounded-2xl border border-primary/20 bg-card p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-apollo-lime-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">Driver Added</p>
                <p className="text-xs text-muted-foreground">{driverToast} has been added to the roster.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Driver Modal */}
      <AnimatePresence>
        {showAddDriverForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowAddDriverForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Add New Driver</h2>
                <button onClick={() => setShowAddDriverForm(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                    <input type="text" value={newDriver.firstName} onChange={(e) => setNewDriver(p => ({ ...p, firstName: e.target.value }))} placeholder="John" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                    <input type="text" value={newDriver.lastName} onChange={(e) => setNewDriver(p => ({ ...p, lastName: e.target.value }))} placeholder="Smith" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input type="email" value={newDriver.email} onChange={(e) => setNewDriver(p => ({ ...p, email: e.target.value }))} placeholder="john.smith@apollo.com" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                    <input type="tel" value={newDriver.phone} onChange={(e) => setNewDriver(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">CDL State</label>
                    <input type="text" value={newDriver.cdlState} onChange={(e) => setNewDriver(p => ({ ...p, cdlState: e.target.value }))} placeholder="TX" maxLength={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Home Terminal</label>
                  <input type="text" value={newDriver.homeTerminal} onChange={(e) => setNewDriver(p => ({ ...p, homeTerminal: e.target.value }))} placeholder="Dallas, TX" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setShowAddDriverForm(false)}>Cancel</Button>
                  <Button onClick={handleAddDriver} disabled={!newDriver.firstName || !newDriver.lastName}>Add Driver</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Available", count: statusCounts.available, icon: UserCheck, color: "text-apollo-cyan-600" },
          { label: "On Load", count: statusCounts.on_load, icon: Clock, color: "text-blue-600" },
          { label: "Off Duty", count: statusCounts.off_duty, icon: UserX, color: "text-slate-600" },
          { label: "Total", count: statusCounts.total, icon: Users, color: "text-slate-600" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <div>
              <p className="font-mono text-xl font-semibold text-foreground">
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced filters bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, employee ID, CDL number, email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 w-full rounded-lg bg-muted/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status:</span>
          </div>
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilter}
            options={statusOptions}
            placeholder="All Drivers"
            size="sm"
          />
        </div>

        <div className="text-sm text-muted-foreground font-mono">
          {statusCounts.total.toLocaleString()} drivers
        </div>
      </div>

      {/* Drivers table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            All Drivers
          </h2>
        </div>

        <DataTable
          data={data?.data || []}
          columns={columns}
          loading={isLoading}
          error={error?.message || null}
          emptyState={{
            icon: <UserCircle className="h-full w-full" />,
            title: "No drivers found",
            description: "Build your driver roster by adding qualified CDL drivers to your fleet.",
            action: {
              label: "Add Driver",
              onClick: () => setShowAddDriverForm(true),
              variant: "primary"
            }
          }}
          searchable={false} // We handle search externally
          sortable={true}
          pagination={
            data?.pagination
              ? {
                  page: data.pagination.page,
                  pageSize: data.pagination.pageSize,
                  total: data.pagination.total,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: setPageSize,
                  pageSizeOptions: [10, 25, 50, 100],
                }
              : undefined
          }
          onRowClick={handleRowClick}
          rowClassName={(driver) => {
            const hos = getMockHOSData(driver.id);
            return hos.remaining < 1
              ? "bg-red-50/50 hover:bg-red-50 border-red-100"
              : hos.remaining < 2
              ? "bg-amber-50/50 hover:bg-amber-50"
              : "";
          }}
        />
      </div>
    </div>
  );
}
