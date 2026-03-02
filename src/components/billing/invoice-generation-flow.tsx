"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Package,
  User,
  Calculator,
  Receipt,
  Truck,
  MapPin,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { useOrders } from "@/lib/hooks/api/use-orders";
import { useCustomers } from "@/lib/hooks/api/use-customers";
import { useGenerateInvoice } from "@/lib/hooks/api/use-billing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { OrderWithDetails } from "@/types";

interface InvoiceGenerationFlowProps {
  className?: string;
}

interface SelectedLoad {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  totalRevenue: number;
  origin: string;
  destination: string;
  deliveredAt?: string;
  commodity?: string;
}

type Step = "select" | "review" | "generate" | "complete";

const STEPS = [
  { key: "select", label: "Select Loads", icon: Package },
  { key: "review", label: "Review Charges", icon: Calculator },
  { key: "generate", label: "Generate Invoice", icon: Receipt },
  { key: "complete", label: "Complete", icon: CheckCircle },
];

export function InvoiceGenerationFlow({ className }: InvoiceGenerationFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [selectedLoads, setSelectedLoads] = useState<SelectedLoad[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState({
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: "",
    terms: "Net 30",
  });
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<number | null>(null);

  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    status: ["delivered"],
    pageSize: 100,
  });

  const { data: customers } = useCustomers();
  const generateInvoiceMutation = useGenerateInvoice();

  // Filter orders that are delivered and not already invoiced (simplified logic)
  const availableOrders = (ordersData?.data || []).filter((order) =>
    order.status === "delivered" && order.totalRevenue && Number(order.totalRevenue) > 0
  );

  const handleLoadSelection = (order: OrderWithDetails, selected: boolean) => {
    if (selected) {
      const load: SelectedLoad = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customer?.name || "",
        totalRevenue: parseFloat(order.totalRevenue?.toString() || "0"),
        origin: order.stops?.find((stop) => stop.type === "pickup")?.city || "",
        destination: order.stops?.find((stop) => stop.type === "delivery")?.city || "",
        commodity: order.commodity || undefined,
      };

      setSelectedLoads([...selectedLoads, load]);

      // Auto-select customer if first load
      if (selectedLoads.length === 0) {
        setSelectedCustomerId(order.customerId);
      }
    } else {
      setSelectedLoads(selectedLoads.filter(load => load.id !== order.id));

      // Reset customer selection if no loads left
      if (selectedLoads.length === 1) {
        setSelectedCustomerId(null);
      }
    }
  };

  const removeSelectedLoad = (loadId: number) => {
    setSelectedLoads((prev) => {
      const next = prev.filter((load) => load.id !== loadId);
      if (next.length === 0) {
        setSelectedCustomerId(null);
      }
      return next;
    });
  };

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    // Remove loads that don't belong to the selected customer
    setSelectedLoads(selectedLoads.filter(load => load.customerId === customerId));
  };

  const canProceedToReview = () => {
    return selectedLoads.length > 0 && selectedCustomerId;
  };

  const handleGenerateInvoice = async () => {
    if (!selectedCustomerId || selectedLoads.length === 0) return;

    try {
      const result = await generateInvoiceMutation.mutateAsync({
        orderIds: selectedLoads.map(load => load.id),
        customerId: selectedCustomerId,
        dueDate: invoiceSettings.dueDate,
        notes: invoiceSettings.notes,
        terms: invoiceSettings.terms,
      });

      setGeneratedInvoiceId(result.id);
      setCurrentStep("complete");
      toast({ title: "Invoice generated successfully!" });
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : "Failed to generate invoice";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalAmount = selectedLoads.reduce((sum, load) => sum + load.totalRevenue, 0);

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);

  const loadColumns: Column<OrderWithDetails>[] = [
    {
      key: "orderNumber",
      title: "Load #",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-muted-foreground" weight="light" />
          <span className="font-mono font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" weight="light" />
          <span className="text-sm">{row.customer?.name}</span>
        </div>
      ),
    },
    {
      key: "route",
      title: "Route",
      render: (_, row) => {
        const pickup = row.stops?.find((stop) => stop.type === "pickup");
        const delivery = row.stops?.find((stop) => stop.type === "delivery");
        return (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground" weight="light" />
            <span>
              {pickup?.city || "—"} → {delivery?.city || "—"}
            </span>
          </div>
        );
      },
    },
    {
      key: "commodity",
      title: "Commodity",
      render: (value: string) => (
        <span className="text-sm">{value || "—"}</span>
      ),
    },
    {
      key: "totalRevenue",
      title: "Revenue",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono font-medium">{formatCurrency(value)}</span>
      ),
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generate Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Create invoices from delivered loads
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="size-4" weight="light" />
          Back
        </Button>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center size-10 rounded-full border-2 transition-all",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-apollo-cyan-500 bg-apollo-cyan-500 text-white",
                    isUpcoming && "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    <StepIcon className="size-5" weight={isActive ? "bold" : "light"} />
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-apollo-cyan-700",
                      isUpcoming && "text-muted-foreground"
                    )}>
                      {step.label}
                    </p>
                  </div>
                </div>

                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-16 ml-6 mr-6 transition-all",
                    index < currentStepIndex ? "bg-apollo-cyan-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Loads */}
        {currentStep === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Customer Filter */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="size-5 text-primary" weight="light" />
                <h2 className="text-lg font-semibold">Customer Selection</h2>
              </div>
              <Select
                value={selectedCustomerId?.toString() || ""}
                onValueChange={(value) => handleCustomerChange(parseInt(Array.isArray(value) ? value[0] : value))}
                placeholder="Select a customer"
                options={customers?.data?.map(customer => ({
                  value: customer.id.toString(),
                  label: `${customer.name}${customer.code ? ` (${customer.code})` : ""}`,
                })) || []}
                className="max-w-md"
              />
              {selectedCustomerId && (
                <p className="text-sm text-muted-foreground mt-2">
                  Only loads from the selected customer will be shown
                </p>
              )}
            </Card>

            {/* Available Loads */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-primary" weight="light" />
                  <h2 className="text-lg font-semibold">Available Loads</h2>
                </div>
                <Badge variant="secondary">
                  <span className="font-mono">{selectedLoads.length}</span> selected
                </Badge>
              </div>

              <DataTable
                data={selectedCustomerId
                  ? availableOrders.filter(order => order.customerId === selectedCustomerId)
                  : []
                }
                columns={loadColumns}
                loading={ordersLoading}
                emptyMessage={
                  selectedCustomerId
                    ? "No delivered loads found for this customer"
                    : "Please select a customer first"
                }
                emptyState={{
                  title: selectedCustomerId ? "No available loads" : "Select a customer first",
                  description: selectedCustomerId
                    ? "This customer has no delivered, billable loads right now."
                    : "Choose a customer to load eligible orders.",
                }}
                selection={{
                  selectedRows: selectedLoads.map(load => load.id.toString()),
                  onSelectionChange: (selectedIds) => {
                    const currentSelectedIds = new Set(selectedIds);
                    const previousSelectedIds = new Set(selectedLoads.map(load => load.id.toString()));

                    // Handle newly selected
                    selectedIds.forEach(id => {
                      if (!previousSelectedIds.has(id)) {
                        const order = availableOrders.find(o => o.id.toString() === id);
                        if (order) handleLoadSelection(order, true);
                      }
                    });

                    // Handle newly unselected
                    Array.from(previousSelectedIds).forEach(id => {
                      if (!currentSelectedIds.has(id)) {
                        const order = availableOrders.find(o => o.id.toString() === id);
                        if (order) handleLoadSelection(order, false);
                      }
                    });
                  },
                  getRowId: (row) => row.id.toString(),
                }}
              />
            </Card>

            {/* Selected Loads Summary */}
            {selectedLoads.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="size-5 text-apollo-cyan-500" weight="light" />
                  <h2 className="text-lg font-semibold">Selected Loads</h2>
                </div>

                <div className="space-y-3 mb-4">
                  {selectedLoads.map((load, index) => (
                    <motion.div
                      key={load.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="size-4 text-muted-foreground" weight="light" />
                        <div>
                          <p className="font-mono font-medium text-sm">{load.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {load.origin} → {load.destination}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{formatCurrency(load.totalRevenue)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedLoad(load.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-mono text-lg font-bold text-apollo-cyan-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep("review")}
                disabled={!canProceedToReview()}
                className="gap-2"
              >
                Continue to Review
                <ArrowRight className="size-4" weight="bold" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Review Charges */}
        {currentStep === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invoice Settings */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="size-5 text-primary" weight="light" />
                  <h2 className="text-lg font-semibold">Invoice Settings</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={invoiceSettings.dueDate}
                      onChange={(e) => setInvoiceSettings({
                        ...invoiceSettings,
                        dueDate: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Payment Terms</label>
                    <Select
                      value={invoiceSettings.terms}
                      onValueChange={(value) => setInvoiceSettings({
                        ...invoiceSettings,
                        terms: Array.isArray(value) ? value[0] : value
                      })}
                      options={[
                        { value: "Net 15", label: "Net 15" },
                        { value: "Net 30", label: "Net 30" },
                        { value: "Net 45", label: "Net 45" },
                        { value: "Net 60", label: "Net 60" },
                        { value: "Due on Receipt", label: "Due on Receipt" },
                      ]}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Input
                      value={invoiceSettings.notes}
                      onChange={(e) => setInvoiceSettings({
                        ...invoiceSettings,
                        notes: e.target.value
                      })}
                      placeholder="Additional notes for the invoice"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>

              {/* Invoice Preview */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="size-5 text-primary" weight="light" />
                  <h2 className="text-lg font-semibold">Invoice Summary</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    {selectedLoads.map((load, _index) => (
                      <div key={load.id} className="flex justify-between text-sm">
                        <span>Freight - {load.orderNumber}</span>
                        <span className="font-mono">{formatCurrency(load.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(totalAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax:</span>
                    <span className="font-mono">$0.00</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="font-mono text-apollo-cyan-600">{formatCurrency(totalAmount)}</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Due Date: {formatDate(invoiceSettings.dueDate)}</p>
                    <p>Terms: {invoiceSettings.terms}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("select")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" weight="light" />
                Back to Selection
              </Button>
              <Button
                onClick={() => setCurrentStep("generate")}
                className="gap-2"
              >
                Continue to Generate
                <ArrowRight className="size-4" weight="bold" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generate Invoice */}
        {currentStep === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="p-8 text-center">
              <Receipt className="size-16 text-primary mx-auto mb-4" weight="light" />
              <h2 className="text-2xl font-semibold mb-2">Ready to Generate Invoice</h2>
              <p className="text-muted-foreground mb-6">
                Review the details below and generate your invoice
              </p>

              <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">
                      {customers?.data?.find(c => c.id === selectedCustomerId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loads:</span>
                    <span className="font-mono font-medium">{selectedLoads.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-mono font-medium text-apollo-cyan-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span className="font-medium">{formatDate(invoiceSettings.dueDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("review")}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" weight="light" />
                  Back to Review
                </Button>
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generateInvoiceMutation.isPending}
                  className="gap-2"
                >
                  {generateInvoiceMutation.isPending ? (
                    <>
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Receipt className="size-4" weight="bold" />
                      Generate Invoice
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Complete */}
        {currentStep === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="p-8 text-center">
              <CheckCircle className="size-16 text-apollo-cyan-500 mx-auto mb-4" weight="fill" />
              <h2 className="text-2xl font-semibold mb-2">Invoice Generated Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your invoice has been created and is ready to send
              </p>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/billing/invoices/${generatedInvoiceId}`)}
                  className="gap-2"
                >
                  <Receipt className="size-4" weight="light" />
                  View Invoice
                </Button>
                <Button
                  onClick={() => router.push("/billing/invoices")}
                  className="gap-2"
                >
                  <ArrowRight className="size-4" weight="bold" />
                  Back to Invoices
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
