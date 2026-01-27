'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { SupplierSummary, extractCollection } from '@/types/api';
import Pagination from '@/components/Pagination';
import { SearchIcon } from '@/components/icons';
import RouteGuard from '@/components/guards/RouteGuard';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';

// Icons as SVG components
const BuildingIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const EmailIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowRightIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

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
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [paginationMeta, setPaginationMeta] = useState<SuppliersResponse['meta'] | null>(null);
  const limit = 20;

  const canCreate = hasPermission(user, 'suppliers.create');

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

  // Calculate statistics
  const totalSuppliers = paginationMeta?.total || suppliers.length;
  const withEmail = suppliers.filter(s => s.email).length;
  const withPhone = suppliers.filter(s => s.phone).length;

  if (loading && suppliers.length === 0) {
    return (
      <RouteGuard requirements={{ requirePermissions: ['suppliers.read'] }}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requirements={{ requirePermissions: ['suppliers.read'] }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fournisseurs</h1>
            <p className="text-sm text-gray-600 mt-1">Gérer vos fournisseurs et leurs informations</p>
          </div>
          {canCreate && (
            <Link
              href="/suppliers/new"
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter un fournisseur
            </Link>
          )}
        </div>

        {/* Statistics Cards */}
        {suppliers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Fournisseurs</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{totalSuppliers}</p>
                </div>
                <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <BuildingIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Avec Email</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{withEmail}</p>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <EmailIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avec Téléphone</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{withPhone}</p>
                </div>
                <div className="h-12 w-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un fournisseur par nom, email, téléphone ou adresse..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Suppliers Grid */}
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <>
            {suppliers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="text-center py-16 px-4">
                  <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BuildingIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    {search
                      ? 'Aucun fournisseur ne correspond à votre recherche. Essayez avec d\'autres termes.'
                      : 'Commencez par ajouter votre premier fournisseur pour gérer vos relations commerciales.'}
                  </p>
                  {canCreate && (
                    <Link
                      href="/suppliers/new"
                      className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Ajouter un fournisseur
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className="p-6">
                      {/* Icon and Name */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <BuildingIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {supplier.name}
                          </h3>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-3">
                        {supplier.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <EmailIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <a
                              href={`mailto:${supplier.email}`}
                              className="text-gray-600 hover:text-blue-600 truncate transition-colors"
                              title={supplier.email}
                            >
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                              <PhoneIcon className="w-4 h-4 text-green-600" />
                            </div>
                            <a
                              href={`tel:${supplier.phone}`}
                              className="text-gray-600 hover:text-green-600 transition-colors"
                            >
                              {supplier.phone}
                            </a>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-start gap-3 text-sm">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mt-0.5">
                              <LocationIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="text-gray-600 line-clamp-2">{supplier.address}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group/link transition-colors"
                      >
                        <span>Voir les détails</span>
                        <ArrowRightIcon className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
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
