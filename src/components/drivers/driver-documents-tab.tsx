"use client";

import { FileText, Eye, Lock, DownloadSimple } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { Document, DriverWithDetails } from "@/types";

interface DriverDocumentsTabProps {
  driver: DriverWithDetails;
}

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatFileSize = (bytes: number | null | undefined) => {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const toLabel = (value: string | null | undefined) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Other";

export default function DriverDocumentsTab({ driver }: DriverDocumentsTabProps) {
  const documents = (driver.documents || []) as Document[];
  const publicCount = documents.filter((doc) => doc.isPublic).length;

  const columns: Column<Document>[] = [
    {
      key: "fileName",
      title: "Document",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-foreground">{String(value || "Untitled document")}</p>
          <p className="text-xs text-muted-foreground">{row.mimeType || "Unknown type"}</p>
        </div>
      ),
    },
    {
      key: "documentType",
      title: "Type",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => toLabel(row.documentType),
      render: (value) => (
        <Badge className="border-sky-200 bg-sky-100 text-sky-700">{toLabel(value as string)}</Badge>
      ),
    },
    {
      key: "fileSize",
      title: "Size",
      sortable: true,
      align: "right",
      render: (value) => <span className="font-mono">{formatFileSize(value as number | null)}</span>,
    },
    {
      key: "createdAt",
      title: "Uploaded",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{formatDate(value as string | Date | null)}</span>,
    },
    {
      key: "isPublic",
      title: "Visibility",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => (row.isPublic ? "Public" : "Internal"),
      render: (value) =>
        value ? (
          <Badge className="border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700">Public</Badge>
        ) : (
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Internal</Badge>
        ),
    },
    {
      key: "id",
      title: "Actions",
      align: "right",
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <DownloadSimple className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Documents</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{documents.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Public Files</p>
            <Eye className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{publicCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Internal Files</p>
            <Lock className="h-4 w-4 text-slate-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {Math.max(documents.length - publicCount, 0)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={documents}
          columns={columns}
          searchPlaceholder="Search document names or types..."
          emptyState={{
            icon: <FileText className="h-full w-full" />,
            title: "No driver documents",
            description: "Upload CDL, medical cards, and supporting files for compliance.",
          }}
          defaultPageSize={6}
          defaultPageSizeOptions={[6, 12, 24]}
        />
      </Card>
    </div>
  );
}
