"use client";

import { useState, useMemo, type ComponentProps } from "react";
import { motion } from "framer-motion";
import {
  Warning,
  Check,
  Clock,
  MagnifyingGlass,
  FunnelSimple,
  User,
  FileText as Certificate,
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

interface CertificationRecord {
  id: string;
  driverName: string;
  driverId: string;
  certificationType: "cdl" | "medical" | "hazmat" | "endorsement" | "drug_test" | "safety_training";
  certificationNumber?: string;
  issueDate: Date;
  expirationDate: Date;
  issuingAgency: string;
  status: "active" | "expired" | "expiring_soon" | "pending_renewal";
  urgency: "critical" | "warning" | "ok";
  daysUntilExpiration: number;
}

// Mock data - will be replaced with API calls
const mockCertificationData: CertificationRecord[] = [
  {
    id: "1",
    driverName: "Marcus Rodriguez",
    driverId: "D001",
    certificationType: "cdl",
    certificationNumber: "CDL123456789",
    issueDate: new Date(2022, 2, 15),
    expirationDate: new Date(2026, 2, 15),
    issuingAgency: "Texas DMV",
    status: "expiring_soon",
    urgency: "warning",
    daysUntilExpiration: 15,
  },
  {
    id: "2",
    driverName: "Sarah Chen",
    driverId: "D002",
    certificationType: "medical",
    certificationNumber: "MED987654321",
    issueDate: new Date(2024, 2, 8),
    expirationDate: new Date(2026, 2, 8),
    issuingAgency: "DOT Certified Examiner",
    status: "expiring_soon",
    urgency: "critical",
    daysUntilExpiration: 8,
  },
  {
    id: "3",
    driverName: "David Thompson",
    driverId: "D003",
    certificationType: "hazmat",
    certificationNumber: "HMT456789123",
    issueDate: new Date(2023, 5, 10),
    expirationDate: new Date(2026, 2, 22),
    issuingAgency: "TSA",
    status: "expiring_soon",
    urgency: "warning",
    daysUntilExpiration: 22,
  },
  {
    id: "4",
    driverName: "Lisa Park",
    driverId: "D004",
    certificationType: "drug_test",
    issueDate: new Date(2025, 11, 5),
    expirationDate: new Date(2026, 2, 5),
    issuingAgency: "MedExpress",
    status: "expiring_soon",
    urgency: "critical",
    daysUntilExpiration: 5,
  },
  {
    id: "5",
    driverName: "James Wilson",
    driverId: "D005",
    certificationType: "cdl",
    certificationNumber: "CDL789123456",
    issueDate: new Date(2021, 8, 20),
    expirationDate: new Date(2027, 8, 20),
    issuingAgency: "California DMV",
    status: "active",
    urgency: "ok",
    daysUntilExpiration: 540,
  },
];

const formatCertificationType = (type: CertificationRecord["certificationType"]) => {
  switch (type) {
    case "cdl":
      return "CDL License";
    case "medical":
      return "DOT Medical";
    case "hazmat":
      return "HAZMAT Endorsement";
    case "endorsement":
      return "Endorsement";
    case "drug_test":
      return "Drug Test";
    case "safety_training":
      return "Safety Training";
  }
};

const getUrgencyIcon = (urgency: CertificationRecord["urgency"]) => {
  switch (urgency) {
    case "critical":
      return Warning;
    case "warning":
      return Clock;
    case "ok":
      return Check;
  }
};

const getStatusBadge = (status: CertificationRecord["status"]): BadgeState => {
  switch (status) {
    case "active":
      return { variant: "default" as const, label: "Active", className: "" };
    case "expired":
      return { variant: "destructive" as const, label: "Expired", className: "" };
    case "expiring_soon":
      return {
        variant: "outline" as const,
        label: "Expiring Soon",
        className: "border-amber-300 bg-amber-50 text-amber-700",
      };
    case "pending_renewal":
      return { variant: "secondary" as const, label: "Pending Renewal", className: "" };
  }
};

interface CertificationTrackingTableProps {
  className?: string;
}

export function CertificationTrackingTable({ className }: CertificationTrackingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");

  const filteredData = useMemo(() => {
    let filtered = mockCertificationData;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cert) =>
          cert.driverName.toLowerCase().includes(searchLower) ||
          cert.driverId.toLowerCase().includes(searchLower) ||
          cert.certificationNumber?.toLowerCase().includes(searchLower) ||
          formatCertificationType(cert.certificationType).toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((cert) => cert.certificationType === filterType);
    }

    // Urgency filter
    if (filterUrgency !== "all") {
      filtered = filtered.filter((cert) => cert.urgency === filterUrgency);
    }

    // Sort by urgency and days until expiration
    filtered.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, ok: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.daysUntilExpiration - b.daysUntilExpiration;
    });

    return filtered;
  }, [searchTerm, filterType, filterUrgency]);

  const columns: Column<CertificationRecord>[] = [
    {
      key: "driverName",
      title: "Driver",
      sortable: true,
      filterable: true,
      render: (_, cert) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
              <User className="h-4 w-4 text-apollo-cyan-600" weight="duotone" />
            </div>
            <div>
              <div className="font-medium text-foreground">{cert.driverName}</div>
              <div className="text-xs text-muted-foreground font-mono">{cert.driverId}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "certificationType",
      title: "Certification",
      sortable: true,
      filterable: true,
      render: (_, cert) => {
        return (
          <div className="flex items-center gap-2">
            <Certificate className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <div>
              <div className="font-medium">{formatCertificationType(cert.certificationType)}</div>
              {cert.certificationNumber && (
                <div className="text-xs text-muted-foreground font-mono">
                  {cert.certificationNumber}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "expirationDate",
      title: "Expiration Date",
      sortable: true,
      render: (_, cert) => {
        const UrgencyIcon = getUrgencyIcon(cert.urgency);
        return (
          <div className="flex items-center gap-2">
            <UrgencyIcon
              className={`h-4 w-4 ${
                cert.urgency === "critical"
                  ? "text-red-600"
                  : cert.urgency === "warning"
                  ? "text-amber-500"
                  : "text-apollo-cyan-600"
              }`}
              weight="duotone"
            />
            <div>
              <div className="font-mono text-sm">
                {cert.expirationDate.toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {cert.daysUntilExpiration > 0
                  ? `${cert.daysUntilExpiration} days remaining`
                  : `${Math.abs(cert.daysUntilExpiration)} days overdue`
                }
              </div>
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
      render: (_, cert) => {
        const statusInfo = getStatusBadge(cert.status);
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
      key: "issuingAgency",
      title: "Issuing Agency",
      sortable: true,
      filterable: true,
      render: (_, cert) => {
        return (
          <div className="text-sm text-muted-foreground">
            {cert.issuingAgency}
          </div>
        );
      },
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drivers, certifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FunnelSimple className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as string)}
            options={[
              { value: "all", label: "All Types" },
              { value: "cdl", label: "CDL License" },
              { value: "medical", label: "DOT Medical" },
              { value: "hazmat", label: "HAZMAT" },
              { value: "drug_test", label: "Drug Test" },
              { value: "safety_training", label: "Safety Training" },
            ]}
          />
          <Select
            value={filterUrgency}
            onValueChange={(value) => setFilterUrgency(value as string)}
            options={[
              { value: "all", label: "All Urgency" },
              { value: "critical", label: "Critical" },
              { value: "warning", label: "Warning" },
              { value: "ok", label: "Good" },
            ]}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Critical (≤7 days)</p>
            <Warning className="h-4 w-4 text-red-600" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {filteredData.filter(cert => cert.urgency === "critical").length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Warning (≤30 days)</p>
            <Clock className="h-4 w-4 text-amber-500" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {filteredData.filter(cert => cert.urgency === "warning").length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Good (&gt;30 days)</p>
            <Check className="h-4 w-4 text-apollo-cyan-600" weight="duotone" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {filteredData.filter(cert => cert.urgency === "ok").length}
          </p>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl border border-border bg-card"
      >
        <DataTable
          data={filteredData}
          columns={columns}
          searchable={false} // We handle search externally
          emptyState={{
            title: "No certifications found",
            description: "Try adjusting your search or filter settings.",
          }}
        />
      </motion.div>
    </div>
  );
}
