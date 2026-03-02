"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  NavigationArrow,
  Truck,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Load {
  id: string;
  orderNumber: string;
  customer: string;
  pickup: {
    city: string;
    state: string;
    scheduledDate: string;
    scheduledTime: string;
  };
  delivery: {
    city: string;
    state: string;
    scheduledDate: string;
    scheduledTime: string;
  };
  commodity: string;
  weight: number;
  revenue: number;
  miles: number;
  status: "available" | "assigned" | "accepted" | "rejected";
}

export function DriverLoadList() {
  const [loads, setLoads] = useState<Load[]>([
    {
      id: "1",
      orderNumber: "TMS-24-08848",
      customer: "Home Depot",
      pickup: {
        city: "Atlanta",
        state: "GA",
        scheduledDate: "Mar 15",
        scheduledTime: "10:00 AM"
      },
      delivery: {
        city: "Nashville",
        state: "TN",
        scheduledDate: "Mar 16",
        scheduledTime: "08:00 AM"
      },
      commodity: "Building Materials",
      weight: 45000,
      revenue: 1850,
      miles: 248,
      status: "available"
    },
    {
      id: "2",
      orderNumber: "TMS-24-08849",
      customer: "Target Distribution",
      pickup: {
        city: "Memphis",
        state: "TN",
        scheduledDate: "Mar 17",
        scheduledTime: "02:00 PM"
      },
      delivery: {
        city: "Little Rock",
        state: "AR",
        scheduledDate: "Mar 18",
        scheduledTime: "07:00 AM"
      },
      commodity: "General Merchandise",
      weight: 38500,
      revenue: 1450,
      miles: 137,
      status: "available"
    },
    {
      id: "3",
      orderNumber: "TMS-24-08850",
      customer: "Lowe's",
      pickup: {
        city: "Dallas",
        state: "TX",
        scheduledDate: "Mar 19",
        scheduledTime: "06:00 AM"
      },
      delivery: {
        city: "Houston",
        state: "TX",
        scheduledDate: "Mar 19",
        scheduledTime: "04:00 PM"
      },
      commodity: "Home Improvement",
      weight: 41200,
      revenue: 950,
      miles: 239,
      status: "available"
    }
  ]);

  const [swipedLoads, setSwipedLoads] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSwipe = (loadId: string, direction: "left" | "right") => {
    const newStatus = direction === "right" ? "accepted" : "rejected";

    setLoads(prev => prev.map(load =>
      load.id === loadId ? { ...load, status: newStatus } : load
    ));

    setSwipedLoads(prev => new Set(prev).add(loadId));

    // Remove from view after animation
    setTimeout(() => {
      setLoads(prev => prev.filter(load => load.id !== loadId));
      setSwipedLoads(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadId);
        return newSet;
      });
    }, 300);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, loadId: string) => {
    const threshold = 150;
    const velocity = Math.abs(info.velocity.x);

    if (Math.abs(info.offset.x) > threshold || velocity > 500) {
      const direction = info.offset.x > 0 ? "right" : "left";
      handleSwipe(loadId, direction);
    }
  };

  const _getSwipeIndicators = (offsetX: number) => {
    const opacity = Math.min(Math.abs(offsetX) / 150, 1);

    if (offsetX > 50) {
      return (
        <motion.div
          className="absolute inset-0 bg-apollo-cyan-500 rounded-3xl flex items-center justify-start pl-8"
          style={{ opacity }}
        >
          <div className="flex items-center gap-2 text-white">
            <CheckCircle className="h-6 w-6" weight="fill" />
            <span className="font-semibold">Accept</span>
          </div>
        </motion.div>
      );
    }

    if (offsetX < -50) {
      return (
        <motion.div
          className="absolute inset-0 bg-red-500 rounded-3xl flex items-center justify-end pr-8"
          style={{ opacity }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="font-semibold">Reject</span>
            <XCircle className="h-6 w-6" weight="fill" />
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Available Loads</h1>
          <p className="text-sm text-slate-600">{loads.length} loads available</p>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-slate-200"
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-apollo-cyan-500 rounded-full" />
            <span className="text-slate-700">Swipe right to accept</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700">Swipe left to reject</span>
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Load Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {loads.map((load, index) => (
            <motion.div
              key={load.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                zIndex: loads.length - index
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: swipedLoads.has(load.id) ?
                  (loads.find(l => l.id === load.id)?.status === "accepted" ? 300 : -300) : 0
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="relative"
              style={{
                transformOrigin: "center center"
              }}
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(event, info) => handleDragEnd(event, info, load.id)}
                whileDrag={{
                  scale: 1.05,
                  zIndex: 999
                }}
                className="relative bg-white rounded-3xl p-6 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing"
              >
                {/* Swipe Indicators */}
                <div className="absolute inset-0 -z-10">
                  {/* Swipe indicators would be shown here based on drag state */}
                </div>

                {/* Load Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {load.customer}
                    </div>
                    <div className="text-sm text-slate-600 font-mono">
                      {load.orderNumber}
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-mono">
                    {formatCurrency(load.revenue)}
                  </Badge>
                </div>

                {/* Route */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {load.pickup.city}, {load.pickup.state}
                      </div>
                      <div className="text-xs text-slate-600">
                        Pickup • {load.pickup.scheduledDate} at {load.pickup.scheduledTime}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <NavigationArrow className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="ml-6">
                    <div className="h-8 border-l-2 border-dashed border-slate-300" />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full border-2 border-slate-400 bg-white flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {load.delivery.city}, {load.delivery.state}
                      </div>
                      <div className="text-xs text-slate-600">
                        Delivery • {load.delivery.scheduledDate} at {load.delivery.scheduledTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Load Details */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-600 mb-1">Miles</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">
                      {load.miles}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-600 mb-1">Weight</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">
                      {(load.weight / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-600 mb-1">Rate/Mile</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">
                      ${(load.revenue / load.miles).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>{load.commodity}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {loads.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center"
        >
          <div className="text-slate-400 mb-4">
            <Truck className="h-12 w-12 mx-auto" />
          </div>
          <div className="text-lg font-medium text-slate-900 mb-2">
            No More Loads
          </div>
          <div className="text-sm text-slate-600">
            Great job! You&apos;ve reviewed all available loads. Check back later for new opportunities.
          </div>
        </motion.div>
      )}
    </div>
  );
}