import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  CustomerWithDetails,
  NewCustomer,
  CustomerFilters,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// Query keys
export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: CustomerFilters = {}) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: number, include: string[] = []) =>
    [...customerKeys.details(), id, include] as const,
};

// API functions
async function fetchCustomers(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & CustomerFilters = {}): Promise<PaginatedResponse<CustomerWithDetails>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.include?.length) searchParams.set("include", params.include.join(","));
  if (params.isActive !== undefined) searchParams.set("isActive", params.isActive.toString());
  if (params.state?.length) searchParams.set("state", params.state.join(","));
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/customers?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }

  return response.json();
}

async function fetchCustomer(
  id: number,
  include: string[] = []
): Promise<ApiResponse<CustomerWithDetails>> {
  const searchParams = new URLSearchParams();
  if (include.length) searchParams.set("include", include.join(","));

  const response = await fetch(`/api/customers/${id}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch customer");
  }

  return response.json();
}

async function createCustomer(data: NewCustomer): Promise<ApiResponse<Customer>> {
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create customer");
  }

  return response.json();
}

async function updateCustomer(
  id: number,
  data: Partial<Customer>
): Promise<ApiResponse<Customer>> {
  const response = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update customer");
  }

  return response.json();
}

async function deleteCustomer(id: number): Promise<ApiResponse<Customer>> {
  const response = await fetch(`/api/customers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete customer");
  }

  return response.json();
}

// Hooks
export function useCustomers(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => fetchCustomers(params),
  });
}

export function useCustomer(id: number, include: string[] = []) {
  return useQuery({
    queryKey: customerKeys.detail(id, include),
    queryFn: () => fetchCustomer(id, include),
    enabled: !!id,
  });
}

export function useActiveCustomers() {
  return useQuery({
    queryKey: customerKeys.list({ isActive: true }),
    queryFn: () => fetchCustomers({ isActive: true }),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Customer>) =>
      updateCustomer(id, data),
    onSuccess: (_data, _variables) => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      // Invalidate and refetch the specific customer
      queryClient.invalidateQueries({
        queryKey: customerKeys.details(),
      });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}