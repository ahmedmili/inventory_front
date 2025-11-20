export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export type ApiCollection<T> = T[] | PaginatedResponse<T>;

export interface CategoryOption {
  id: string;
  name: string;
}

export interface SupplierSummary {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  category?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
}

export interface CustomerSummary {
  id: string;
  name: string;
}

export function extractCollection<T>(
  payload: ApiCollection<T> | null | undefined,
): T[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

