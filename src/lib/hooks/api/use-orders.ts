import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Order,
  OrderWithDetails,
  NewOrder,
  OrderFilters,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// Query keys
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters = {}) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number, include: string[] = []) =>
    [...orderKeys.details(), id, include] as const,
};

// API functions
async function fetchOrders(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & OrderFilters = {}): Promise<PaginatedResponse<OrderWithDetails>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.include?.length) searchParams.set("include", params.include.join(","));
  if (params.status?.length) searchParams.set("status", params.status.join(","));
  if (params.customerId) searchParams.set("customerId", params.customerId.toString());
  if (params.equipmentType?.length) searchParams.set("equipmentType", params.equipmentType.join(","));
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/orders?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }

  return response.json();
}

async function fetchOrder(
  id: number,
  include: string[] = []
): Promise<ApiResponse<OrderWithDetails>> {
  const searchParams = new URLSearchParams();
  if (include.length) searchParams.set("include", include.join(","));

  const response = await fetch(`/api/orders/${id}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }

  return response.json();
}

async function createOrder(
  data: NewOrder & Record<string, unknown>,
): Promise<ApiResponse<Order>> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create order");
  }

  return response.json();
}

async function updateOrder(
  id: number,
  data: Partial<Order>
): Promise<ApiResponse<Order>> {
  const response = await fetch(`/api/orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update order");
  }

  return response.json();
}

async function deleteOrder(id: number): Promise<ApiResponse<Order>> {
  const response = await fetch(`/api/orders/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete order");
  }

  return response.json();
}

// Hooks
export function useOrders(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => fetchOrders(params),
  });
}

export function useOrder(id: number, include: string[] = []) {
  return useQuery({
    queryKey: orderKeys.detail(id, include),
    queryFn: () => fetchOrder(id, include),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate and refetch order lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Order>) =>
      updateOrder(id, data),
    onSuccess: (_data, _variables) => {
      // Invalidate and refetch order lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Invalidate and refetch the specific order
      queryClient.invalidateQueries({
        queryKey: orderKeys.details(),
      });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      // Invalidate and refetch order lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
