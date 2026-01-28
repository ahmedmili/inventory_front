'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { PlusIcon, SalesIcon, CalendarIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { StatisticsCard, ModernTable, SearchFilter, SelectFilter, StatusBadge } from '@/components/ui';
import { useUrlSync } from '@/hooks/useUrlSync';
import type { TableColumn } from '@/types/shared';

interface SalesOrder {
  id: string;
  number: string;
  status: string;
  customer: { name: string };
  createdAt: string;
  deliveryDate?: string;
}

interface SalesResponse {
  data: SalesOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function SalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get('status') || 'all');
  const [paginationMeta, setPaginationMeta] = useState<SalesResponse['meta'] | null>(null);
  const limit = 20;

  // Debounce search input - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Synchroniser l'URL avec les filtres et la pagination
  useUrlSync({
    page: page > 1 ? page : undefined,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiClient.get<SalesResponse>('/sales', { params });
      
      if (response.data && 'data' in response.data && 'meta' in response.data) {
        setOrders(response.data.data);
        setPaginationMeta(response.data.meta);
      } else {
        // Fallback for old format
        setOrders(Array.isArray(response.data) ? response.data : []);
        setPaginationMeta(null);
      }
    } catch (error) {
      console.error('Failed to load sales orders:', error);
      setOrders([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Calculate statistics
  const totalOrders = paginationMeta?.total || orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED').length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;

  const columns: TableColumn<SalesOrder>[] = [
    {
      key: 'number',
      label: 'Numéro de commande',
      render: (order: SalesOrder) => (
        <div className="font-semibold text-gray-900 min-w-[150px]">{order.number}</div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'customer',
      label: 'Client',
      render: (order: SalesOrder) => (
        <div className="text-gray-700 min-w-[150px]">{order.customer.name}</div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'status',
      label: 'Statut',
      render: (order: SalesOrder) => (
        <StatusBadge status={order.status} variant="default" size="sm" />
      ),
      align: 'center',
      className: 'text-center',
    },
    {
      key: 'deliveryDate',
      label: 'Date de livraison',
      render: (order: SalesOrder) => (
        <div className="text-gray-600 min-w-[120px]">
          {order.deliveryDate
            ? new Date(order.deliveryDate).toLocaleDateString('fr-FR')
            : '-'}
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'createdAt',
      label: 'Créée le',
      render: (order: SalesOrder) => (
        <div className="text-gray-600 min-w-[120px]">
          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order: SalesOrder) => (
        <div className="flex items-center justify-center">
          <Link
            href={`/sales/${order.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            Voir
          </Link>
        </div>
      ),
      align: 'center',
      className: 'text-center',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading sales orders...</div>
      </div>
    );
  }

  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Commandes de vente</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérez vos commandes de vente et livraisons</p>
            </div>
            <Link
              href="/sales/new"
              className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Nouvelle commande</span>
              <span className="sm:hidden">Nouvelle</span>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {orders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatisticsCard
              title="Total Commandes"
              value={totalOrders}
              icon={<SalesIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="green"
            />
            <StatisticsCard
              title="En attente"
              value={pendingOrders}
              icon={<CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="orange"
            />
            <StatisticsCard
              title="Confirmées"
              value={confirmedOrders}
              icon={<SalesIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="blue"
            />
            <StatisticsCard
              title="Livrées"
              value={deliveredOrders}
              icon={<SalesIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="green"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchFilter
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Rechercher une commande..."
              className="flex-1"
            />
            <SelectFilter
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'PENDING', label: 'En attente' },
                { value: 'CONFIRMED', label: 'Confirmée' },
                { value: 'DELIVERED', label: 'Livrée' },
                { value: 'CANCELLED', label: 'Annulée' },
              ]}
              placeholder="Tous les statuts"
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <ModernTable
              columns={columns}
              data={orders}
              headerGradient="from-emerald-600 via-emerald-500 to-teal-600"
              striped={true}
              hoverable={true}
              emptyMessage={
                search || statusFilter !== 'all'
                  ? 'Aucune commande trouvée correspondant à vos critères'
                  : 'Aucune commande trouvée'
              }
              minWidth="1000px"
            />

            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={paginationMeta.page}
                  totalPages={paginationMeta.totalPages}
                  hasNext={paginationMeta.hasNext}
                  hasPrev={paginationMeta.hasPrev}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
}

