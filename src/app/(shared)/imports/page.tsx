'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import Pagination from '@/components/Pagination';
// Icons as SVG components
const PackageIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TruckIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

interface ImportLine {
  productId: string;
  productName: string;
  barcode?: string;
  quantity: number;
  createdAt: string;
}

interface Import {
  reference: string;
  supplier: {
    id: string;
    name: string;
  } | null;
  receivedDate: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  lines: ImportLine[];
}

interface ImportsResponse {
  data: Import[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ImportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imports, setImports] = useState<Import[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [paginationMeta, setPaginationMeta] = useState<ImportsResponse['meta'] | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string>(searchParams?.get('supplierId') || '');
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const toast = useToast();

  // Update URL when filters or pagination change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (supplierFilter) params.set('supplierId', supplierFilter);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/imports${newUrl}`, { scroll: false });
  }, [page, supplierFilter, router]);

  useEffect(() => {
    loadImports();
    loadSuppliers();
  }, [page, supplierFilter]);

  const loadSuppliers = async () => {
    try {
      const response = await apiClient.get('/suppliers?limit=1000');
      const suppliersData = response.data?.data || response.data || [];
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadImports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (supplierFilter) {
        params.append('supplierId', supplierFilter);
      }
      const response = await apiClient.get(`/imports?${params.toString()}`);
      const data: ImportsResponse = response.data;
      setImports(data.data || []);
      setPaginationMeta(data.meta || null);
    } catch (error: any) {
      console.error('Failed to load imports:', error);
      toast.error('Erreur lors du chargement des importations');
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuantity = (importItem: Import): number => {
    return importItem.lines.reduce((sum, line) => sum + line.quantity, 0);
  };

  if (loading && imports.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Importations</h1>
          <p className="text-sm text-gray-600 mt-1">Gérer les importations de produits depuis les fournisseurs</p>
        </div>
        <Link
          href="/imports/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PackageIcon className="w-4 h-4 mr-2" />
          Nouvelle Importation
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="supplierFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur
            </label>
            <select
              id="supplierFilter"
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setPage(1); // Reset to page 1 when filter changes
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les fournisseurs</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Imports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {imports.length === 0 ? (
          <div className="text-center py-12">
            <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune importation</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle importation.</p>
            <div className="mt-6">
              <Link
                href="/imports/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PackageIcon className="w-4 h-4 mr-2" />
                Nouvelle Importation
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {imports.map((importItem, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <TruckIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {importItem.reference}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {importItem.supplier && (
                            <div className="flex items-center gap-1">
                              <TruckIcon className="w-4 h-4" />
                              <span>{importItem.supplier.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <PackageIcon className="w-4 h-4" />
                            <span>{getTotalQuantity(importItem)} produits</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {new Date(importItem.receivedDate).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          {importItem.user && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              <span>
                                {importItem.user.firstName} {importItem.user.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="mt-4 ml-13">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Produits importés</h4>
                        <div className="space-y-2">
                          {importItem.lines.map((line, lineIndex) => (
                            <div key={lineIndex} className="flex items-center justify-between text-sm">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">{line.productName}</span>
                                {line.barcode && (
                                  <span className="text-gray-500 ml-2">({line.barcode})</span>
                                )}
                              </div>
                              <div className="text-gray-600">
                                <span className="font-medium">{line.quantity}</span> unités
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
