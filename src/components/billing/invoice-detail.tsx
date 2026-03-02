"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  User,
  Calendar,
  CurrencyDollar,
  PaperPlaneTilt,
  CheckCircle,
  X,
  Download,
  Printer,
  CreditCard,
  Warning,
  ClockCounterClockwise,
  Phone,
  Envelope,
  Package,
  Truck,
  FileText,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SimpleModal as Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useInvoice, useUpdateInvoice, type Invoice } from "@/lib/hooks/api/use-billing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const INVOICE_STATUSES = [
  {
    value: "draft",
    label: "Draft",
    icon: ClockCounterClockwise,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-500"
  },
  {
    value: "sent",
    label: "Sent",
    icon: PaperPlaneTilt,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500"
  },
  {
    value: "paid",
    label: "Paid",
    icon: CheckCircle,
    color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
    dotColor: "bg-apollo-cyan-500"
  },
  {
    value: "overdue",
    label: "Overdue",
    icon: Warning,
    color: "bg-red-100 text-red-700 border-red-200",
    dotColor: "bg-red-500"
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: X,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dotColor: "bg-gray-500"
  },
];

interface InvoiceDetailProps {
  invoiceId: number;
  className?: string;
}

interface PaymentModalData {
  amount: string;
  paymentDate: string;
  notes: string;
}

