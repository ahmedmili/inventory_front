'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RouteGuard from '@/components/guards/RouteGuard';
import { format } from 'date-fns';
import { SearchIcon, CloseIcon, PlusIcon } from '@/components/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ManualStockAdjustmentModal from '@/components/stock/ManualStockAdjustmentModal';
import Pagination from '@/components/Pagination';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { PageHeader, SearchFilter, SelectFilter, StatisticsCard, ModernTable } from '@/components/ui';
import { PackageIcon, UserIcon, CalendarIcon } from '@/components/icons';
import type { TableColumn } from '@/types/shared';
import { useUrlSync } from '@/hooks/useUrlSync';
import type { StockMovement, PaginationMeta, ApiListResponse } from '@/types/shared';

interface MovementsResponse extends ApiListResponse<StockMovement> {}

export default function MovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  
  // Initialize state from URL params
  const [filter, setFilter] = useState<string>(
    searchParams?.get('type') || 'all'
  );
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || ''); // Input value (no debounce)
  const [search, setSearch] = useState(searchParams?.get('search') || ''); // Debounced search value
  const [startDate, setStartDate] = useState<string>(searchParams?.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams?.get('endDate') || '');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [paginationMeta, setPaginationMeta] = useState<MovementsResponse['meta'] | null>(null);

  const canCreateStock = hasPermission(user, 'stock.create');

  // Debounce search: wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to page 1 when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync URL with filters and pagination
  useUrlSync({
    page: page > 1 ? page : undefined,
    type: filter !== 'all' ? filter : undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  useEffect(() => {
    loadMovements();
  }, [page, filter, search, startDate, endDate]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter && filter !== 'all') {
        params.set('type', filter);
      }
      if (search) {
        params.set('search', search);
      }
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }
      const response = await apiClient.get(`/stock-movements?${params.toString()}`);
      const data: MovementsResponse = response.data;
      setMovements(data.data || []);
      setPaginationMeta(data.meta || null);
    } catch (error: any) {
      console.error('Failed to load movements:', error);
      toast.error('Erreur lors du chargement des mouvements');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-green-100 text-green-800 border-green-200',
      OUT: 'bg-red-100 text-red-800 border-red-200',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Dispose',
      OUT: 'Withdraw',
      ADJUSTMENT: 'Adjustment',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'IN') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    if (type === 'OUT') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    }
    return null;
  };

  // No client-side filtering needed - search is done server-side
  const filteredMovements = movements;

  const columns: Column<StockMovement>[] = [
    {
      key: 'createdAt',
      label: 'Date & Heure',
      sortable: false,
      render: (movement: StockMovement) => (
        <div className="text-sm min-w-[140px]">
          <div className="font-medium text-gray-900">
            {format(new Date(movement.createdAt), 'dd MMM yyyy')}
          </div>
          <div className="text-gray-500">
            {format(new Date(movement.createdAt), 'HH:mm:ss')}
          </div>
        </div>
      ),
      className: 'min-w-[140px]',
    },
    {
      key: 'product',
      label: 'Produit',
      sortable: false,
      render: (movement: StockMovement) => (
        <div className="min-w-[200px]">
          <Link
            href={`/products/${movement.product.id}`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            {movement.product.name}
          </Link>
          {movement.product.sku && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              SKU: {movement.product.sku}
            </div>
          )}
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'type',
      label: 'Type',
      sortable: false,
      render: (movement) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
            movement.type,
          )}`}
        >
          {getTypeIcon(movement.type)}
          {getTypeLabel(movement.type)}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantité',
      sortable: false,
      className: 'text-right',
      render: (movement: StockMovement) => (
        <div className="text-right">
          <span
            className={`text-lg font-bold ${
              movement.type === 'OUT' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {movement.type === 'OUT' ? '−' : '+'}
            {movement.quantity}
          </span>
        </div>
      ),
      align: 'right',
      className: 'text-right',
    },
    {
      key: 'user',
      label: 'Effectué par',
      sortable: false,
      render: (movement) => (
        <div className="text-sm">
          {movement.user ? (
            <>
              <div className="font-medium text-gray-900">
                {movement.user.firstName} {movement.user.lastName}
              </div>
              <div className="text-xs text-gray-500">{movement.user.email}</div>
            </>
          ) : (
            <span className="text-gray-400 italic">Système</span>
          )}
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Raison / Référence',
      sortable: false,
      render: (movement: StockMovement) => (
        <div className="text-sm max-w-xs min-w-[150px]">
          {movement.reason && (
            <div className="text-gray-900 mb-1 font-medium">{movement.reason}</div>
          )}
          {movement.reference && (
            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
              Réf: {movement.reference}
            </div>
          )}
          {!movement.reason && !movement.reference && (
            <span className="text-gray-400 italic">-</span>
          )}
        </div>
      ),
      className: 'min-w-[150px]',
    },
  ];

  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requirePermissions: ['stock.read', 'products.read'], // Allow either stock.read or products.read
      }}
    >
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <PageHeader
          title="Mouvements de stock"
          description={paginationMeta ? `${paginationMeta.total} mouvement${paginationMeta.total !== 1 ? 's' : ''}` : undefined}
          actions={
            canCreateStock ? (
              <button
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Ajustement manuel
              </button>
            ) : undefined
          }
        />

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* First Row: Search and Type */}
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchFilter
              value={searchInput}
              onChange={(value) => {
                setSearchInput(value);
                setPage(1);
              }}
              placeholder="Rechercher par produit, utilisateur..."
              debounceMs={500}
              className="flex-1"
            />
            <SelectFilter
              value={filter}
              onChange={(value) => {
                setFilter(value as any);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'IN', label: 'Dispose (IN)' },
                { value: 'OUT', label: 'Withdraw (OUT)' },
                { value: 'ADJUSTMENT', label: 'Adjustment' },
              ]}
              placeholder="Tous les types"
              className="w-full sm:w-auto"
            />
          </div>

          {/* Second Row: Date Range */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {(startDate || endDate) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Effacer les dates"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading && movements.length === 0 ? (
          <SkeletonLoader />
        ) : (
          <>
            <ModernTable
              columns={columns}
              data={filteredMovements}
              headerGradient="from-blue-600 via-blue-500 to-indigo-600"
              striped={true}
              hoverable={true}
              emptyMessage="Aucun mouvement de stock trouvé"
              minWidth="1200px"
            />
            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={paginationMeta.totalPages}
                  onPageChange={setPage}
                  hasNext={paginationMeta.hasNext}
                  hasPrev={paginationMeta.hasPrev}
                />
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {canCreateStock && (
          <ManualStockAdjustmentModal
            isOpen={isAdjustmentModalOpen}
            onClose={() => setIsAdjustmentModalOpen(false)}
            onSuccess={() => {
              loadMovements();
            }}
          />
        )}
      </div>
    </RouteGuard>
  );
}

