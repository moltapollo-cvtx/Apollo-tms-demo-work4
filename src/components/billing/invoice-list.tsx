"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  Eye,
  PaperPlaneTilt,
  X,
  CheckCircle,
  ClockCounterClockwise,
  Warning,
  Calendar,
  User,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useInvoices, useUpdateInvoice, type Invoice } from "@/lib/hooks/api/use-billing";
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
] as const satisfies ReadonlyArray<{
  value: Invoice["status"];
  label: string;
  icon: typeof ClockCounterClockwise;
  color: string;
  dotColor: string;
}>;

interface InvoiceListProps {
  className?: string;
}

export function InvoiceList({ className }: InvoiceListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: invoicesData, isLoading, error } = useInvoices({
    search: searchQuery,
    status: statusFilter || undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const updateInvoiceMutation = useUpdateInvoice();

  const _getStatusConfig = (status: string) => {
    return INVOICE_STATUSES.find(s => s.value === status) || INVOICE_STATUSES[0];
  };

  const isInvoiceStatus = (value: string): value is Invoice["status"] => {
    return INVOICE_STATUSES.some((status) => status.value === value);
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status === "paid" || !dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: Invoice["status"]) => {
    try {
      await updateInvoiceMutation.mutateAsync({
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

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      title: "Invoice #",
      sortable: true,
      render: (value: string, row: Invoice) => (
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground" weight="light" />
          <button
            onClick={() => router.push(`/billing/invoices/${row.id}`)}
            className="font-mono font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {value}
          </button>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      sortable: true,
      render: (_, row: Invoice) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" weight="light" />
          <div>
            <p className="font-medium text-sm">{row.customer?.name}</p>
            {row.customer?.code && (
              <p className="text-xs text-muted-foreground font-mono">{row.customer.code}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "invoiceDate",
      title: "Invoice Date",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" weight="light" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "dueDate",
      title: "Due Date",
      sortable: true,
      render: (value: string | null, row: Invoice) => {
        if (!value) return <span className="text-muted-foreground text-sm">—</span>;

        const daysOverdue = getDaysOverdue(value, row.status);
        const isOverdue = daysOverdue > 0 && row.status !== "paid";

        return (
          <div className="flex items-center gap-2">
            <Calendar className={cn(
              "size-4",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )} weight="light" />
            <div>
              <span className={cn(
                "text-sm",
                isOverdue && "text-red-600 font-medium"
              )}>
                {formatDate(value)}
              </span>
              {isOverdue && (
                <p className="font-mono text-xs text-red-600">
                  {daysOverdue} day{daysOverdue === 1 ? "" : "s"} overdue
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value: string, row: Invoice) => {
        return (
          <Select
            value={value}
            onValueChange={(newStatus) => {
              const parsedStatus = Array.isArray(newStatus) ? newStatus[0] : newStatus;
              if (isInvoiceStatus(parsedStatus)) {
                handleStatusChange(row, parsedStatus);
              }
            }}
            options={INVOICE_STATUSES.map(status => ({
              value: status.value,
              label: status.label,
            }))}
            size="sm"
          />
        );
      },
    },
    {
      key: "totalAmount",
      title: "Total",
      align: "right",
      sortable: true,
      render: (value: number | string) => (
        <div className="flex items-center justify-end gap-2">
          <CurrencyDollar className="size-4 text-muted-foreground" weight="light" />
          <span className="font-mono font-medium">
            {formatCurrency(value)}
          </span>
        </div>
      ),
    },
    {
      key: "balanceAmount",
      title: "Balance",
      align: "right",
      sortable: true,
      render: (value: number | string, row: Invoice) => {
        const balance = typeof value === "string" ? parseFloat(value) : value;
        const isPaid = balance === 0 || row.status === "paid";

        return (
          <div className="flex items-center justify-end gap-2">
            <div className={cn(
              "size-2 rounded-full",
              isPaid ? "bg-apollo-cyan-500" : "bg-orange-500"
            )} />
            <span className={cn(
              "font-mono font-medium text-sm",
              isPaid ? "text-apollo-cyan-700" : "text-orange-700"
            )}>
              {formatCurrency(balance)}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row: Invoice) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/billing/invoices/${row.id}`)}
            className="h-8 w-8 p-0"
          >
            <Eye className="size-4" weight="light" />
          </Button>
          {row.status === "draft" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange(row, "sent")}
              disabled={updateInvoiceMutation.isPending}
              className="h-8 w-8 p-0"
            >
              <PaperPlaneTilt className="size-4" weight="light" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Calculate summary statistics
  const summaryStats = invoicesData?.data.reduce(
    (acc, invoice) => {
      const total = parseFloat(invoice.totalAmount.toString());
      const balance = parseFloat(invoice.balanceAmount.toString());

      acc.totalInvoiced += total;
      acc.totalOutstanding += balance;

      if (invoice.status === "paid") {
        acc.totalPaid += total;
      }

      if (invoice.status === "overdue" ||
          (invoice.dueDate && getDaysOverdue(invoice.dueDate, invoice.status) > 0)) {
        acc.totalOverdue += balance;
      }

      return acc;
    },
    { totalInvoiced: 0, totalOutstanding: 0, totalPaid: 0, totalOverdue: 0 }
  ) || { totalInvoiced: 0, totalOutstanding: 0, totalPaid: 0, totalOverdue: 0 };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Invoices
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage customer invoices and track payments
          </p>
        </div>
        <Button onClick={() => router.push("/billing/invoices/generate")} className="gap-2">
          <Plus className="size-4" weight="bold" />
          Generate Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-lg font-mono font-bold text-foreground">
                {formatCurrency(summaryStats.totalInvoiced)}
              </p>
            </div>
            <Receipt className="size-8 text-blue-500 opacity-20" weight="fill" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-lg font-mono font-bold text-orange-600">
                {formatCurrency(summaryStats.totalOutstanding)}
              </p>
            </div>
            <ClockCounterClockwise className="size-8 text-orange-500 opacity-20" weight="fill" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-mono font-bold text-apollo-cyan-600">
                {formatCurrency(summaryStats.totalPaid)}
              </p>
            </div>
            <CheckCircle className="size-8 text-apollo-cyan-500 opacity-20" weight="fill" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-lg font-mono font-bold text-red-600">
                {formatCurrency(summaryStats.totalOverdue)}
              </p>
            </div>
            <Warning className="size-8 text-red-500 opacity-20" weight="fill" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Eye className="absolute left-3 top-1/2 size-4 text-muted-foreground -translate-y-1/2" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(Array.isArray(value) ? value[0] : value)}
          placeholder="All Status"
          options={[
            { value: "", label: "All Status" },
            ...INVOICE_STATUSES.map(status => ({
              value: status.value,
              label: status.label,
            })),
          ]}
          className="w-40"
        />
      </div>

      {/* Table */}
      <DataTable
        data={invoicesData?.data || []}
        columns={columns}
        loading={isLoading}
        error={error?.message}
        emptyMessage="No invoices found"
        pagination={{
          page: currentPage,
          pageSize: pageSize,
          total: invoicesData?.total || 0,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50, 100],
        }}
        onRowClick={(invoice) => router.push(`/billing/invoices/${invoice.id}`)}
        className="border-none"
      />
    </div>
  );
}
