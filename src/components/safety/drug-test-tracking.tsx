"use client";

import { useState, useMemo, type ComponentProps } from "react";
import { motion } from "framer-motion";
import {
  TestTube as FlaskConical,
  Calendar,
  CheckCircle,
  Warning,
  Clock,
  User,
  MagnifyingGlass,
  FunnelSimple,
} from "@phosphor-icons/react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;
interface BadgeState {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

interface DrugTestRecord {
  id: string;
  driverId: string;
  driverName: string;
  testType: "random" | "pre_employment" | "post_accident" | "reasonable_suspicion" | "return_to_duty" | "follow_up";
  scheduledDate: Date;
  completedDate?: Date;
  result?: "negative" | "positive" | "invalid" | "pending";
  testingFacility: string;
  status: "scheduled" | "completed" | "overdue" | "pending_result";
  urgency: "critical" | "warning" | "ok";
  daysUntilDue: number;
  collectorName?: string;
  notes?: string;
}

// Mock data - will be replaced with API calls
const mockDrugTestData: DrugTestRecord[] = [
  {
    id: "1",
    driverId: "DRV-MR247",
    driverName: "Marcus Rodriguez",
    testType: "random",
    scheduledDate: new Date(2026, 2, 5),
    status: "overdue",
    urgency: "critical",
    daysUntilDue: -3,
    testingFacility: "MedExpress Clinic",
  },
  {
    id: "2",
    driverId: "DRV-SC891",
    driverName: "Sarah Chen",
    testType: "random",
    scheduledDate: new Date(2026, 2, 12),
    status: "scheduled",
    urgency: "warning",
    daysUntilDue: 4,
    testingFacility: "LabCorp",
  },
  {
    id: "3",
    driverId: "D003",
    driverName: "David Thompson",
    testType: "post_accident",
    scheduledDate: new Date(2026, 1, 28),
    completedDate: new Date(2026, 2, 2),
    result: "negative",
    status: "completed",
    urgency: "ok",
    daysUntilDue: 0,
    testingFacility: "Quest Diagnostics",
    collectorName: "Dr. Johnson",
  },
  {
    id: "4",
    driverId: "D004",
    driverName: "Lisa Park",
    testType: "pre_employment",
    scheduledDate: new Date(2026, 2, 1),
    completedDate: new Date(2026, 2, 1),
    result: "pending",
    status: "pending_result",
    urgency: "warning",
    daysUntilDue: 0,
    testingFacility: "MedExpress Clinic",
    collectorName: "Nurse Smith",
  },
  {
    id: "5",
    driverId: "D005",
    driverName: "James Wilson",
    testType: "random",
    scheduledDate: new Date(2026, 3, 15),
    status: "scheduled",
    urgency: "ok",
    daysUntilDue: 35,
    testingFacility: "LabCorp",
  },
];

const formatTestType = (type: DrugTestRecord["testType"]) => {
  switch (type) {
    case "random":
      return "Random";
    case "pre_employment":
      return "Pre-Employment";
    case "post_accident":
      return "Post-Accident";
    case "reasonable_suspicion":
      return "Reasonable Suspicion";
    case "return_to_duty":
      return "Return to Duty";
    case "follow_up":
      return "Follow-up";
  }
};

const getStatusBadge = (status: DrugTestRecord["status"]): BadgeState => {
  switch (status) {
    case "scheduled":
      return { variant: "secondary" as const, label: "Scheduled", className: "" };
    case "completed":
      return { variant: "default" as const, label: "Completed", className: "" };
    case "overdue":
      return { variant: "destructive" as const, label: "Overdue", className: "" };
    case "pending_result":
      return {
        variant: "outline" as const,
        label: "Pending Result",
        className: "border-amber-300 bg-amber-50 text-amber-700",
      };
  }
};

const getResultBadge = (result?: DrugTestRecord["result"]): BadgeState | null => {
  if (!result) return null;

  switch (result) {
    case "negative": {
      return { variant: "default", label: "Negative", className: "" } as const;
    }
    case "positive": {
      return { variant: "destructive", label: "Positive", className: "" } as const;
    }
    case "invalid": {
      return {
        variant: "outline",
        label: "Invalid",
        className: "border-amber-300 bg-amber-50 text-amber-700",
      } as const;
    }
    case "pending": {
      return { variant: "secondary", label: "Pending", className: "" } as const;
    }
  }
};

const getUrgencyIcon = (urgency: DrugTestRecord["urgency"]) => {
  switch (urgency) {
    case "critical":
      return Warning;
    case "warning":
      return Clock;
    case "ok":
      return CheckCircle;
  }
};

interface DrugTestTrackingProps {
  className?: string;
}

export function DrugTestTracking({ className }: DrugTestTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredData = useMemo(() => {
    let filtered = mockDrugTestData;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.driverName.toLowerCase().includes(searchLower) ||
          test.driverId.toLowerCase().includes(searchLower) ||
          test.testingFacility.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((test) => test.status === filterStatus);
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((test) => test.testType === filterType);
    }

    // Sort by urgency and days until due
    filtered.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, ok: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.daysUntilDue - b.daysUntilDue;
    });

