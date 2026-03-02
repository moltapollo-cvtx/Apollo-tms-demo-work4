"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText as Certificate,
  User,
  Clock,
  MapPin,
  Camera,
  PencilSimple,
  Check,
  Warning,
  Download,
  Share,
  Eye,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleModal as Modal } from "@/components/ui/modal";

interface ePODData {
  id: string;
  loadId: string;
  deliveryAddress: string;
  deliveryDate: Date;
  deliveryTime: string;

  // Signature data
  signature: {
    imageUrl: string;
    signerName: string;
    signerTitle?: string;
    signedAt: Date;
  };

  // Location data
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    accuracy: number; // in meters
    capturedAt: Date;
  };

  // Photos
  photos: {
    id: string;
    imageUrl: string;
    description: string;
    capturedAt: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
  }[];

  // Driver and delivery info
  driverName: string;
  driverId: string;
  vehicleId: string;

  // Delivery details
  deliveryNotes?: string;
  damageReported: boolean;
  damageDetails?: string;

  // Timestamps
  arrivedAt: Date;
  departedAt?: Date;

  // Status
  status: "pending" | "completed" | "disputed";
}

type EPODBadgeVariant = "default" | "secondary" | "destructive";

interface EPODStatusInfo {
  variant: EPODBadgeVariant;
  label: string;
  icon: typeof Clock;
}

// Mock ePOD data - will be replaced with API calls
const mockEPODData: ePODData = {
  id: "EPOD-001234",
  loadId: "LD-001234",
  deliveryAddress: "1234 Commerce St, Dallas, TX 75201",
  deliveryDate: new Date(2026, 2, 5, 14, 30),
  deliveryTime: "2:30 PM",

  signature: {
    imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTAgNTBRNTAgMjAgMTAwIDUwVDE5MCA1MFEyMjAgNDAgMjYwIDcwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=",
    signerName: "Lena Harper",
    signerTitle: "Receiving Supervisor",
    signedAt: new Date(2026, 2, 5, 14, 35),
  },

  gpsCoordinates: {
    latitude: 32.7767,
    longitude: -96.7970,
    accuracy: 3.2,
    capturedAt: new Date(2026, 2, 5, 14, 30),
  },

  photos: [
    {
      id: "1",
      imageUrl: "/mock/epod-1.svg",
      description: "Freight condition on arrival",
      capturedAt: new Date(2026, 2, 5, 14, 25),
      location: { latitude: 32.7767, longitude: -96.7970 },
    },
    {
      id: "2",
      imageUrl: "/mock/epod-2.svg",
      description: "Unloading dock area",
      capturedAt: new Date(2026, 2, 5, 14, 28),
      location: { latitude: 32.7767, longitude: -96.7970 },
    },
    {
      id: "3",
      imageUrl: "/mock/epod-3.svg",
      description: "Completed delivery - warehouse floor",
      capturedAt: new Date(2026, 2, 5, 14, 40),
      location: { latitude: 32.7767, longitude: -96.7970 },
    }
  ],

  driverName: "Marcus Rodriguez",
  driverId: "DRV-MR247",
  vehicleId: "TRK-204",

  deliveryNotes: "Delivered to receiving dock. All items in good condition. Customer requested early morning delivery for next shipment.",
  damageReported: false,

  arrivedAt: new Date(2026, 2, 5, 14, 20),
  departedAt: new Date(2026, 2, 5, 14, 45),

  status: "completed",
};

interface EPODDisplayProps {
  podData?: ePODData;
  className?: string;
}