export function InvoiceDetail({ invoiceId, className }: InvoiceDetailProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentModalData>({
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const { toast } = useToast();
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const updateMutation = useUpdateInvoice();

  const getStatusConfig = (status: string) => {
    return INVOICE_STATUSES.find(s => s.value === status) || INVOICE_STATUSES[0];
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "paid") return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleStatusChange = async (newStatus: Invoice["status"]) => {
    if (!invoice) return;

    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        status: newStatus,
      });
      toast({ title: "Invoice status updated successfully" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!invoice || !paymentData.amount) return;

    const paymentAmount = parseFloat(paymentData.amount);
    const currentBalance = parseFloat(invoice.balanceAmount.toString());
    const newPaidAmount = parseFloat(invoice.paidAmount.toString()) + paymentAmount;
    const newBalance = Math.max(0, currentBalance - paymentAmount);
    const newStatus: Invoice["status"] = newBalance === 0 ? "paid" : invoice.status;

    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        paidAmount: newPaidAmount,
        balanceAmount: newBalance,
        status: newStatus,
        ...(newStatus === "paid" && { paidAt: new Date().toISOString() }),
      });

      toast({ title: "Payment recorded successfully" });
      setShowPaymentModal(false);
      setPaymentData({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handleVoid = async () => {
    if (!invoice) return;

    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        status: "cancelled",
      });
      toast({ title: "Invoice voided successfully" });
      setShowVoidModal(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to void invoice",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded-xl" />
              <div className="h-48 bg-muted rounded-xl" />
            </div>
            <div className="h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <Warning className="size-12 text-destructive mx-auto mb-4" weight="light" />
          <p className="text-lg font-medium">Invoice not found</p>
          <p className="text-muted-foreground">The requested invoice could not be loaded.</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;
  const daysOverdue = getDaysOverdue(invoice.dueDate || null, invoice.status);
  const isOverdue = daysOverdue > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Receipt className="size-6 text-primary" weight="light" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Invoice {invoice.invoiceNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(invoice.createdAt)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium",
            statusConfig.color
          )}>
            <div className={cn("size-2 rounded-full", statusConfig.dotColor)} />
            <StatusIcon className="size-4" weight="bold" />
            <span>{statusConfig.label}</span>
            {isOverdue && (
              <span className="font-mono text-red-600 font-medium">
                ({daysOverdue} day{daysOverdue === 1 ? "" : "s"} overdue)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" weight="light" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="size-4" weight="light" />
            Print
          </Button>
          {invoice.status === "draft" && (
            <Button
              onClick={() => handleStatusChange("sent")}
              disabled={updateMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <PaperPlaneTilt className="size-4" weight="bold" />
              Send Invoice
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button
              onClick={() => {
                setPaymentData({ ...paymentData, amount: invoice.balanceAmount.toString() });
                setShowPaymentModal(true);
              }}
              size="sm"
              className="gap-2"
            >
              <CreditCard className="size-4" weight="bold" />
              Record Payment
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button
              onClick={() => setShowVoidModal(true)}
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <X className="size-4" weight="bold" />
              Void
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="size-5 text-primary" weight="light" />
              <h2 className="text-lg font-semibold">Customer Information</h2>
            </div>

            {invoice.customer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{invoice.customer.name}</p>
                      {invoice.customer.code && (
                        <p className="text-sm text-muted-foreground font-mono">
                          Code: {invoice.customer.code}
                        </p>
                      )}
                    </div>

                    {invoice.customer.address && (
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <div className="text-sm">
                          <p>{invoice.customer.address}</p>
                          {(invoice.customer.city || invoice.customer.state) && (
                            <p>
                              {invoice.customer.city}
                              {invoice.customer.city && invoice.customer.state && ", "}
                              {invoice.customer.state} {invoice.customer.zipCode}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {invoice.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" weight="light" />
                      <span className="text-sm">{invoice.customer.phone}</span>
                    </div>
                  )}

                  {invoice.customer.email && (
                    <div className="flex items-center gap-2">
                      <Envelope className="size-4 text-muted-foreground" weight="light" />
                      <span className="text-sm">{invoice.customer.email}</span>
                    </div>
                  )}

                  {invoice.customer.paymentTerms && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p className="text-sm font-medium">{invoice.customer.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No customer information available</p>
            )}
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-5 text-primary" weight="light" />
              <h2 className="text-lg font-semibold">Line Items</h2>
            </div>

            <div className="space-y-4">
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                <div className="space-y-3">
                  {invoice.lineItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.order ? (
                            <div className="flex items-center gap-2">
                              <Truck className="size-4 text-muted-foreground" weight="light" />
                              <Badge variant="secondary" className="text-xs font-mono">
                                {item.order.orderNumber}
                              </Badge>
                            </div>
                          ) : (
                            <Package className="size-4 text-muted-foreground" weight="light" />
                          )}
                        </div>
                        <p className="font-medium text-sm">{item.description}</p>
                        {item.order?.commodity && (
                          <p className="text-xs text-muted-foreground">
                            {item.order.commodity}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center min-w-0">
                          <p className="text-muted-foreground text-xs">Qty</p>
                          <p className="font-mono">{item.quantity}</p>
                        </div>
                        <div className="text-center min-w-0">
                          <p className="text-muted-foreground text-xs">Rate</p>
                          <p className="font-mono">{formatCurrency(item.rate)}</p>
                        </div>
                        <div className="text-right min-w-0">
                          <p className="text-muted-foreground text-xs">Amount</p>
                          <p className="font-mono font-medium">{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="size-8 mx-auto mb-2 opacity-50" weight="light" />
                  <p className="text-sm">No line items</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CurrencyDollar className="size-5 text-primary" weight="light" />
              <h2 className="text-lg font-semibold">Payment Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {parseFloat(invoice.taxAmount.toString()) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-mono">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between font-medium">
                <span>Total:</span>
                <span className="font-mono text-lg">{formatCurrency(invoice.totalAmount)}</span>
              </div>

              {parseFloat(invoice.paidAmount.toString()) > 0 && (
                <div className="flex items-center justify-between text-sm text-apollo-cyan-600">
                  <span>Paid:</span>
                  <span className="font-mono">-{formatCurrency(invoice.paidAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between font-medium">
                <span>Balance Due:</span>
                <span className={cn(
                  "font-mono text-lg",
                  parseFloat(invoice.balanceAmount.toString()) === 0
                    ? "text-apollo-cyan-600"
                    : "text-orange-600"
                )}>
                  {formatCurrency(invoice.balanceAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Invoice Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5 text-primary" weight="light" />
              <h2 className="text-lg font-semibold">Invoice Details</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="text-sm font-medium">{formatDate(invoice.invoiceDate)}</p>
              </div>

              {invoice.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={cn(
                    "text-sm font-medium",
                    isOverdue && "text-red-600"
                  )}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}

              {invoice.sentAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-sm font-medium">{formatDate(invoice.sentAt)}</p>
                </div>
              )}

              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-sm font-medium text-apollo-cyan-600">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}

              {invoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}

              {invoice.terms && (
                <div>
                  <p className="text-sm text-muted-foreground">Terms</p>
                  <p className="text-sm">{invoice.terms}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Payment Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 text-muted-foreground -translate-y-1/2">$</span>
              <Input
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding balance: {formatCurrency(invoice.balanceAmount)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Payment Date</label>
            <Input
              type="date"
              value={paymentData.paymentDate}
              onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Input
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder="Payment reference or notes"
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!paymentData.amount || updateMutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="size-4" weight="bold" />
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Void Confirmation Modal */}
      <Modal
        isOpen={showVoidModal}
        onClose={() => setShowVoidModal(false)}
        title="Void Invoice"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Warning className="size-5 text-red-500 mt-0.5" weight="light" />
            <div>
              <p className="text-sm font-medium">Are you sure you want to void this invoice?</p>
              <p className="text-sm text-muted-foreground mt-1">
                This action cannot be undone. The invoice will be marked as cancelled.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowVoidModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVoid}
              disabled={updateMutation.isPending}
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <X className="size-4" weight="bold" />
              Void Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
