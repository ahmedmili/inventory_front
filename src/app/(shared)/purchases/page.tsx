'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { SearchIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    
    router.replace(`/purchases?${params.toString()}`, { scroll: false });
  }, [page, search, statusFilter, limit, router]);

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      VALIDATED: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

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
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">Commandes d'achat</h2>
          <Link
            href="/purchases/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Nouvelle commande
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="VALIDATED">Validée</option>
              <option value="RECEIVED">Reçue</option>
              <option value="PARTIAL">Partielle</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numéro de commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date prévue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créée le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.supplier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.expectedDate
                          ? new Date(order.expectedDate).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/purchases/${order.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                <p className="text-gray-500">
                  {search || statusFilter !== 'all' ? 'Aucune commande trouvée correspondant à vos critères' : 'Aucune commande trouvée'}
                </p>
              </div>
            )}

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
