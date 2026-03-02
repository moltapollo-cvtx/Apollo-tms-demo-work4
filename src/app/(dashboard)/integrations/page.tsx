"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plug,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  XCircle,
  Clock,
  LinkBreak,
  Radio,
  Gauge,
  CurrencyDollar,
  Cloud,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type IntegrationStatus = "connected" | "degraded" | "disconnected" | "syncing";

interface IntegrationService {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: IntegrationStatus;
  description: string;
  lastSync: string;
}

const initialServices: IntegrationService[] = [
  {
    id: "eld-samsara",
    name: "ELD / HOS",
    provider: "Samsara",
    category: "Telematics",
    status: "connected",
    description: "Vehicle positions, HOS logs, and driver status events.",
    lastSync: "2 min ago",
  },
  {
    id: "telematics-geotab",
    name: "GPS Telematics",
    provider: "Geotab",
    category: "Tracking",
    status: "degraded",
    description: "Fallback fleet telemetry and geofence pings.",
    lastSync: "18 min ago",
  },
  {
    id: "fuel-comdata",
    name: "Fuel Cards",
    provider: "Comdata",
    category: "Financial",
    status: "connected",
    description: "Fuel transaction import and exception matching.",
    lastSync: "9 min ago",
  },
  {
    id: "accounting-quickbooks",
    name: "Accounting",
    provider: "QuickBooks",
    category: "Financial",
    status: "connected",
    description: "Invoice export, payment status sync, and GL posting.",
    lastSync: "4 min ago",
  },
  {
    id: "edi-orderstream",
    name: "EDI Gateway",
    provider: "OrderStream",
    category: "EDI",
    status: "syncing",
    description: "Load tenders, 214 updates, and invoice acknowledgements.",
    lastSync: "Sync in progress",
  },
  {
    id: "loadboard-dat",
    name: "Load Board",
    provider: "DAT",
    category: "Marketplace",
    status: "disconnected",
    description: "Posting and pull-through of open loads to spot market.",
    lastSync: "Never",
  },
];

const statusStyles: Record<IntegrationStatus, string> = {
  connected: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
  degraded: "bg-amber-100 text-amber-700 border-amber-200",
  disconnected: "bg-slate-100 text-slate-700 border-slate-200",
  syncing: "bg-sky-100 text-sky-700 border-sky-200",
};

const statusIcons = {
  connected: CheckCircle,
  degraded: WarningCircle,
  disconnected: XCircle,
  syncing: Clock,
};

const categoryIcons: Record<string, typeof Plug> = {
  Telematics: Radio,
  Tracking: Gauge,
  Financial: CurrencyDollar,
  EDI: Cloud,
  Marketplace: Plug,
};

export default function IntegrationsPage() {
  const [services, setServices] = useState<IntegrationService[]>(initialServices);

  const metrics = useMemo(
    () => ({
      connected: services.filter((service) => service.status === "connected").length,
      degraded: services.filter((service) => service.status === "degraded").length,
      disconnected: services.filter((service) => service.status === "disconnected").length,
      syncing: services.filter((service) => service.status === "syncing").length,
    }),
    [services],
  );

  const toggleConnection = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== serviceId) {
          return service;
        }

        if (service.status === "disconnected") {
          return { ...service, status: "connected", lastSync: "Just now" };
        }

        return { ...service, status: "disconnected", lastSync: "Disconnected" };
      }),
    );
  };

  const runSync = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              status: "syncing",
              lastSync: "Sync in progress",
            }
          : service,
      ),
    );

    setTimeout(() => {
      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                status: "connected",
                lastSync: "Just now",
              }
            : service,
        ),
      );
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integration Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system connections, monitor sync health, and control external data flow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Connected", value: metrics.connected, color: "text-apollo-cyan-600" },
          { label: "Degraded", value: metrics.degraded, color: "text-amber-600" },
          { label: "Disconnected", value: metrics.disconnected, color: "text-slate-600" },
          { label: "Syncing", value: metrics.syncing, color: "text-sky-600" },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26, delay: index * 0.06 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.label}</p>
            <p className={cn("text-2xl font-semibold font-mono mt-1", metric.color)}>{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {services.map((service, index) => {
          const StatusIcon = statusIcons[service.status];
          const CategoryIcon = categoryIcons[service.category] ?? Plug;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 + index * 0.04 }}
              className="rounded-xl border border-border bg-card shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{service.name}</h2>
                    <p className="text-sm text-muted-foreground">{service.provider}</p>
                    <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                  </div>
                </div>

                <Badge className={cn("text-xs capitalize", statusStyles[service.status])}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {service.status}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Last Sync:</span> {service.lastSync}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => runSync(service.id)}>
                    <ArrowClockwise className="h-4 w-4 mr-1" />
                    Sync
                  </Button>
                  <Button
                    size="sm"
                    variant={service.status === "disconnected" ? "primary" : "outline"}
                    onClick={() => toggleConnection(service.id)}
                  >
                    {service.status === "disconnected" ? (
                      <>
                        <Plug className="h-4 w-4 mr-1" />
                        Connect
                      </>
                    ) : (
                      <>
                        <LinkBreak className="h-4 w-4 mr-1" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
