'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import RouteGuard from '@/components/guards/RouteGuard';
import { format } from 'date-fns';
import Table, { Column } from '@/components/Table';
import { SearchIcon, CloseIcon } from '@/components/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ManualStockAdjustmentModal from '@/components/stock/ManualStockAdjustmentModal';

interface StockMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  reference?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export default function MovementsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'IN' | 'OUT' | 'ADJUSTMENT'>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const canCreateStock = hasPermission(user, 'stock.create');

  const queryParams = new URLSearchParams();
  if (filter !== 'all') {
    queryParams.set('type', filter);
  }
  if (startDate) {
    queryParams.set('startDate', startDate);
  }
  if (endDate) {
    queryParams.set('endDate', endDate);
  }

  const { data: movements, loading, error, mutate } = useApi<StockMovement[]>(
    `/stock-movements?${queryParams.toString()}`
  );

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

  // Filter movements by search term
  const filteredMovements = movements?.filter((movement) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      movement.product.name.toLowerCase().includes(searchLower) ||
      movement.product.sku?.toLowerCase().includes(searchLower) ||
      movement.user?.firstName.toLowerCase().includes(searchLower) ||
      movement.user?.lastName.toLowerCase().includes(searchLower) ||
      movement.user?.email.toLowerCase().includes(searchLower) ||
      movement.reason?.toLowerCase().includes(searchLower) ||
      movement.reference?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const columns: Column<StockMovement>[] = [
    {
      key: 'createdAt',
      label: 'Date & Heure',
      sortable: false,
      render: (movement) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {format(new Date(movement.createdAt), 'dd MMM yyyy')}
          </div>
          <div className="text-gray-500">
            {format(new Date(movement.createdAt), 'HH:mm:ss')}
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Produit',
      sortable: false,
      render: (movement) => (
        <div>
          <Link
            href={`/products/${movement.product.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-900"
          >
            {movement.product.name}
          </Link>
          {movement.product.sku && (
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              {movement.product.sku}
            </div>
          )}
        </div>
      ),
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
      render: (movement) => (
        <div className="text-right">
          <span
            className={`text-sm font-semibold ${
              movement.type === 'OUT' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {movement.type === 'OUT' ? '-' : '+'}
            {movement.quantity}
          </span>
        </div>
      ),
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
      render: (movement) => (
        <div className="text-sm max-w-xs">
          {movement.reason && (
            <div className="text-gray-900 mb-1">{movement.reason}</div>
          )}
          {movement.reference && (
            <div className="text-xs text-gray-500 font-mono">
              Réf: {movement.reference}
            </div>
          )}
          {!movement.reason && !movement.reference && (
            <span className="text-gray-400 italic">-</span>
          )}
        </div>
      ),
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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mouvements de stock</h2>
              {movements && (
                <p className="mt-1 text-sm text-gray-500">
                  {filteredMovements.length} mouvement{filteredMovements.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {canCreateStock && (
                <button
                  onClick={() => setIsAdjustmentModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajustement manuel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* First Row: Search and Type */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par produit, utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as any);
                  mutate?.();
                }}
                className="block w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">Tous les types</option>
                <option value="IN">Dispose (IN)</option>
                <option value="OUT">Withdraw (OUT)</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
          </div>

          {/* Second Row: Date Range */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    mutate?.();
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    mutate?.();
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              {(startDate || endDate) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      mutate?.();
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
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
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Échec du chargement des mouvements. Veuillez réessayer.</p>
          </div>
        ) : (
          <>
            <Table
              data={filteredMovements}
              columns={columns}
              loading={loading}
              emptyMessage="Aucun mouvement de stock trouvé"
            />
          </>
        )}

        {/* Modals */}
        {canCreateStock && (
          <ManualStockAdjustmentModal
            isOpen={isAdjustmentModalOpen}
            onClose={() => setIsAdjustmentModalOpen(false)}
            onSuccess={() => {
              mutate?.();
            }}
          />
        )}
      </div>
    </RouteGuard>
  );
}

