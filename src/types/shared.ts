/**
 * Types partagés pour éviter les conflits de types dans l'application
 */

// Types de statut communs
export type ReservationStatus = 'RESERVED' | 'FULFILLED' | 'RELEASED' | 'CANCELLED';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

// Types de pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Types d'utilisateur
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: {
    id: string;
    code: string;
    name: string;
  };
}

// Types de produit
export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  salePrice: number;
  purchasePrice?: number | null;
  minStock: number;
  supplier?: {
    id: string;
    name: string;
  };
}

// Types de fournisseur
export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

// Types de projet
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  createdBy?: User;
}

// Types de réservation
export interface ReservationItem {
  id: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt?: string;
  createdAt?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface ReservationGroup {
  groupId: string;
  createdAt: string;
  status: ReservationStatus;
  expiresAt?: string;
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
  items: ReservationItem[];
  totalItems: number;
  user?: User;
}

// Types de mouvement de stock
export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    /** Stock actuel (API actuelle) */
    stock?: { quantity: number } | null;
    /** Ancien format multi-entrepôts */
    warehouseStock?: Array<{ quantity: number }>;
  };
  user?: User;
  createdAt: string;
}

// Types de réponse API génériques
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Types de filtres
export interface FilterOption {
  value: string;
  label: string;
}

// Types de colonnes de tableau
export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}
