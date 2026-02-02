'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { UserIcon, EmailIcon, PhoneIcon, LocationIcon, PlusIcon, ArrowRightIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { StatisticsCard, SearchFilter } from '@/components/ui';
import { useUrlSync } from '@/hooks/useUrlSync';

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
  useUrlSync({
    page: page > 1 ? page : undefined,
    search: search || undefined,
  });

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

  // Calculate statistics
  const totalCustomers = paginationMeta?.total || customers.length;
  const withEmail = customers.filter(c => c.email).length;
  const withPhone = customers.filter(c => c.phone).length;
  const withAddress = customers.filter(c => c.address).length;

  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto min-w-0 w-full p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="min-w-0 overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Clients</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérez vos clients et leurs informations</p>
            </div>
            <Link
              href="/customers/new"
              className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Ajouter un client</span>
              <span className="sm:hidden">Ajouter</span>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {customers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatisticsCard
              title="Total Clients"
              value={totalCustomers}
              icon={<UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="indigo"
            />
            <StatisticsCard
              title="Avec Email"
              value={withEmail}
              icon={<EmailIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="blue"
            />
            <StatisticsCard
              title="Avec Téléphone"
              value={withPhone}
              icon={<PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="green"
            />
            <StatisticsCard
              title="Avec Adresse"
              value={withAddress}
              icon={<LocationIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="purple"
            />
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <SearchFilter
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Rechercher un client..."
            className="w-full"
          />
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
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {customer.name}
                        </h3>
                      </div>
                    </div>
                  <div className="space-y-2">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EmailIcon className="w-4 h-4 text-blue-500" />
                        <a href={`mailto:${customer.email}`} className="hover:text-blue-600 transition-colors">
                          {customer.email}
                        </a>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 text-green-500" />
                        <a href={`tel:${customer.phone}`} className="hover:text-green-600 transition-colors">
                          {customer.phone}
                        </a>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <LocationIcon className="w-4 h-4 text-purple-500 mt-0.5" />
                        <span>{customer.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 group/link transition-colors"
                    >
                      <span>Voir les détails</span>
                      <ArrowRightIcon className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
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
