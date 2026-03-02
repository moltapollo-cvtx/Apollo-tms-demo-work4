"use client";

import { NavigationArrow, ClockCounterClockwise, MapPin, WarningCircle } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { OrderWithDetails, TrackingEvent } from "@/types";

interface OrderTrackingTabProps {
  order: OrderWithDetails;
}

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const toLabel = (value: string | null | undefined) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Unknown";

export default function OrderTrackingTab({ order }: OrderTrackingTabProps) {
  const trackingEvents = ([...(order.trackingEvents || [])] as TrackingEvent[]).sort(
    (a, b) => new Date(b.eventTime || 0).getTime() - new Date(a.eventTime || 0).getTime()
  );

  const lastEvent = trackingEvents[0];

  const columns: Column<TrackingEvent>[] = [
    {
      key: "eventTime",
      title: "Event Time",
      sortable: true,
      width: 180,
      render: (value) => <span className="font-mono text-sm">{formatDateTime(value as string | Date | null)}</span>,
    },
    {
      key: "eventType",
      title: "Event",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => toLabel(row.eventType),
      render: (value) => (
        <Badge className="border-sky-200 bg-sky-100 text-sky-700">{toLabel(value as string)}</Badge>
      ),
    },
    {
      key: "address",
      title: "Location",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="text-sm text-foreground">{String(value || "No address recorded")}</p>
          {row.latitude && row.longitude && (
            <p className="font-mono text-xs text-muted-foreground">
              {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "source",
      title: "Source",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => toLabel(row.source),
      render: (value) => <span className="text-sm text-muted-foreground">{toLabel(value as string)}</span>,
    },
    {
      key: "notes",
      title: "Notes",
      render: (value) => <span className="text-sm text-muted-foreground">{String(value || "—")}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tracking Events</p>
            <NavigationArrow className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{trackingEvents.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Latest Update</p>
            <ClockCounterClockwise className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-sm text-foreground">{formatDateTime(lastEvent?.eventTime)}</p>
          <p className="text-xs text-muted-foreground">{toLabel(lastEvent?.eventType)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Latest Position</p>
            <MapPin className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-sm text-foreground line-clamp-2">{lastEvent?.address || "No GPS location yet"}</p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={trackingEvents}
          columns={columns}
          searchPlaceholder="Search event type, source, or notes..."
          emptyState={{
            icon: <WarningCircle className="h-full w-full" />,
            title: "No tracking events",
            description: "Tracking events will appear after dispatch and in-transit updates.",
          }}
          defaultPageSize={8}
          defaultPageSizeOptions={[8, 16, 32]}
        />
      </Card>
    </div>
  );
}
