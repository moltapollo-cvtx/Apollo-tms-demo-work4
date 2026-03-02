"use client";

import { Clock, MapPin, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { OrderWithDetails, Stop } from "@/types";

interface OrderStopsTabProps {
  order: OrderWithDetails;
}

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const getStopTypeLabel = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function OrderStopsTab({ order }: OrderStopsTabProps) {
  const stops = [...(order.stops || [])].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const completedStops = stops.filter((stop) => stop.isCompleted).length;

  const columns: Column<Stop>[] = [
    {
      key: "sequence",
      title: "Stop #",
      sortable: true,
      align: "center",
      width: 88,
      render: (value) => <span className="font-mono">{value || "—"}</span>,
    },
    {
      key: "type",
      title: "Type",
      sortable: true,
      filterable: true,
      render: (value) => {
        const normalizedType = String(value || "other");
        const isPickup = normalizedType.toLowerCase() === "pickup";

        return (
          <Badge
            className={
              isPickup
                ? "border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700"
                : "border-sky-200 bg-sky-100 text-sky-700"
            }
          >
            {getStopTypeLabel(normalizedType)}
          </Badge>
        );
      },
    },
    {
      key: "city",
      title: "Location",
      sortable: true,
      filterable: true,
      render: (_value, row) => (
        <div>
          <p className="font-medium text-foreground">
            {row.city}, {row.state}
          </p>
          <p className="text-xs text-muted-foreground">{row.address}</p>
        </div>
      ),
    },
    {
      key: "scheduledDate",
      title: "Scheduled",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-mono text-sm">{formatDateTime(value as string | Date | null | undefined)}</p>
          {(row.scheduledTimeStart || row.scheduledTimeEnd) && (
            <p className="text-xs text-muted-foreground font-mono">
              {row.scheduledTimeStart || "--:--"} - {row.scheduledTimeEnd || "--:--"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actualArrival",
      title: "Actual",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <p className="font-mono">Arr: {formatDateTime(value as string | Date | null | undefined)}</p>
          <p className="font-mono text-muted-foreground">
            Dep: {formatDateTime(row.actualDeparture)}
          </p>
        </div>
      ),
    },
    {
      key: "isCompleted",
      title: "Status",
      sortable: true,
      filterable: true,
      align: "right",
      getFilterValue: (row) => (row.isCompleted ? "Completed" : "Pending"),
      render: (value) => {
        const complete = Boolean(value);
        return complete ? (
          <Badge className="border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700">Completed</Badge>
        ) : (
          <Badge className="border-amber-200 bg-amber-100 text-amber-700">Pending</Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Stops Planned</p>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{stops.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Completed</p>
            <CheckCircle className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{completedStops}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {Math.max(stops.length - completedStops, 0)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={stops}
          columns={columns}
          searchPlaceholder="Search stops, addresses, contacts..."
          emptyState={{
            icon: <WarningCircle className="h-full w-full" />,
            title: "No stops on this order",
            description: "Add pickup and delivery stops to build the route timeline.",
          }}
          defaultPageSize={5}
          defaultPageSizeOptions={[5, 10, 20]}
        />
      </Card>
    </div>
  );
}
