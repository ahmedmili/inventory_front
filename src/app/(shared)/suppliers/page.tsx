'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { SupplierSummary, extractCollection } from '@/types/api';
import Pagination from '@/components/Pagination';
import { SearchIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';

interface SuppliersResponse {
  data: SupplierSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function SuppliersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [paginationMeta, setPaginationMeta] = useState<SuppliersResponse['meta'] | null>(null);
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
    
    router.replace(`/suppliers?${params.toString()}`, { scroll: false });
  }, [page, search, limit, router]);

  useEffect(() => {
    loadSuppliers();
  }, [page, search]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;

      const response = await apiClient.get<SuppliersResponse>('/suppliers', { params });
      
      if (response.data && 'data' in response.data && 'meta' in response.data) {
        setSuppliers(response.data.data);
        setPaginationMeta(response.data.meta);
      } else {
        // Fallback for old format
        const data = extractCollection<SupplierSummary>(response.data);
        setSuppliers(data);
        setPaginationMeta(null);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <RouteGuard requirements={{ requirePermissions: ['suppliers.read'] }}>
        <div className="px-4 py-6 sm:px-0">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requirements={{ requirePermissions: ['suppliers.read'] }}>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">Fournisseurs</h2>
          <Link
            href="/suppliers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ajouter un fournisseur
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un fournisseur..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Suppliers Grid */}
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {supplier.name}
                  </h3>
                  {supplier.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      📧 {supplier.email}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-sm text-gray-600 mb-1">
                      📞 {supplier.phone}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="text-sm text-gray-600 mb-4">
                      📍 {supplier.address}
                    </p>
                  )}
                  <div className="flex space-x-3">
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Voir les détails →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {suppliers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">
                  {search ? 'Aucun fournisseur trouvé correspondant à votre recherche' : 'Aucun fournisseur trouvé'}
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
