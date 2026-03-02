"use client";

import { ShieldCheck, Warning, CheckCircle, Calendar, Gauge } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { DriverWithDetails } from "@/types";

interface DriverSafetyTabProps {
  driver: DriverWithDetails;
}

interface ComplianceRow {
  id: string;
  item: string;
  expiresOn: string | Date | null | undefined;
  category: "license" | "medical" | "qualification" | "certification";
}

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getDaysRemaining = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const today = new Date();
  const expiration = new Date(value);
  return Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getStatusBadge = (daysRemaining: number | null) => {
  if (daysRemaining === null) {
    return <Badge className="border-slate-200 bg-slate-100 text-slate-700">No Date</Badge>;
  }

  if (daysRemaining < 0) {
    return <Badge className="border-red-200 bg-red-100 text-red-700">Expired</Badge>;
  }

  if (daysRemaining <= 30) {
    return <Badge className="border-amber-200 bg-amber-100 text-amber-700">Expiring Soon</Badge>;
  }

  return <Badge className="border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700">Compliant</Badge>;
};

export default function DriverSafetyTab({ driver }: DriverSafetyTabProps) {
  const safetyScore = Number(driver.safetyScore || 87.5);

  const complianceRows: ComplianceRow[] = [
    {
      id: "cdl",
      item: "CDL License",
      expiresOn: driver.cdlExpiration,
      category: "license",
    },
    {
      id: "medical",
      item: "Medical Certificate",
      expiresOn: driver.medicalCertExpiration,
      category: "medical",
    },
    ...(driver.qualifications || []).map((qualification) => ({
      id: `qualification-${qualification.id}`,
      item: qualification.qualificationType,
      expiresOn: qualification.expirationDate,
      category: "qualification" as const,
    })),
    ...(driver.certifications || []).map((certification) => ({
      id: `certification-${certification.id}`,
      item: certification.certificationType,
      expiresOn: certification.expirationDate,
      category: "certification" as const,
    })),
  ];

  const expiredCount = complianceRows.filter((item) => (getDaysRemaining(item.expiresOn) || 0) < 0).length;
  const expiringSoonCount = complianceRows.filter((item) => {
    const days = getDaysRemaining(item.expiresOn);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const columns: Column<ComplianceRow>[] = [
    {
      key: "item",
      title: "Compliance Item",
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-foreground">{String(value)}</p>
          <p className="text-xs text-muted-foreground">
            {row.category.replace(/\b\w/g, (char) => char.toUpperCase())}
          </p>
        </div>
      ),
    },
    {
      key: "expiresOn",
      title: "Expiration",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{formatDate(value as string | Date | null)}</span>,
    },
    {
      key: "daysRemaining",
      title: "Days Remaining",
      sortable: true,
      align: "right",
      render: (_value, row) => {
        const days = getDaysRemaining(row.expiresOn);

        if (days === null) {
          return <span className="font-mono text-muted-foreground">—</span>;
        }

        return (
          <span className={`font-mono ${days < 0 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-foreground"}`}>
            {days < 0 ? `${Math.abs(days)} overdue` : `${days} days`}
          </span>
        );
      },
      getFilterValue: (row) => String(getDaysRemaining(row.expiresOn) ?? ""),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => {
        const days = getDaysRemaining(row.expiresOn);
        if (days === null) return "No Date";
        if (days < 0) return "Expired";
        if (days <= 30) return "Expiring Soon";
        return "Compliant";
      },
      render: (_value, row) => getStatusBadge(getDaysRemaining(row.expiresOn)),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Safety Score</p>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{safetyScore.toFixed(1)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Expired Items</p>
            <Warning className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{expiredCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Expiring in 30 Days</p>
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{expiringSoonCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Compliance Items</p>
            <ShieldCheck className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{complianceRows.length}</p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={complianceRows}
          columns={columns}
          searchPlaceholder="Search compliance items..."
          emptyState={{
            icon: <CheckCircle className="h-full w-full" />,
            title: "No safety records",
            description: "Compliance checkpoints for this driver will appear once records are loaded.",
          }}
          defaultPageSize={6}
          defaultPageSizeOptions={[6, 12, 24]}
        />
      </Card>
    </div>
  );
}
