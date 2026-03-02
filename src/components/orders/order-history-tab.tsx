"use client";

import { ClockCounterClockwise, ClipboardText, Package } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { OrderWithDetails } from "@/types";

interface OrderHistoryTabProps {
  order: OrderWithDetails;
}

interface HistoryEvent {
  id: string;
  timestamp: string | Date;
  type: string;
  actor: string;
  description: string;
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

const normalizeType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function OrderHistoryTab({ order }: OrderHistoryTabProps) {
  const events: HistoryEvent[] = [];

  if (order.createdAt) {
    events.push({
      id: `created-${order.id}`,
      timestamp: order.createdAt,
      type: "order_created",
      actor: "System",
      description: `Order ${order.orderNumber} created for ${order.customer?.name || "customer"}.`,
    });
  }

  for (const assignment of order.assignments || []) {
    if (assignment.assignedAt) {
      events.push({
        id: `assigned-${assignment.id}`,
        timestamp: assignment.assignedAt,
        type: "assignment",
        actor: assignment.assignedBy ? `User #${assignment.assignedBy}` : "Dispatcher",
        description: `Assigned driver/equipment to load (assignment #${assignment.id}).`,
      });
    }
    if (assignment.dispatchedAt) {
      events.push({
        id: `dispatched-${assignment.id}`,
        timestamp: assignment.dispatchedAt,
        type: "dispatched",
        actor: assignment.dispatchedBy ? `User #${assignment.dispatchedBy}` : "Dispatcher",
        description: `Load dispatched to active route.`,
      });
    }
    if (assignment.unassignedAt) {
      events.push({
        id: `unassigned-${assignment.id}`,
        timestamp: assignment.unassignedAt,
        type: "unassigned",
        actor: assignment.unassignedBy ? `User #${assignment.unassignedBy}` : "Dispatcher",
        description: `Assignment cleared from load.`,
      });
    }
  }

  for (const trackingEvent of order.trackingEvents || []) {
    if (!trackingEvent.eventTime) continue;
    events.push({
      id: `tracking-${trackingEvent.id}`,
      timestamp: trackingEvent.eventTime,
      type: trackingEvent.eventType,
      actor: normalizeType(trackingEvent.source || "system"),
      description: trackingEvent.notes || trackingEvent.address || "Tracking update captured.",
    });
  }

  if (order.updatedAt && order.updatedAt !== order.createdAt) {
    events.push({
      id: `updated-${order.id}`,
      timestamp: order.updatedAt,
      type: "order_updated",
      actor: "System",
      description: `Order record updated (${normalizeType(order.status || "available")}).`,
    });
  }

  const history = events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const columns: Column<HistoryEvent>[] = [
    {
      key: "timestamp",
      title: "Time",
      sortable: true,
      width: 190,
      render: (value) => <span className="font-mono text-sm">{formatDateTime(value as string | Date)}</span>,
    },
    {
      key: "type",
      title: "Event",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => normalizeType(row.type),
      render: (value) => (
        <Badge className="border-slate-200 bg-slate-100 text-slate-700">{normalizeType(String(value))}</Badge>
      ),
    },
    {
      key: "actor",
      title: "Actor",
      sortable: true,
      filterable: true,
      render: (value) => <span className="text-sm text-foreground">{String(value)}</span>,
    },
    {
      key: "description",
      title: "Details",
      sortable: true,
      render: (value) => <span className="text-sm text-muted-foreground">{String(value)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Audit Entries</p>
            <ClipboardText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{history.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Most Recent</p>
            <ClockCounterClockwise className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-sm text-foreground">{formatDateTime(history[0]?.timestamp)}</p>
          <p className="text-xs text-muted-foreground">{history[0] ? normalizeType(history[0].type) : "—"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current Status</p>
            <Package className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            {normalizeType(order.status || "available")}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={history}
          columns={columns}
          searchPlaceholder="Search events, actors, or details..."
          emptyState={{
            icon: <ClipboardText className="h-full w-full" />,
            title: "No order history yet",
            description: "Lifecycle events will appear here as dispatch and updates occur.",
          }}
          defaultPageSize={8}
          defaultPageSizeOptions={[8, 16, 32]}
        />
      </Card>
    </div>
  );
}
