"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  MapPin,
  Clock,
  Camera,
  ChatCircle,
  CurrencyDollar,
  Star,
  NavigationArrow,
  Phone,
  Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CurrentAssignment {
  orderNumber: string;
  customer: string;
  pickup: {
    city: string;
    state: string;
    scheduledTime: string;
    address: string;
  };
  delivery: {
    city: string;
    state: string;
    scheduledTime: string;
    address: string;
  };
  commodity: string;
  weight: number;
  status: "assigned" | "en_route_pickup" | "at_pickup" | "en_route_delivery" | "at_delivery";
  progress: number;
}

interface DriverStats {
  todaysMiles: number;
  weekRevenue: number;
  safetyScore: number;
  onTimeRate: number;
}

export function DriverHome() {
  const [currentAssignment] = useState<CurrentAssignment>({
    orderNumber: "TMS-24-08847",
    customer: "Walmart Distribution Center",
    pickup: {
      city: "Dallas",
      state: "TX",
      scheduledTime: "08:00 AM",
      address: "2405 Stemmons Freeway, Dallas, TX 75207"
    },
    delivery: {
      city: "Oklahoma City",
      state: "OK",
      scheduledTime: "02:00 PM",
      address: "7800 NW 25th St, Bethany, OK 73008"
    },
    commodity: "General Merchandise",
    weight: 42500,
    status: "en_route_pickup",
    progress: 25
  });

  const [stats] = useState<DriverStats>({
    todaysMiles: 287,
    weekRevenue: 2450,
    safetyScore: 98,
    onTimeRate: 96
  });

  const getStatusInfo = (status: string) => {
    const statusMap = {
      assigned: { label: "Assigned", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
      en_route_pickup: { label: "En Route to Pickup", color: "bg-amber-100 text-amber-700 border-amber-200", icon: NavigationArrow },
      at_pickup: { label: "At Pickup", color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200", icon: MapPin },
      en_route_delivery: { label: "En Route to Delivery", color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200", icon: NavigationArrow },
      at_delivery: { label: "At Delivery", color: "bg-sky-100 text-sky-700 border-sky-200", icon: MapPin },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.assigned;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statusInfo = getStatusInfo(currentAssignment.status);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Good Morning</h1>
          <p className="text-sm text-slate-600">Mike Rodriguez</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200" aria-label="Driver status: Available">
            Available
          </Badge>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-semibold">MR</span>
          </div>
        </div>
      </motion.div>

      {/* Current Assignment Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current Assignment</h2>
            <p className="text-sm text-slate-600 font-mono">{currentAssignment.orderNumber}</p>
          </div>
          <Badge className={cn("border font-mono text-xs", statusInfo.color)}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Route */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="mt-2 h-3 w-3 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">
                {currentAssignment.pickup.city}, {currentAssignment.pickup.state}
              </div>
              <div className="text-xs text-slate-600">
                Pickup • {currentAssignment.pickup.scheduledTime}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {currentAssignment.pickup.address}
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <NavigationArrow className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="ml-6 mr-12">
            <div className="h-0.5 bg-slate-200 rounded-full relative">
              <motion.div
                className="h-0.5 bg-apollo-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentAssignment.progress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-2 h-3 w-3 rounded-full border-2 border-slate-300 bg-white flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">
                {currentAssignment.delivery.city}, {currentAssignment.delivery.state}
              </div>
              <div className="text-xs text-slate-600">
                Delivery • {currentAssignment.delivery.scheduledTime}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {currentAssignment.delivery.address}
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Load Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
          <div>
            <div className="text-xs text-slate-600">Customer</div>
            <div className="text-sm font-medium text-slate-900 truncate">
              {currentAssignment.customer}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600">Weight</div>
            <div className="text-sm font-medium text-slate-900 font-mono">
              {currentAssignment.weight.toLocaleString()} lbs
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-slate-600">Commodity</div>
            <div className="text-sm font-medium text-slate-900">
              {currentAssignment.commodity}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Progress</span>
            <span className="font-mono text-slate-900">{currentAssignment.progress}%</span>
          </div>
          <Progress value={currentAssignment.progress} className="h-2" />
        </div>

        {/* Action Buttons - Enhanced for Mobile & Accessibility */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            size="sm"
            className="h-14 flex-col gap-2 bg-apollo-cyan-600 hover:bg-apollo-cyan-700 touch-manipulation"
            aria-label="Check in at current location"
          >
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Check In</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-14 flex-col gap-2 touch-manipulation"
            aria-label="Scan document with camera"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Scan Doc</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-14 flex-col gap-2 touch-manipulation"
            aria-label="Report an issue or problem"
          >
            <Warning className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Report Issue</span>
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-slate-600">Today&apos;s Miles</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {stats.todaysMiles}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollar className="h-4 w-4 text-apollo-cyan-600" />
            <span className="text-xs text-slate-600">Week Revenue</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatCurrency(stats.weekRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-slate-600">Safety Score</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {stats.safetyScore}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-sky-600" />
            <span className="text-xs text-slate-600">On Time</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {stats.onTimeRate}%
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Enhanced for Touch & Accessibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-4"
        role="group"
        aria-label="Quick actions"
      >
        <Button
          variant="outline"
          className="h-16 flex-col gap-2 bg-white border-slate-200 text-slate-700 touch-manipulation"
          aria-label="View messages and communications"
        >
          <ChatCircle className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Messages</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col gap-2 bg-white border-slate-200 text-slate-700 touch-manipulation"
          aria-label="View pay summary and earnings"
        >
          <CurrencyDollar className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Pay Summary</span>
        </Button>
      </motion.div>
    </div>
  );
}