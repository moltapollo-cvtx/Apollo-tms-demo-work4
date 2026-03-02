"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface ChargeCode {
  id: number;
  code: string;
  description: string;
  category?: string;
  defaultRate?: number;
  rateType?: string;
  glAccount?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  terms?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    paymentTerms?: string;
  };
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: number;
  orderId?: number;
  chargeId?: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  order?: {
    id: number;
    orderNumber: string;
    commodity?: string;
  };
}

export interface Settlement {
  id: number;
  driverId?: number;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "pending" | "paid" | "cancelled";
  grossPay: number;
  deductions: number;
  netPay: number;
  notes?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId?: string;
    phone?: string;
    email?: string;
    payStructure?: Record<string, unknown>;
  };
  items?: SettlementItem[];
}

export interface SettlementItem {
  id: number;
  orderId?: number;
  chargeId?: number;
  description: string;
  type: "pay" | "deduction";
  quantity: number;
  rate?: number;
  amount: number;
  order?: {
    id: number;
    orderNumber: string;
    commodity?: string;
  };
}

export interface ARAgingData {
  summary: {
    current: number;
    past30: number;
    past60: number;
    past90: number;
    past120: number;
    totalOutstanding: number;
    invoiceCount: number;
  };
  customerBreakdown: Array<{
    customerId: number;
    customerName: string;
    customerCode?: string;
    current: number;
    past30: number;
    past60: number;
    past90: number;
    past120: number;
    totalOutstanding: number;
    invoiceCount: number;
  }>;
  overdueInvoices: Array<{
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    balanceAmount: number;
    daysOverdue: number;
    customer?: {
      id: number;
      name: string;
      code?: string;
    };
  }>;
}

// Charge Codes Hooks
export const useChargeCodes = (params?: {
  search?: string;
  category?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.category) queryParams.set("category", params.category);
  if (params?.isActive !== undefined) queryParams.set("isActive", params.isActive.toString());
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());

  return useQuery({
    queryKey: ["charge-codes", params],
    queryFn: async () => {
      const response = await fetch(`/api/billing/charge-codes?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch charge codes");
      return response.json() as Promise<ChargeCode[]>;
    },
  });
};

export const useChargeCode = (id: number) => {
  return useQuery({
    queryKey: ["charge-codes", id],
    queryFn: async () => {
      const response = await fetch(`/api/billing/charge-codes/${id}`);
      if (!response.ok) throw new Error("Failed to fetch charge code");
      return response.json() as Promise<ChargeCode>;
    },
    enabled: !!id,
  });
};

export const useCreateChargeCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ChargeCode>) => {
      const response = await fetch("/api/billing/charge-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create charge code");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-codes"] });
    },
  });
};

export const useUpdateChargeCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChargeCode> & { id: number }) => {
      const response = await fetch(`/api/billing/charge-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update charge code");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["charge-codes"] });
      queryClient.invalidateQueries({ queryKey: ["charge-codes", variables.id] });
    },
  });
};

export const useDeleteChargeCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/billing/charge-codes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete charge code");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-codes"] });
    },
  });
};

// Invoices Hooks
export const useInvoices = (params?: {
  search?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.customerId) queryParams.set("customerId", params.customerId);
  if (params?.startDate) queryParams.set("startDate", params.startDate);
  if (params?.endDate) queryParams.set("endDate", params.endDate);
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());

  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const response = await fetch(`/api/billing/invoices?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      return {
        data: data.data as Invoice[],
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      };
    },
  });
};

export const useInvoice = (id: number) => {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const response = await fetch(`/api/billing/invoices/${id}`);
      if (!response.ok) throw new Error("Failed to fetch invoice");
      return response.json() as Promise<Invoice>;
    },
    enabled: !!id,
  });
};

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      orderIds: number[];
      customerId?: number;
      dueDate?: string;
      notes?: string;
      terms?: string;
    }) => {
      const response = await fetch("/api/billing/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to generate invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invoice> & { id: number }) => {
      const response = await fetch(`/api/billing/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update invoice");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] });
    },
  });
};

// Settlements Hooks
export const useSettlements = (params?: {
  search?: string;
  status?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.driverId) queryParams.set("driverId", params.driverId);
  if (params?.startDate) queryParams.set("startDate", params.startDate);
  if (params?.endDate) queryParams.set("endDate", params.endDate);
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());

  return useQuery({
    queryKey: ["settlements", params],
    queryFn: async () => {
      const response = await fetch(`/api/billing/settlements?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch settlements");
      const data = await response.json();
      return {
        data: data.data as Settlement[],
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      };
    },
  });
};

export const useSettlement = (id: number) => {
  return useQuery({
    queryKey: ["settlements", id],
    queryFn: async () => {
      const response = await fetch(`/api/billing/settlements/${id}`);
      if (!response.ok) throw new Error("Failed to fetch settlement");
      return response.json() as Promise<Settlement>;
    },
    enabled: !!id,
  });
};

export const useCreateSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Settlement>) => {
      const response = await fetch("/api/billing/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create settlement");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
};

export const useUpdateSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Settlement> & { id: number }) => {
      const response = await fetch(`/api/billing/settlements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settlement");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      queryClient.invalidateQueries({ queryKey: ["settlements", variables.id] });
    },
  });
};

// AR Aging Hook
export const useARAgingData = () => {
  return useQuery({
    queryKey: ["ar-aging"],
    queryFn: async () => {
      const response = await fetch("/api/billing/ar-aging");
      if (!response.ok) throw new Error("Failed to fetch AR aging data");
      return response.json() as Promise<ARAgingData>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
