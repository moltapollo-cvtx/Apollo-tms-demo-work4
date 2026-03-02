"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  File,
  FileText,
  Image,
  FilePdf,
  Receipt,
  FileText as CertificateIcon,
  Shield,
  Truck,
  MagnifyingGlass,
  FunnelSimple,
  Download,
  Eye,
  Link as LinkIcon,
  List,
  GridFour,
  User,
} from "@phosphor-icons/react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DocumentRecord {
  id: string;
  fileName: string;
  documentType:
    | "bol"
    | "pod"
    | "rate_confirmation"
    | "invoice"
    | "driver_license"
    | "medical_cert"
    | "insurance"
    | "other";
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  associatedLoadId?: string;
  associatedDriverId?: string;
  associatedCustomerId?: string;
  description?: string;
  isPublic: boolean;
  status: "processing" | "ready" | "archived";
  previewUrl?: string;
}

const getDocumentIcon = (documentType: DocumentRecord["documentType"], mimeType: string) => {
  switch (documentType) {
    case "bol":
      return Receipt;
    case "pod":
      return CertificateIcon;
    case "rate_confirmation":
      return FileText;
    case "invoice":
      return Receipt;
    case "driver_license":
      return User;
    case "medical_cert":
    case "insurance":
      return Shield;
    default:
      if (mimeType.includes("pdf")) return FilePdf;
      if (mimeType.includes("image")) return Image;
      return File;
  }
};

