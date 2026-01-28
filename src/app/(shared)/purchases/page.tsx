'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { PlusIcon, TruckIcon, CalendarIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { StatisticsCard, ModernTable, SearchFilter, SelectFilter, StatusBadge } from '@/components/ui';
import { useUrlSync } from '@/hooks/useUrlSync';
import type { TableColumn } from '@/types/shared';

interface PurchaseOrder {
  id: string;
  number: string;
  status: string;
  supplier: { name: string };
  createdAt: string;
  expectedDate?: string;
}

interface PurchasesResponse {
  data: PurchaseOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function PurchasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get('status') || 'all');
  const [paginationMeta, setPaginationMeta] = useState<PurchasesResponse['meta'] | null>(null);
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

  useEffect(() => {
    loadOrders();
  }, [page, search, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiClient.get<PurchasesResponse>('/purchases', { params });
      
      if (response.data && 'data' in response.data && 'meta' in response.data) {
        setOrders(response.data.data);
        setPaginationMeta(response.data.meta);
      } else {
        // Fallback for old format
        setOrders(Array.isArray(response.data) ? response.data : []);
        setPaginationMeta(null);
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      setOrders([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalOrders = paginationMeta?.total || orders.length;
  const draftOrders = orders.filter(o => o.status === 'DRAFT').length;
  const validatedOrders = orders.filter(o => o.status === 'VALIDATED').length;
  const receivedOrders = orders.filter(o => o.status === 'RECEIVED').length;

  const columns: TableColumn<PurchaseOrder>[] = [
    {
      key: 'number',
      label: 'Numéro de commande',
      render: (order: PurchaseOrder) => (
        <div className="font-semibold text-gray-900 min-w-[150px]">{order.number}</div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'supplier',
      label: 'Fournisseur',
      render: (order: PurchaseOrder) => (
        <div className="text-gray-700 min-w-[150px]">{order.supplier.name}</div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'status',
      label: 'Statut',
      render: (order: PurchaseOrder) => (
        <StatusBadge status={order.status} variant="default" size="sm" />
      ),
      align: 'center',
      className: 'text-center',
    },
    {
      key: 'expectedDate',
      label: 'Date prévue',
      render: (order: PurchaseOrder) => (
        <div className="text-gray-600 min-w-[120px]">
          {order.expectedDate
            ? new Date(order.expectedDate).toLocaleDateString('fr-FR')
            : '-'}
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'createdAt',
      label: 'Créée le',
      render: (order: PurchaseOrder) => (
        <div className="text-gray-600 min-w-[120px]">
          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order: PurchaseOrder) => (
        <div className="flex items-center justify-center">
          <Link
            href={`/purchases/${order.id}`}
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

  if (loading && orders.length === 0) {
    return (
      <RouteGuard>
        <div className="px-4 py-6 sm:px-0">
          <TableSkeleton rows={5} cols={6} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Commandes d'achat</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérez vos commandes d'achat auprès des fournisseurs</p>
            </div>
            <Link
              href="/purchases/new"
              className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105"
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
              icon={<TruckIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="orange"
            />
            <StatisticsCard
              title="Brouillons"
              value={draftOrders}
              icon={<CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="indigo"
            />
            <StatisticsCard
              title="Validées"
              value={validatedOrders}
              icon={<TruckIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="blue"
            />
            <StatisticsCard
              title="Reçues"
              value={receivedOrders}
              icon={<TruckIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
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
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'VALIDATED', label: 'Validée' },
                { value: 'RECEIVED', label: 'Reçue' },
                { value: 'PARTIAL', label: 'Partielle' },
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
              headerGradient="from-orange-600 via-orange-500 to-amber-600"
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
