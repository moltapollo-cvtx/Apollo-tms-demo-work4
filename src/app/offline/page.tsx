"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudSlash, ArrowClockwise, Truck, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check initial status
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.location.reload();
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isOnline]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const goHome = () => {
    window.location.href = "/";
  };

  if (isOnline) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-apollo-cyan-50 to-apollo-cyan-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.12 }}
            className="w-20 h-20 bg-apollo-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-white" weight="fill" />
          </motion.div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-4">
            Back Online!
          </h1>
          <p className="text-slate-600 mb-6">
            Your connection has been restored. Redirecting you back to Apollo TMS...
          </p>

          <div className="w-8 h-8 border-4 border-apollo-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-md w-full"
      >
        {/* Offline Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.12 }}
          className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CloudSlash className="h-10 w-10 text-slate-500" weight="duotone" />
        </motion.div>

        {/* Title and Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.2 }}
        >
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">
            You&apos;re Offline
          </h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            It looks like you&apos;ve lost your internet connection. Don&apos;t worry - Apollo TMS
            works offline too! Some cached data is still available.
          </p>
        </motion.div>

        {/* Offline Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.28 }}
          className="bg-slate-50 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <Truck className="h-5 w-5 text-apollo-cyan-600" />
            <span className="text-sm font-medium text-slate-900">
              What you can still do:
            </span>
          </div>
          <ul className="text-sm text-slate-600 space-y-2 text-left">
            <li>• View cached load information</li>
            <li>• Access driver profiles and data</li>
            <li>• Review recent transactions</li>
            <li>• Browse saved reports</li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.36 }}
          className="space-y-3"
        >
          <Button
            onClick={handleRetry}
            className="w-full h-12 bg-apollo-cyan-600 hover:bg-apollo-cyan-700"
          >
            <ArrowClockwise className="h-4 w-4 mr-2" />
            Try Again {retryCount > 0 && `(${retryCount})`}
          </Button>

          <Button
            variant="outline"
            onClick={goHome}
            className="w-full h-12"
          >
            Go to Home
          </Button>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.44 }}
          className="mt-6 pt-6 border-t border-slate-200"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>No internet connection</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
