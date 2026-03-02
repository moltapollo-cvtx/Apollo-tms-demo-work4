import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Driver,
  DriverWithDetails,
  NewDriver,
  DriverFilters,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// Query keys
export const driverKeys = {
  all: ["drivers"] as const,
  lists: () => [...driverKeys.all, "list"] as const,
  list: (filters: DriverFilters = {}) => [...driverKeys.lists(), filters] as const,
  details: () => [...driverKeys.all, "detail"] as const,
  detail: (id: number, include: string[] = []) =>
    [...driverKeys.details(), id, include] as const,
};

// API functions
async function fetchDrivers(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & DriverFilters = {}): Promise<PaginatedResponse<DriverWithDetails>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.include?.length) searchParams.set("include", params.include.join(","));
  if (params.status?.length) searchParams.set("status", params.status.join(","));
  if (params.available !== undefined) searchParams.set("available", params.available.toString());
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/drivers?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch drivers");
  }

  return response.json();
}

async function fetchDriver(
  id: number,
  include: string[] = []
): Promise<ApiResponse<DriverWithDetails>> {
  const searchParams = new URLSearchParams();
  if (include.length) searchParams.set("include", include.join(","));

  const response = await fetch(`/api/drivers/${id}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch driver");
  }

  return response.json();
}

async function createDriver(data: NewDriver): Promise<ApiResponse<Driver>> {
  const response = await fetch("/api/drivers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create driver");
  }

  return response.json();
}

async function updateDriver(
  id: number,
  data: Partial<Driver>
): Promise<ApiResponse<Driver>> {
  const response = await fetch(`/api/drivers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update driver");
  }

  return response.json();
}

async function deleteDriver(id: number): Promise<ApiResponse<Driver>> {
  const response = await fetch(`/api/drivers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete driver");
  }

  return response.json();
}

// Hooks
export function useDrivers(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & DriverFilters = {}) {
  return useQuery({
    queryKey: driverKeys.list(params),
    queryFn: () => fetchDrivers(params),
  });
}

export function useDriver(id: number, include: string[] = []) {
  return useQuery({
    queryKey: driverKeys.detail(id, include),
    queryFn: () => fetchDriver(id, include),
    enabled: !!id,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: driverKeys.list({ available: true }),
    queryFn: () => fetchDrivers({ available: true }),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      // Invalidate and refetch driver lists
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Driver>) =>
      updateDriver(id, data),
    onSuccess: (_data, _variables) => {
      // Invalidate and refetch driver lists
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      // Invalidate and refetch the specific driver
      queryClient.invalidateQueries({
        queryKey: driverKeys.details(),
      });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      // Invalidate and refetch driver lists
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
  });
}