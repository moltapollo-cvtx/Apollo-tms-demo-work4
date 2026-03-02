"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  MagnifyingGlass as Search,
  Folder as FolderOpen,
  Eye,
  File,
  Link,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SimpleTabs as Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadZone, type UploadFile } from "@/components/documents/document-upload-zone";
import { DocumentLibrary, type DocumentRecord } from "@/components/documents/document-library";
import { EPODDisplay } from "@/components/documents/epod-display";

const initialDocuments: DocumentRecord[] = [
  {
    id: "doc-1",
    fileName: "BOL-2026-001234.pdf",
    documentType: "bol",
    fileSize: 2456789,
    mimeType: "application/pdf",
    uploadedAt: new Date(2026, 1, 24, 10, 30),
    uploadedBy: "Sarah Chen",
    associatedLoadId: "LD-001234",
    description: "Bill of Lading for Houston to Dallas shipment",
    isPublic: false,
    status: "ready",
  },
  {
    id: "doc-2",
    fileName: "POD-2026-001234.pdf",
    documentType: "pod",
    fileSize: 1789456,
    mimeType: "application/pdf",
    uploadedAt: new Date(2026, 1, 25, 14, 15),
    uploadedBy: "Marcus Rodriguez",
    associatedLoadId: "LD-001234",
    description: "Proof of delivery with signed receiver confirmation",
    isPublic: false,
    status: "ready",
  },
  {
    id: "doc-3",
    fileName: "Rate_Confirmation_CrossBridge_Logistics.pdf",
    documentType: "rate_confirmation",
    fileSize: 345678,
    mimeType: "application/pdf",
    uploadedAt: new Date(2026, 1, 26, 9, 45),
    uploadedBy: "David Thompson",
    associatedCustomerId: "C-001",
    description: "Rate confirmation for Q2 2026",
    isPublic: true,
    status: "processing",
  },
  {
    id: "doc-4",
    fileName: "CDL_Marcus_Rodriguez.jpg",
    documentType: "driver_license",
    fileSize: 2789123,
    mimeType: "image/jpeg",
    uploadedAt: new Date(2026, 1, 20, 11, 20),
    uploadedBy: "HR Department",
    associatedDriverId: "DRV-MR247",
    description: "Updated CDL scan",
    isPublic: false,
    status: "ready",
    previewUrl: "/file.svg",
  },
  {
    id: "doc-5",
    fileName: "Medical_Certificate_Sarah_Chen.pdf",
    documentType: "medical_cert",
    fileSize: 1234567,
    mimeType: "application/pdf",
    uploadedAt: new Date(2026, 1, 19, 16, 10),
    uploadedBy: "Safety Department",
    associatedDriverId: "DRV-SC113",
    description: "DOT Medical Certificate renewal",
    isPublic: false,
    status: "archived",
  },
];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function DocumentsPage() {
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(initialDocuments[0]?.id ?? null);

  const createdPreviewUrls = useRef<string[]>([]);

  useEffect(() => {
    const previewUrls = createdPreviewUrls.current;
    return () => {
      previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const stats = useMemo(() => {
    const pending = documents.filter((document) => document.status === "processing").length;
    const unmatched = documents.filter(
      (document) => !document.associatedLoadId && !document.associatedDriverId && !document.associatedCustomerId,
    ).length;

    return {
      total: documents.length,
      pending,
      unmatched,
    };
  }, [documents]);

  const handleFilesUploaded = (files: UploadFile[]) => {
    const newDocuments = files.map((uploadFile, index) => {
      const previewUrl = URL.createObjectURL(uploadFile.file);
      createdPreviewUrls.current.push(previewUrl);

      const generatedId = `doc-upload-${Date.now()}-${index}`;

      return {
        id: generatedId,
        fileName: uploadFile.file.name,
        documentType: uploadFile.type ?? "other",
        fileSize: uploadFile.file.size,
        mimeType: uploadFile.file.type || "application/octet-stream",
        uploadedAt: new Date(),
        uploadedBy: "Operations Coordinator",
        associatedLoadId: uploadFile.associatedLoadId,
        associatedDriverId: uploadFile.associatedDriverId,
        description: uploadFile.description,
        isPublic: false,
        status: "ready" as const,
        previewUrl,
      };
    });

    setDocuments((prev) => [...newDocuments, ...prev]);
    if (newDocuments[0]) {
      setSelectedDocumentId(newDocuments[0].id);
    }
    setShowUploadZone(false);
  };

  const handlePreviewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const handleDownloadDocument = (documentId: string) => {
    const document = documents.find((entry) => entry.id === documentId);
    if (!document) return;

    if (document.previewUrl) {
      const link = window.document.createElement("a");
      link.href = document.previewUrl;
      link.download = document.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      return;
    }

    const fallbackBlob = new Blob([
      `Document: ${document.fileName}\nType: ${document.documentType}\nDescription: ${document.description ?? "N/A"}`,
    ]);
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    const link = window.document.createElement("a");
    link.href = fallbackUrl;
    link.download = `${document.fileName}.txt`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(fallbackUrl);
  };

  const tabs = [
    {
      value: "library",
      label: "Document Library",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Total Documents", value: stats.total.toLocaleString(), icon: FileText },
              { label: "Pending Review", value: stats.pending.toLocaleString(), icon: FolderOpen },
              { label: "Unmatched", value: stats.unmatched.toLocaleString(), icon: Search },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 26, delay: index * 0.08 }}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <stat.icon className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
                <div>
                  <p className="font-mono text-xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {showUploadZone && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <DocumentUploadZone onFilesUploaded={handleFilesUploaded} maxFiles={10} />
            </motion.div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <DocumentLibrary
              documents={documents}
              onPreviewDocument={handlePreviewDocument}
              onDownloadDocument={handleDownloadDocument}
              onSelectDocument={setSelectedDocumentId}
              selectedDocumentId={selectedDocumentId}
            />

            <div className="rounded-xl border border-border bg-card shadow-sm xl:sticky xl:top-6">
              <div className="border-b border-border p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Inline Preview
                </h3>
              </div>
              {selectedDocument ? (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground break-words">{selectedDocument.fileName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{selectedDocument.description || "No description provided"}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-2 min-h-[220px] flex items-center justify-center overflow-hidden">
                    {selectedDocument.previewUrl && selectedDocument.mimeType.includes("image") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedDocument.previewUrl}
                        alt={selectedDocument.fileName}
                        className="max-h-[300px] w-full rounded object-contain"
                      />
                    )}
                    {selectedDocument.previewUrl && selectedDocument.mimeType.includes("pdf") && (
                      <iframe title={selectedDocument.fileName} src={selectedDocument.previewUrl} className="h-[280px] w-full rounded" />
                    )}
                    {(!selectedDocument.previewUrl ||
                      (!selectedDocument.mimeType.includes("image") && !selectedDocument.mimeType.includes("pdf"))) && (
                      <div className="text-center px-4">
                        <File className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Preview unavailable for this file type</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={
                          selectedDocument.status === "ready"
                            ? "default"
                            : selectedDocument.status === "processing"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {selectedDocument.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono">{formatFileSize(selectedDocument.fileSize)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span className="font-mono">{selectedDocument.uploadedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">By</span>
                      <span>{selectedDocument.uploadedBy}</span>
                    </div>
                    {(selectedDocument.associatedLoadId || selectedDocument.associatedDriverId) && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Linked</span>
                        <span className="font-mono">
                          {selectedDocument.associatedLoadId || selectedDocument.associatedDriverId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePreviewDocument(selectedDocument.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Focus
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(selectedDocument.id)}>
                      <Link className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">Select a document to preview</div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "epod",
      label: "Electronic PODs",
      content: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <EPODDisplay />
        </motion.div>
      ),
    },
    {
      value: "upload",
      label: "Bulk Upload",
      content: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Bulk Document Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload multiple documents with automatic classification and association
            </p>
          </div>

          <DocumentUploadZone onFilesUploaded={handleFilesUploaded} maxFiles={50} />

          <div className="rounded-xl border border-border bg-card p-6">
            <h4 className="font-semibold text-foreground mb-3">Upload Guidelines</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
              <div>
                <h5 className="font-medium text-foreground mb-2">Supported Formats</h5>
                <ul className="space-y-1">
                  <li>• PDF documents</li>
                  <li>• Images (JPG, PNG, TIFF)</li>
                  <li>• Microsoft Office documents</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-foreground mb-2">Best Practices</h5>
                <ul className="space-y-1">
                  <li>• Use descriptive file names</li>
                  <li>• Maximum 10MB per file</li>
                  <li>• Select appropriate document type</li>
                  <li>• Include relevant associations</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Document imaging, BOLs, PODs, rate confirmations, and AI-powered classification.
          </p>
        </div>

        <Button onClick={() => setShowUploadZone((prev) => !prev)} className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700">
          <Upload className="h-4 w-4 mr-2" weight="duotone" />
          Quick Upload
        </Button>
      </div>

      <Tabs tabs={tabs} defaultValue="library" />
    </div>
  );
}