    return filtered;
  }, [searchTerm, filterStatus, filterType]);

  const summaryStats = useMemo(() => {
    const total = mockDrugTestData.length;
    const overdue = mockDrugTestData.filter(test => test.status === "overdue").length;
    const dueSoon = mockDrugTestData.filter(test =>
      test.status === "scheduled" && test.daysUntilDue <= 7
    ).length;
    const pendingResults = mockDrugTestData.filter(test => test.status === "pending_result").length;

    return { total, overdue, dueSoon, pendingResults };
  }, []);

  const columns: Column<DrugTestRecord>[] = [
    {
      key: "driverName",
      title: "Driver",
      sortable: true,
      filterable: true,
      render: (_, test) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
              <User className="h-4 w-4 text-apollo-cyan-600" weight="duotone" />
            </div>
            <div>
              <div className="font-medium text-foreground">{test.driverName}</div>
              <div className="text-xs text-muted-foreground font-mono">{test.driverId}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "testType",
      title: "Test Type",
      sortable: true,
      filterable: true,
      render: (_, test) => {
        return (
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="font-medium">{formatTestType(test.testType)}</span>
          </div>
        );
      },
    },
    {
      key: "scheduledDate",
      title: "Scheduled Date",
      sortable: true,
      render: (_, test) => {
        const UrgencyIcon = getUrgencyIcon(test.urgency);
        return (
          <div className="flex items-center gap-2">
            <UrgencyIcon
              className={`h-4 w-4 ${
                test.urgency === "critical"
                  ? "text-red-600"
                  : test.urgency === "warning"
                  ? "text-amber-500"
                  : "text-apollo-cyan-600"
              }`}
              weight="duotone"
            />
            <div>
              <div className="font-mono text-sm">
                {test.scheduledDate.toLocaleDateString()}
              </div>
              {test.status !== "completed" && (
                <div className="text-xs text-muted-foreground">
                  {test.daysUntilDue > 0
                    ? `${test.daysUntilDue} days remaining`
                    : test.daysUntilDue < 0
                    ? `${Math.abs(test.daysUntilDue)} days overdue`
                    : "Due today"
                  }
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      render: (_, test) => {
        const statusInfo = getStatusBadge(test.status);
        return (
          <Badge
            variant={statusInfo.variant}
            className={cn("font-medium", statusInfo.className)}
          >
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: "result",
      title: "Result",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => row.result || "none",
      render: (_, test) => {
        const resultInfo = getResultBadge(test.result);

        if (!resultInfo) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <Badge variant={resultInfo.variant} className={cn("font-medium", resultInfo.className)}>
            {resultInfo.label}
          </Badge>
        );
      },
    },
    {
      key: "testingFacility",
      title: "Testing Facility",
      sortable: true,
      filterable: true,
      render: (_, test) => {
        return (
          <div>
            <div className="text-sm text-foreground">{test.testingFacility}</div>
            {test.collectorName && (
              <div className="text-xs text-muted-foreground">
                Collector: {test.collectorName}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Overdue Tests</p>
            <Warning className="h-4 w-4 text-red-600" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {summaryStats.overdue}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Due Soon (7 days)</p>
            <Clock className="h-4 w-4 text-amber-500" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {summaryStats.dueSoon}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Pending Results</p>
            <FlaskConical className="h-4 w-4 text-blue-600" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {summaryStats.pendingResults}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
            <Calendar className="h-4 w-4 text-apollo-cyan-600" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {summaryStats.total}
          </p>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drivers, facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FunnelSimple className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as string)}
            options={[
              { value: "all", label: "All Status" },
              { value: "scheduled", label: "Scheduled" },
              { value: "overdue", label: "Overdue" },
              { value: "completed", label: "Completed" },
              { value: "pending_result", label: "Pending Result" },
            ]}
          />
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as string)}
            options={[
              { value: "all", label: "All Types" },
              { value: "random", label: "Random" },
              { value: "pre_employment", label: "Pre-Employment" },
              { value: "post_accident", label: "Post-Accident" },
              { value: "reasonable_suspicion", label: "Reasonable Suspicion" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-xl border border-border bg-card"
      >
        <DataTable
          data={filteredData}
          columns={columns}
          searchable={false} // We handle search externally
          emptyState={{
            title: "No drug tests found",
            description: "Try adjusting your search or filters.",
          }}
        />
      </motion.div>
    </div>
  );
}
