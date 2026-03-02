import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Tractor,
  Trailer,
  TractorWithDetails,
  TrailerWithDetails,
  NewTractor,
  NewTrailer,
  EquipmentFilters,
  EquipmentType,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// Query keys
export const equipmentKeys = {
  all: ["equipment"] as const,
  tractors: () => [...equipmentKeys.all, "tractors"] as const,
  trailers: () => [...equipmentKeys.all, "trailers"] as const,
  tractorsList: () => [...equipmentKeys.tractors(), "list"] as const,
  tractorList: (filters: EquipmentFilters = {}) => [...equipmentKeys.tractorsList(), filters] as const,
  trilersList: () => [...equipmentKeys.trailers(), "list"] as const,
  trailerList: (filters: EquipmentFilters = {}) => [...equipmentKeys.trilersList(), filters] as const,
  tractorDetails: () => [...equipmentKeys.tractors(), "detail"] as const,
  tractorDetail: (id: number, include: string[] = []) =>
    [...equipmentKeys.tractorDetails(), id, include] as const,
  trailerDetails: () => [...equipmentKeys.trailers(), "detail"] as const,
  trailerDetail: (id: number, include: string[] = []) =>
    [...equipmentKeys.trailerDetails(), id, include] as const,
};

// Tractor API functions
async function fetchTractors(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & EquipmentFilters = {}): Promise<PaginatedResponse<TractorWithDetails>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.include?.length) searchParams.set("include", params.include.join(","));
  if (params.status?.length) searchParams.set("status", params.status.join(","));
  if (params.available !== undefined) searchParams.set("available", params.available.toString());
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/equipment/tractors?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tractors");
  }

  return response.json();
}

async function fetchTractor(
  id: number,
  include: string[] = []
): Promise<ApiResponse<TractorWithDetails>> {
  const searchParams = new URLSearchParams();
  if (include.length) searchParams.set("include", include.join(","));

  const response = await fetch(`/api/equipment/tractors/${id}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tractor");
  }

  return response.json();
}

async function createTractor(data: NewTractor): Promise<ApiResponse<Tractor>> {
  const response = await fetch("/api/equipment/tractors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create tractor");
  }

  return response.json();
}

async function updateTractor(
  id: number,
  data: Partial<Tractor>
): Promise<ApiResponse<Tractor>> {
  const response = await fetch(`/api/equipment/tractors/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update tractor");
  }

  return response.json();
}

async function deleteTractor(id: number): Promise<ApiResponse<Tractor>> {
  const response = await fetch(`/api/equipment/tractors/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete tractor");
  }

  return response.json();
}

// Trailer API functions
async function fetchTrailers(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & EquipmentFilters = {}): Promise<PaginatedResponse<TrailerWithDetails>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.include?.length) searchParams.set("include", params.include.join(","));
  if (params.status?.length) searchParams.set("status", params.status.join(","));
  if (params.equipmentType?.length) searchParams.set("equipmentType", params.equipmentType.join(","));
  if (params.available !== undefined) searchParams.set("available", params.available.toString());
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/equipment/trailers?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch trailers");
  }

  return response.json();
}

async function fetchTrailer(
  id: number,
  include: string[] = []
): Promise<ApiResponse<TrailerWithDetails>> {
  const searchParams = new URLSearchParams();
  if (include.length) searchParams.set("include", include.join(","));

  const response = await fetch(`/api/equipment/trailers/${id}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch trailer");
  }

  return response.json();
}

async function createTrailer(data: NewTrailer): Promise<ApiResponse<Trailer>> {
  const response = await fetch("/api/equipment/trailers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create trailer");
  }

  return response.json();
}

async function updateTrailer(
  id: number,
  data: Partial<Trailer>
): Promise<ApiResponse<Trailer>> {
  const response = await fetch(`/api/equipment/trailers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update trailer");
  }

  return response.json();
}

async function deleteTrailer(id: number): Promise<ApiResponse<Trailer>> {
  const response = await fetch(`/api/equipment/trailers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete trailer");
  }

  return response.json();
}

// Tractor Hooks
export function useTractors(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & EquipmentFilters = {}) {
  return useQuery({
    queryKey: equipmentKeys.tractorList(params),
    queryFn: () => fetchTractors(params),
  });
}

export function useTractor(id: number, include: string[] = []) {
  return useQuery({
    queryKey: equipmentKeys.tractorDetail(id, include),
    queryFn: () => fetchTractor(id, include),
    enabled: !!id,
  });
}

export function useAvailableTractors() {
  return useQuery({
    queryKey: equipmentKeys.tractorList({ available: true }),
    queryFn: () => fetchTractors({ available: true }),
  });
}

export function useCreateTractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.tractorsList() });
    },
  });
}

export function useUpdateTractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Tractor>) =>
      updateTractor(id, data),
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.tractorsList() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.tractorDetails() });
    },
  });
}

export function useDeleteTractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.tractorsList() });
    },
  });
}

// Trailer Hooks
export function useTrailers(params: {
  page?: number;
  pageSize?: number;
  include?: string[];
} & EquipmentFilters = {}) {
  return useQuery({
    queryKey: equipmentKeys.trailerList(params),
    queryFn: () => fetchTrailers(params),
  });
}

export function useTrailer(id: number, include: string[] = []) {
  return useQuery({
    queryKey: equipmentKeys.trailerDetail(id, include),
    queryFn: () => fetchTrailer(id, include),
    enabled: !!id,
  });
}

export function useAvailableTrailers(equipmentType?: EquipmentType[]) {
  return useQuery({
    queryKey: equipmentKeys.trailerList({ available: true, equipmentType }),
    queryFn: () => fetchTrailers({ available: true, equipmentType }),
  });
}

export function useCreateTrailer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrailer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.trilersList() });
    },
  });
}

export function useUpdateTrailer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Trailer>) =>
      updateTrailer(id, data),
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.trilersList() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.trailerDetails() });
    },
  });
}

export function useDeleteTrailer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrailer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.trilersList() });
    },
  });
}