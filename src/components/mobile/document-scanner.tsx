"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  X,
  CheckCircle,
  Lightning,
  LightningSlash,
  ArrowClockwise,
  Download,
  Share,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DocumentType = "bol" | "pod" | "invoice" | "receipt" | "inspection" | "other";

interface CapturedDocument {
  id: string;
  type: DocumentType;
  imageData: string;
  timestamp: Date;
  orderNumber?: string;
}

interface DocumentScannerProps {
  orderNumber?: string;
  onDocumentCaptured?: (document: CapturedDocument) => void;
  onClose?: () => void;
}

export function DocumentScanner({
  orderNumber,
  onDocumentCaptured,
  onClose
}: DocumentScannerProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedDocs, setCapturedDocs] = useState<CapturedDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<CapturedDocument | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>("bol");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const documentTypes: { type: DocumentType; label: string; color: string }[] = [
    { type: "bol", label: "Bill of Lading", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { type: "pod", label: "Proof of Delivery", color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200" },
    { type: "invoice", label: "Invoice", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { type: "receipt", label: "Receipt", color: "bg-sky-100 text-sky-700 border-sky-200" },
    { type: "inspection", label: "Inspection", color: "bg-red-100 text-red-700 border-red-200" },
    { type: "other", label: "Other", color: "bg-slate-100 text-slate-700 border-slate-200" },
  ];

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      // Fallback to file input if camera not available
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);

        const newDoc: CapturedDocument = {
          id: Date.now().toString(),
          type: selectedType,
          imageData,
          timestamp: new Date(),
          orderNumber
        };

        setCapturedDocs(prev => [...prev, newDoc]);
        setCurrentDoc(newDoc);
        stopCamera();

        if (onDocumentCaptured) {
          onDocumentCaptured(newDoc);
        }
      }
    }
  }, [selectedType, orderNumber, stopCamera, onDocumentCaptured]);

  const retakePhoto = useCallback(() => {
    setCurrentDoc(null);
    startCamera();
  }, [startCamera]);

  const saveDocument = useCallback(() => {
    // In a real app, this would upload to the server
    setCurrentDoc(null);
  }, []);

  const deleteDocument = useCallback((docId: string) => {
    setCapturedDocs(prev => prev.filter(doc => doc.id !== docId));
    if (currentDoc?.id === docId) {
      setCurrentDoc(null);
    }
  }, [currentDoc]);

  const getTypeConfig = (type: DocumentType) => {
    return documentTypes.find(t => t.type === type) || documentTypes[0];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-950/80 to-transparent"
      >
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="text-lg font-semibold">Document Scanner</div>
            {orderNumber && (
              <div className="text-sm text-slate-300 font-mono">{orderNumber}</div>
            )}
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </motion.div>

      {/* Camera View */}
      <AnimatePresence mode="wait">
        {isCapturing && !currentDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Camera Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Viewfinder */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-2xl" />
              <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white" />
              <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white" />
            </div>

            {/* Document Type Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-20 left-4 right-4"
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {documentTypes.map((type) => (
                  <Button
                    key={type.type}
                    variant={selectedType === type.type ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      "flex-shrink-0 text-xs",
                      selectedType === type.type
                        ? "bg-white text-slate-900"
                        : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                    )}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-4 right-4"
            >
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className="text-white hover:bg-white/20 h-14 w-14 rounded-full"
                >
                  {flashEnabled ? (
                    <Lightning className="h-6 w-6" />
                  ) : (
                    <LightningSlash className="h-6 w-6" />
                  )}
                </Button>

                <Button
                  onClick={capturePhoto}
                  className="h-20 w-20 rounded-full bg-white hover:bg-slate-100 border-4 border-white/50"
                >
                  <Camera className="h-8 w-8 text-slate-900" />
                </Button>

                <div className="w-14" /> {/* Spacer */}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Document Preview */}
        {currentDoc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full h-full bg-slate-900 flex flex-col"
          >
            {/* Preview Image */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={currentDoc.imageData}
                alt="Captured document"
                className="max-w-full max-h-full rounded-2xl shadow-lg"
              />
            </div>

            {/* Document Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-800 border-t border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge className={cn("border", getTypeConfig(currentDoc.type).color)}>
                    {getTypeConfig(currentDoc.type).label}
                  </Badge>
                  <div className="text-sm text-slate-400 mt-1">
                    {currentDoc.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(currentDoc.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <ArrowClockwise className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={saveDocument}
                  className="flex-1 bg-apollo-cyan-600 hover:bg-apollo-cyan-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Document
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Initial State */}
        {!isCapturing && !currentDoc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-apollo-cyan-600 rounded-full flex items-center justify-center mb-6"
            >
              <Camera className="h-12 w-12 text-white" />
            </motion.div>

            <h2 className="text-2xl font-semibold text-white mb-2">
              Scan Documents
            </h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              Capture BOL, POD, receipts, and other load documents with your camera
            </p>

            <Button
              onClick={startCamera}
              size="lg"
              className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700 px-8"
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </Button>

            {/* Recent Documents */}
            {capturedDocs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 w-full max-w-sm"
              >
                <h3 className="text-lg font-medium text-white mb-4">
                  Recent Documents
                </h3>
                <div className="space-y-2">
                  {capturedDocs.slice(-3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl"
                    >
                      <img
                        src={doc.imageData}
                        alt="Document thumbnail"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-white">
                          {getTypeConfig(doc.type).label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {doc.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}