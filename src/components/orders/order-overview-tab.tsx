"use client";

import {
  MapPin,
  Calendar,
  Package,
  Truck,
  User,
  Phone,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { OrderWithDetails } from "@/types";

interface OrderOverviewTabProps {
  order: OrderWithDetails;
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
};

const getPriorityBadge = (priority: string | null | undefined) => {
  switch (priority) {
    case "urgent":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <Warning className="h-3 w-3 mr-1" />
          Urgent
        </Badge>
      );
    case "high":
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          High Priority
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          Normal
        </Badge>
      );
  }
};

export default function OrderOverviewTab({ order }: OrderOverviewTabProps) {
  const pickup = order.stops?.find((stop) => stop.type === "pickup");
  const delivery = order.stops?.find((stop) => stop.type === "delivery");
  const assignment = order.assignments?.[0]; // Get current assignment

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Order Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Order Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Order Details</h3>
            {getPriorityBadge(order.priorityLevel)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Customer
                </label>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {order.customer?.name || "Unknown Customer"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Customer Reference
                </label>
                <p className="text-sm text-foreground mt-1 font-mono">
                  {order.customerReferenceNumber || "—"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Revenue Code
                </label>
                <p className="text-sm text-foreground mt-1 font-mono">
                  {order.revenueCode || "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Equipment Type
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground capitalize">
                    {order.equipmentType?.replace("_", " ") || "—"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Commodity
                </label>
                <p className="text-sm text-foreground mt-1">
                  {order.commodity || "—"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Created
                </label>
                <p className="text-sm text-foreground mt-1 font-mono">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Notes
                </label>
                <p className="text-sm text-foreground mt-1 leading-relaxed">
                  {order.notes}
                </p>
              </div>
            </>
          )}

          {order.specialRequirements && (
            <>
              <Separator className="my-4" />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Special Requirements
                </label>
                <p className="text-sm text-foreground mt-1 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {order.specialRequirements}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Route Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Route</h3>
          </div>

          <div className="space-y-4">
            {pickup && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-apollo-cyan-500 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-border"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-apollo-cyan-600 bg-apollo-cyan-100 px-2 py-0.5 rounded-full">
                      PICKUP
                    </span>
                    {pickup.isCompleted && (
                      <CheckCircle className="h-4 w-4 text-apollo-cyan-600" weight="fill" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground">
                    {pickup.city}, {pickup.state} {pickup.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{pickup.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(pickup.scheduledDate)}
                    </div>
                    {pickup.contactName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {pickup.contactName}
                      </div>
                    )}
                    {pickup.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {pickup.contactPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {delivery && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      DELIVERY
                    </span>
                    {delivery.isCompleted && (
                      <CheckCircle className="h-4 w-4 text-apollo-cyan-600" weight="fill" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground">
                    {delivery.city}, {delivery.state} {delivery.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{delivery.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(delivery.scheduledDate)}
                    </div>
                    {delivery.contactName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {delivery.contactName}
                      </div>
                    )}
                    {delivery.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {delivery.contactPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Freight Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Freight</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Weight
              </label>
              <p className="text-lg font-mono font-semibold text-foreground mt-1">
                {order.weight ? `${Number(order.weight).toLocaleString()} lbs` : "—"}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pieces
              </label>
              <p className="text-lg font-mono font-semibold text-foreground mt-1">
                {order.pieces ? order.pieces.toLocaleString() : "—"}
              </p>
            </div>

            {order.dimensions && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Dimensions
                </label>
                <p className="text-sm font-mono text-foreground mt-1">
                  {order.dimensions.length}{'"'} × {order.dimensions.width}{'"'} × {order.dimensions.height}{'"'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Financial Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Financial</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(order.totalRevenue ? Number(order.totalRevenue) : null)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(order.totalCost ? Number(order.totalCost) : null)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Margin</span>
              <div className="text-right">
                <span className="font-mono font-semibold text-apollo-cyan-600">
                  {formatCurrency(order.margin ? Number(order.margin) : null)}
                </span>
                {order.totalRevenue && order.margin && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {((Number(order.margin) / Number(order.totalRevenue)) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Assignment Details */}
        {assignment && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Assignment</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Assigned
                </label>
                <p className="text-sm text-foreground mt-1 font-mono">
                  {formatDate(assignment.assignedAt)}
                </p>
              </div>

              {assignment.dispatchedAt && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Dispatched
                  </label>
                  <p className="text-sm text-foreground mt-1 font-mono">
                    {formatDate(assignment.dispatchedAt)}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    Assigned
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}