const getDocumentTypeLabel = (type: DocumentRecord["documentType"]) => {
  switch (type) {
    case "bol":
      return "Bill of Lading";
    case "pod":
      return "Proof of Delivery";
    case "rate_confirmation":
      return "Rate Confirmation";
    case "invoice":
      return "Invoice";
    case "driver_license":
      return "Driver License";
    case "medical_cert":
      return "Medical Certificate";
    case "insurance":
      return "Insurance";
    case "other":
      return "Other";
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getStatusBadge = (status: DocumentRecord["status"]) => {
  switch (status) {
    case "processing":
      return { variant: "secondary", label: "Processing" };
    case "ready":
      return { variant: "default", label: "Ready" };
    case "archived":
      return { variant: "outline", label: "Archived" };
  }
};

interface DocumentLibraryProps {
  documents: DocumentRecord[];
  onPreviewDocument: (documentId: string) => void;
  onDownloadDocument: (documentId: string) => void;
  onSelectDocument?: (documentId: string) => void;
  selectedDocumentId?: string | null;
  className?: string;
}

export function DocumentLibrary({
  documents,
  onPreviewDocument,
  onDownloadDocument,
  onSelectDocument,
  selectedDocumentId,
  className,
}: DocumentLibraryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = [...documents];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (document) =>
          document.fileName.toLowerCase().includes(searchLower) ||
          document.description?.toLowerCase().includes(searchLower) ||
          document.uploadedBy.toLowerCase().includes(searchLower) ||
          getDocumentTypeLabel(document.documentType).toLowerCase().includes(searchLower),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((document) => document.documentType === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((document) => document.status === filterStatus);
    }

    filtered.sort((left, right) => {
      switch (sortBy) {
        case "date":
          return right.uploadedAt.getTime() - left.uploadedAt.getTime();
        case "name":
          return left.fileName.localeCompare(right.fileName);
        case "size":
          return right.fileSize - left.fileSize;
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, filterStatus, filterType, searchTerm, sortBy]);

  const columns = [
    {
      key: "fileName",
      title: "Document",
      render: (_value: unknown, row: DocumentRecord) => {
        const Icon = getDocumentIcon(row.documentType, row.mimeType);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
              <Icon className="h-4 w-4 text-apollo-cyan-600" weight="duotone" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate">{row.fileName}</div>
              <div className="text-xs text-muted-foreground">{getDocumentTypeLabel(row.documentType)}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "associations",
      title: "Associated",
      render: (_value: unknown, row: DocumentRecord) => {
        return (
          <div className="text-sm">
            {row.associatedLoadId && (
              <div className="flex items-center gap-1 text-blue-600">
                <Truck className="h-3 w-3" />
                <span className="font-mono">{row.associatedLoadId}</span>
              </div>
            )}
            {row.associatedDriverId && (
              <div className="flex items-center gap-1 text-green-600">
                <User className="h-3 w-3" />
                <span className="font-mono">{row.associatedDriverId}</span>
              </div>
            )}
            {!row.associatedLoadId && !row.associatedDriverId && (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: "fileSize",
      title: "Size",
      render: (_value: unknown, row: DocumentRecord) => {
        return <span className="font-mono text-sm">{formatFileSize(row.fileSize)}</span>;
      },
    },
    {
      key: "uploadedAt",
      title: "Uploaded",
      render: (_value: unknown, row: DocumentRecord) => {
        return (
          <div className="text-sm">
            <div className="font-mono">{row.uploadedAt.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">by {row.uploadedBy}</div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (_value: unknown, row: DocumentRecord) => {
        const status = getStatusBadge(row.status);
        return (
          <Badge variant={status.variant as "default" | "secondary" | "destructive" | "outline"}>
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (_value: unknown, row: DocumentRecord) => {
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSelectDocument?.(row.id);
                onPreviewDocument(row.id);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDownloadDocument(row.id)}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const renderGridView = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
      {filteredAndSortedDocuments.map((document, index) => {
        const Icon = getDocumentIcon(document.documentType, document.mimeType);
        const status = getStatusBadge(document.status);

        return (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              "group rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer",
              selectedDocumentId === document.id && "border-primary/40 bg-primary/5",
            )}
            onClick={() => {
              onSelectDocument?.(document.id);
              onPreviewDocument(document.id);
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
                  <Icon className="h-6 w-6 text-apollo-cyan-600" weight="duotone" />
                </div>
                <Badge variant={status.variant as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                  {status.label}
                </Badge>
              </div>

              <div>
                <h3 className="font-medium text-foreground truncate group-hover:text-apollo-cyan-600 transition-colors">
                  {document.fileName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{getDocumentTypeLabel(document.documentType)}</p>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Size:</span>
                  <span className="font-mono">{formatFileSize(document.fileSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uploaded:</span>
                  <span className="font-mono">{document.uploadedAt.toLocaleDateString()}</span>
                </div>
                {(document.associatedLoadId || document.associatedDriverId) && (
                  <div className="flex items-center gap-1 pt-1">
                    <LinkIcon className="h-3 w-3" />
                    <span>
                      {document.associatedLoadId && `Load: ${document.associatedLoadId}`}
                      {document.associatedDriverId && ` Driver: ${document.associatedDriverId}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDownloadDocument(document.id);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FunnelSimple className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as string)}
            options={[
              { value: "all", label: "All Types" },
              { value: "bol", label: "Bills of Lading" },
              { value: "pod", label: "Proofs of Delivery" },
              { value: "rate_confirmation", label: "Rate Confirmations" },
              { value: "invoice", label: "Invoices" },
              { value: "driver_license", label: "Driver Licenses" },
              { value: "medical_cert", label: "Medical Certificates" },
              { value: "insurance", label: "Insurance" },
              { value: "other", label: "Other" },
            ]}
          />

          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as string)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "ready", label: "Ready" },
              { value: "processing", label: "Processing" },
              { value: "archived", label: "Archived" },
            ]}
          />

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "date" | "name" | "size")}
            options={[
              { value: "date", label: "Date" },
              { value: "name", label: "Name" },
              { value: "size", label: "Size" },
            ]}
          />

          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-l-lg transition-colors",
                viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-r-lg transition-colors",
                viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GridFour className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredAndSortedDocuments.length} of {documents.length} documents
        </span>
        <span>
          Total size: {formatFileSize(filteredAndSortedDocuments.reduce((sum, doc) => sum + doc.fileSize, 0))}
        </span>
      </div>

      <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {viewMode === "grid" ? (
          renderGridView()
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <DataTable data={filteredAndSortedDocuments} columns={columns} searchable={false} />
          </div>
        )}
      </motion.div>

      {filteredAndSortedDocuments.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <File className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Upload some documents to get started"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
