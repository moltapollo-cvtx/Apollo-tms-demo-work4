"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
  Image,
  X,
  Check,
  Warning,
  CloudArrowUp,
  Spinner,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  type?: "bol" | "pod" | "rate_confirmation" | "invoice" | "driver_license" | "medical_cert" | "insurance" | "other";
  associatedLoadId?: string;
  associatedDriverId?: string;
  description?: string;
}

interface DocumentUploadZoneProps {
  onFilesUploaded: (files: UploadFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

const DOCUMENT_TYPES = [
  { value: "bol", label: "Bill of Lading" },
  { value: "pod", label: "Proof of Delivery" },
  { value: "rate_confirmation", label: "Rate Confirmation" },
  { value: "invoice", label: "Invoice" },
  { value: "driver_license", label: "Driver License" },
  { value: "medical_cert", label: "Medical Certificate" },
  { value: "insurance", label: "Insurance Document" },
  { value: "other", label: "Other" },
];

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) {
    return Image;
  }
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function DocumentUploadZone({
  onFilesUploaded,
  maxFiles = 10,
  acceptedTypes = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".doc", ".docx"],
  className,
}: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Simulate file upload with progress
  const uploadFile = useCallback((file: UploadFile) => {
    setFiles(prev => prev.map(f =>
      f.id === file.id ? { ...f, status: "uploading" as const, progress: 0 } : f
    ));

    // Simulate upload progress
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id !== file.id) return f;

        const newProgress = Math.min(f.progress + Math.random() * 20, 100);
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...f, progress: 100, status: "completed" as const };
        }
        return { ...f, progress: newProgress };
      }));
    }, 200);

    return interval;
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = [];

    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) return;

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadFile: UploadFile = {
        id: fileId,
        file,
        progress: 0,
        status: "pending",
      };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadFile);
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading files
    newFiles.forEach(file => {
      uploadFile(file);
    });
  }, [files.length, maxFiles, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, ...updates } : f
    ));
  };

  const handleUploadAll = () => {
    setIsUploading(true);
    onFilesUploaded(files);

    // Simulate completion
    setTimeout(() => {
      setIsUploading(false);
      setFiles([]);
    }, 1000);
  };

  const completedFiles = files.filter(f => f.status === "completed");
  const canUpload = completedFiles.length > 0 && completedFiles.every(f => f.type);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragActive(true)}
        onDragLeave={() => setIsDragActive(false)}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center transition-colors
          ${isDragActive
            ? "border-apollo-cyan-500 bg-apollo-cyan-50 dark:bg-apollo-cyan-950/20"
            : "border-border bg-card hover:bg-muted/50"
          }
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={files.length >= maxFiles}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
              <CloudArrowUp className="h-8 w-8 text-apollo-cyan-600" weight="duotone" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Support for {acceptedTypes.join(", ")} files up to 10MB each
            </p>
          </div>

          {files.length >= maxFiles && (
            <Badge variant="secondary" className="mx-auto">
              Maximum {maxFiles} files reached
            </Badge>
          )}
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="font-medium text-foreground">Files to Upload ({files.length})</h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => {
                const Icon = getFileIcon(file.file);

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.file.name}
                        </p>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                        </span>

                        {/* Status Badge */}
                        {file.status === "pending" && (
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        )}
                        {file.status === "uploading" && (
                          <Badge variant="secondary" className="text-xs">
                            <Spinner className="h-3 w-3 animate-spin mr-1" />
                            {Math.round(file.progress)}%
                          </Badge>
                        )}
                        {file.status === "completed" && (
                          <Badge variant="default" className="text-xs text-apollo-cyan-600">
                            <Check className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                        {file.status === "error" && (
                          <Badge variant="destructive" className="text-xs">
                            <Warning className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {file.status === "uploading" && (
                        <div className="w-full bg-muted rounded-full h-1 mt-2">
                          <motion.div
                            className="bg-apollo-cyan-600 h-1 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}

                      {/* Document Type Selection */}
                      {file.status === "completed" && (
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Select
                            value={file.type || ""}
                            onValueChange={(value) => updateFileMetadata(file.id, { type: value as UploadFile['type'] })}
                            options={DOCUMENT_TYPES}
                            placeholder="Select document type"
                            size="sm"
                          />
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={file.description || ""}
                            onChange={(e) => updateFileMetadata(file.id, { description: e.target.value })}
                            className="px-2 py-1 text-xs border border-border rounded bg-background"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Upload Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {completedFiles.length} of {files.length} files ready
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={handleUploadAll}
                  disabled={!canUpload || isUploading}
                  className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
