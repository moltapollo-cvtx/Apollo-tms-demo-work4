"use client";

import { Truck, Clock, ArrowsClockwise } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { DriverWithDetails } from "@/types";

interface DriverLoadsTabProps {
  driver: DriverWithDetails;
}

interface LoadActivityRow {
  id: string;
  orderNumber: string;
  eventType: "assigned" | "dispatched" | "unassigned";
  timestamp: string | Date;
  tractorId: number | null;
  trailerId: number | null;
  isActive: boolean;
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

const eventTone: Record<LoadActivityRow["eventType"], string> = {
  assigned: "border-sky-200 bg-sky-100 text-sky-700",
  dispatched: "border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700",
  unassigned: "border-amber-200 bg-amber-100 text-amber-700",
};

export default function DriverLoadsTab({ driver }: DriverLoadsTabProps) {
  const assignment = driver.currentAssignment;

  const activityRows: LoadActivityRow[] = [];

  if (assignment?.assignedAt) {
    activityRows.push({
      id: `assigned-${assignment.id}`,
      orderNumber: assignment.order?.orderNumber || `Order #${assignment.orderId}`,
      eventType: "assigned",
      timestamp: assignment.assignedAt,
      tractorId: assignment.tractorId,
      trailerId: assignment.trailerId,
      isActive: Boolean(assignment.isActive),
    });
  }

  if (assignment?.dispatchedAt) {
    activityRows.push({
      id: `dispatched-${assignment.id}`,
      orderNumber: assignment.order?.orderNumber || `Order #${assignment.orderId}`,
      eventType: "dispatched",
      timestamp: assignment.dispatchedAt,
      tractorId: assignment.tractorId,
      trailerId: assignment.trailerId,
      isActive: Boolean(assignment.isActive),
    });
  }

  if (assignment?.unassignedAt) {
    activityRows.push({
      id: `unassigned-${assignment.id}`,
      orderNumber: assignment.order?.orderNumber || `Order #${assignment.orderId}`,
      eventType: "unassigned",
      timestamp: assignment.unassignedAt,
      tractorId: assignment.tractorId,
      trailerId: assignment.trailerId,
      isActive: Boolean(assignment.isActive),
    });
  }

  activityRows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const columns: Column<LoadActivityRow>[] = [
    {
      key: "orderNumber",
      title: "Order",
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{String(value)}</span>,
    },
    {
      key: "eventType",
      title: "Event",
      sortable: true,
      filterable: true,
      render: (value) => {
        const eventType = value as LoadActivityRow["eventType"];
        return <Badge className={eventTone[eventType]}>{eventType.toUpperCase()}</Badge>;
      },
    },
    {
      key: "timestamp",
      title: "Time",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{formatDateTime(value as string | Date)}</span>,
    },
    {
      key: "tractorId",
      title: "Equipment",
      render: (_value, row) => (
        <div className="text-sm">
          <p className="font-mono">Tractor: {row.tractorId ?? "—"}</p>
          <p className="font-mono text-muted-foreground">Trailer: {row.trailerId ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "isActive",
      title: "Current",
      sortable: true,
      filterable: true,
      getFilterValue: (row) => (row.isActive ? "Active" : "Inactive"),
      render: (value) =>
        value ? (
          <Badge className="border-apollo-cyan-200 bg-apollo-cyan-100 text-apollo-cyan-700">Active</Badge>
        ) : (
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Inactive</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current Assignment</p>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-mono text-lg font-semibold text-foreground">
            {assignment?.order?.orderNumber || (assignment ? `Order #${assignment.orderId}` : "None")}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Activity Events</p>
            <ArrowsClockwise className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{activityRows.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Last Change</p>
            <Clock className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-sm text-foreground">{formatDateTime(activityRows[0]?.timestamp)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <DataTable
          data={activityRows}
          columns={columns}
          searchPlaceholder="Search order number or event type..."
          emptyState={{
            icon: <Truck className="h-full w-full" />,
            title: "No load activity yet",
            description: "Assignment and dispatch events for this driver will appear here.",
          }}
          defaultPageSize={5}
          defaultPageSizeOptions={[5, 10, 20]}
        />
      </Card>
    </div>
  );
}