export function EPODDisplay({ podData = mockEPODData, className }: EPODDisplayProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<typeof podData.photos[0] | null>(null);

  const getStatusBadge = (status: ePODData["status"]): EPODStatusInfo => {
    switch (status) {
      case "pending":
        return { variant: "secondary", label: "Pending", icon: Clock };
      case "completed":
        return { variant: "default", label: "Completed", icon: Check };
      case "disputed":
        return { variant: "destructive", label: "Disputed", icon: Warning };
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const statusInfo = getStatusBadge(podData.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-apollo-cyan-100 dark:bg-apollo-cyan-900/20">
            <Certificate className="h-6 w-6 text-apollo-cyan-600" weight="duotone" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Electronic Proof of Delivery</h2>
            <p className="text-sm text-muted-foreground font-mono">{podData.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Delivery Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
            Delivery Information
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Load ID</label>
                <p className="font-mono text-sm text-foreground">{podData.loadId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Driver</label>
                <p className="text-sm text-foreground">{podData.driverName}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Delivery Address</label>
              <p className="text-sm text-foreground">{podData.deliveryAddress}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Arrived</label>
                <p className="font-mono text-sm text-foreground">
                  {podData.arrivedAt.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Departed</label>
                <p className="font-mono text-sm text-foreground">
                  {podData.departedAt?.toLocaleString() || "—"}
                </p>
              </div>
            </div>

            {/* GPS Information */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-apollo-cyan-600" />
                GPS Verification
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-mono text-foreground">
                    {formatCoordinates(podData.gpsCoordinates.latitude, podData.gpsCoordinates.longitude)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="font-mono text-foreground">±{podData.gpsCoordinates.accuracy}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Captured:</span>
                  <span className="font-mono text-foreground">
                    {podData.gpsCoordinates.capturedAt.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Notes */}
            {podData.deliveryNotes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Delivery Notes</label>
                <p className="text-sm text-foreground mt-1 p-3 rounded-lg bg-muted/50">
                  {podData.deliveryNotes}
                </p>
              </div>
            )}

            {/* Damage Report */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Damage Reported</label>
              <div className="flex items-center gap-2 mt-1">
                {podData.damageReported ? (
                  <Badge variant="destructive" className="text-xs">
                    <Warning className="h-3 w-3 mr-1" />
                    Damage Reported
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs text-apollo-cyan-600">
                    <Check className="h-3 w-3 mr-1" />
                    No Damage
                  </Badge>
                )}
              </div>
              {podData.damageDetails && (
                <p className="text-sm text-foreground mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  {podData.damageDetails}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Signature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <PencilSimple className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
            Customer Signature
          </h3>

          <div className="space-y-4">
            {/* Signature Image */}
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={podData.signature.imageUrl}
                alt="Customer Signature"
                className="mx-auto max-h-24 w-auto"
              />
            </div>

            {/* Signer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{podData.signature.signerName}</p>
                  {podData.signature.signerTitle && (
                    <p className="text-xs text-muted-foreground">{podData.signature.signerTitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-foreground font-mono">
                  Signed: {podData.signature.signedAt.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Signature Verification */}
            <div className="rounded-lg bg-apollo-cyan-50 dark:bg-apollo-cyan-950/20 p-3">
              <div className="flex items-center gap-2 text-apollo-cyan-700 dark:text-apollo-cyan-300">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Signature Verified</span>
              </div>
              <p className="text-xs text-apollo-cyan-600 dark:text-apollo-cyan-400 mt-1">
                Digital signature captured with GPS verification
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Photos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-apollo-cyan-600" weight="duotone" />
          Delivery Photos ({podData.photos.length})
        </h3>

        {podData.photos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {podData.photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="group relative aspect-video rounded-lg overflow-hidden border border-border cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.description}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Photo Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-medium truncate">{photo.description}</p>
                  <p className="text-white/70 text-xs font-mono">
                    {photo.capturedAt.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No photos captured for this delivery</p>
          </div>
        )}
      </motion.div>

      {/* Photo Modal */}
      <Modal
        isOpen={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        title="Delivery Photo"
        size="lg"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.description}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-foreground">{selectedPhoto.description}</h3>
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{selectedPhoto.capturedAt.toLocaleString()}</span>
                </div>
                {selectedPhoto.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-mono">
                      {formatCoordinates(selectedPhoto.location.latitude, selectedPhoto.location.longitude)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
