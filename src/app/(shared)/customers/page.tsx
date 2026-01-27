'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { SearchIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CustomersResponse {
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [paginationMeta, setPaginationMeta] = useState<CustomersResponse['meta'] | null>(null);
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
    
    router.replace(`/customers?${params.toString()}`, { scroll: false });
  }, [page, search, limit, router]);

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;

      const response = await apiClient.get<CustomersResponse>('/customers', { params });
      
      if (response.data && 'data' in response.data && 'meta' in response.data) {
        setCustomers(response.data.data);
        setPaginationMeta(response.data.meta);
      } else {
        // Fallback for old format
        setCustomers(Array.isArray(response.data) ? response.data : []);
        setPaginationMeta(null);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <RouteGuard>
        <div className="px-4 py-6 sm:px-0">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">Clients</h2>
          <Link
            href="/customers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ajouter un client
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customers Grid */}
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {customer.name}
                  </h3>
                  {customer.email && (
                    <p className="text-sm text-gray-600 mb-1">📧 {customer.email}</p>
                  )}
                  {customer.phone && (
                    <p className="text-sm text-gray-600 mb-1">📞 {customer.phone}</p>
                  )}
                  {customer.address && (
                    <p className="text-sm text-gray-600 mb-4">📍 {customer.address}</p>
                  )}
                  <div className="flex space-x-3">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Voir les détails →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {customers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">
                  {search ? 'Aucun client trouvé correspondant à votre recherche' : 'Aucun client trouvé'}
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
