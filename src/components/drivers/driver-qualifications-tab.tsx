"use client";

import {
  IdentificationBadge as Certificate,
  Warning,
  CheckCircle,
  Clock as ClockCounterClockwise,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { DriverWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface DriverQualificationsTabProps {
  driver: DriverWithDetails;
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const getExpirationStatus = (expirationDate: string | Date | null | undefined) => {
  if (!expirationDate) return { status: "unknown", color: "text-muted-foreground", days: 0 };

  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysDiff = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return { status: "expired", color: "text-red-600", days: daysDiff };
  } else if (daysDiff <= 30) {
    return { status: "warning", color: "text-amber-600", days: daysDiff };
  } else {
    return { status: "valid", color: "text-apollo-cyan-600", days: daysDiff };
  }
};

export default function DriverQualificationsTab({ driver }: DriverQualificationsTabProps) {
  const cdlExpiration = getExpirationStatus(driver.cdlExpiration);
  const medicalExpiration = getExpirationStatus(driver.medicalCertExpiration);

  // Combine qualifications and certifications for display
  const allQualifications = [
    ...(driver.qualifications || []).map(q => ({ ...q, type: "qualification" as const })),
    ...(driver.certifications || []).map(c => ({ ...c, type: "certification" as const })),
  ];

  const columns: Column[] = [
    {
      key: "type",
      title: "Type",
      width: 120,
      render: (value) => (
        <Badge className={cn(
          "border font-mono text-xs",
          value === "qualification"
            ? "bg-blue-100 text-blue-700 border-blue-200"
            : "bg-sky-100 text-sky-700 border-sky-200"
        )}>
          {value === "qualification" ? "Qualification" : "Certification"}
        </Badge>
      ),
    },
    {
      key: "name",
      title: "Name",
      render: (value, row) => {
        const name = row.qualificationType || row.certificationType || "Unknown";
        const number = row.certificateNumber || row.certificationNumber;

        return (
          <div>
            <div className="font-medium text-foreground">
              {name}
            </div>
            {number && (
              <div className="text-xs text-muted-foreground font-mono">
                {number}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "issuer",
      title: "Issued By",
      render: (value, row) => (
        <div className="text-sm text-foreground">
          {row.issuedBy || row.issuingAgency || "—"}
        </div>
      ),
    },
    {
      key: "issueDate",
      title: "Issue Date",
      width: 120,
      render: (value) => (
        <div className="font-mono text-sm text-muted-foreground">
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: "expirationDate",
      title: "Expiration",
      width: 140,
      render: (value) => {
        const status = getExpirationStatus(value);

        return (
          <div className="flex items-center gap-2">
            <div>
              <div className={cn("font-mono text-sm font-medium", status.color)}>
                {formatDate(value)}
              </div>
              {value && (
                <div className="text-xs text-muted-foreground">
                  {status.days >= 0 ? `${status.days} days left` : `${Math.abs(status.days)} days overdue`}
                </div>
              )}
            </div>
            {status.status === "expired" && <Warning className="h-4 w-4 text-red-600" />}
            {status.status === "warning" && <Warning className="h-4 w-4 text-amber-600" />}
            {status.status === "valid" && <CheckCircle className="h-4 w-4 text-apollo-cyan-600" />}
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      width: 100,
      render: (value, row) => {
        const isActive = row.isActive;
        const expStatus = getExpirationStatus(row.expirationDate);

        if (!isActive) {
          return (
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
              Inactive
            </Badge>
          );
        }

        if (expStatus.status === "expired") {
          return (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              Expired
            </Badge>
          );
        }

        if (expStatus.status === "warning") {
          return (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              Expiring
            </Badge>
          );
        }

        return (
          <Badge className="bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200">
            Valid
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* CDL & Medical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CDL Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <Certificate className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Commercial Driver&apos;s License</h3>
              <p className="text-sm text-muted-foreground">CDL Information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">License Number</span>
              <span className="font-mono font-medium text-foreground">
                {driver.cdlNumber || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">State</span>
              <span className="font-mono font-medium text-foreground">
                {driver.cdlState || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expiration</span>
              <div className="text-right">
                <span className={cn("font-mono font-medium", cdlExpiration.color)}>
                  {formatDate(driver.cdlExpiration)}
                </span>
                {driver.cdlExpiration && (
                  <p className="text-xs text-muted-foreground">
                    {cdlExpiration.days >= 0
                      ? `${cdlExpiration.days} days left`
                      : `${Math.abs(cdlExpiration.days)} days overdue`}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {cdlExpiration.status === "expired" && (
                    <>
                      <Warning className="h-4 w-4 text-red-600" />
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Expired
                      </Badge>
                    </>
                  )}
                  {cdlExpiration.status === "warning" && (
                    <>
                      <Warning className="h-4 w-4 text-amber-600" />
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        Expiring Soon
                      </Badge>
                    </>
                  )}
                  {cdlExpiration.status === "valid" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-apollo-cyan-600" />
                      <Badge className="bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200">
                        Valid
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Medical Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-apollo-cyan-100 p-2">
              <ClockCounterClockwise className="h-5 w-5 text-apollo-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Medical Certificate</h3>
              <p className="text-sm text-muted-foreground">DOT Physical</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expiration</span>
              <div className="text-right">
                <span className={cn("font-mono font-medium", medicalExpiration.color)}>
                  {formatDate(driver.medicalCertExpiration)}
                </span>
                {driver.medicalCertExpiration && (
                  <p className="text-xs text-muted-foreground">
                    {medicalExpiration.days >= 0
                      ? `${medicalExpiration.days} days left`
                      : `${Math.abs(medicalExpiration.days)} days overdue`}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {medicalExpiration.status === "expired" && (
                    <>
                      <Warning className="h-4 w-4 text-red-600" />
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Expired
                      </Badge>
                    </>
                  )}
                  {medicalExpiration.status === "warning" && (
                    <>
                      <Warning className="h-4 w-4 text-amber-600" />
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        Expiring Soon
                      </Badge>
                    </>
                  )}
                  {medicalExpiration.status === "valid" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-apollo-cyan-600" />
                      <Badge className="bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200">
                        Valid
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* All Qualifications & Certifications */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Certificate className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            All Qualifications & Certifications
          </h3>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {allQualifications.length} items
          </span>
        </div>

        <DataTable
          data={allQualifications}
          columns={columns}
          emptyMessage="No qualifications or certifications found."
          emptyState={{
            title: "No compliance records",
            description: "Add qualifications or certifications for this driver.",
          }}
        />
      </Card>
    </div>
  );
}
