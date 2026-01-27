'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ImportFormModal from '@/components/imports/ImportFormModal';
import { PackageIcon, TruckIcon, CalendarIcon, UserIcon, ChevronDownIcon, PlusIcon } from '@/components/icons';
import StatisticsCard from '@/components/ui/StatisticsCard';
import PageHeader from '@/components/ui/PageHeader';
import SelectFilter from '@/components/ui/SelectFilter';
import { useUrlSync } from '@/hooks/useUrlSync';
import type { PaginationMeta, ApiListResponse, User } from '@/types/shared';

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
  user: User | null;
  lines: ImportLine[];
}

interface ImportsResponse extends ApiListResponse<Import> {}

export default function ImportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [imports, setImports] = useState<Import[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [paginationMeta, setPaginationMeta] = useState<ImportsResponse['meta'] | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string>(searchParams?.get('supplierId') || '');
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedImports, setExpandedImports] = useState<Set<string>>(new Set()); // Par défaut, tous les imports sont collapsed
  const toast = useToast();
  
  const canCreate = hasPermission(user, 'imports.create');

  // Sync URL with filters and pagination
  useUrlSync({
    page: page > 1 ? page : undefined,
    supplierId: supplierFilter || undefined,
  });

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

  const toggleImport = (reference: string) => {
    setExpandedImports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reference)) {
        newSet.delete(reference);
      } else {
        newSet.add(reference);
      }
      return newSet;
    });
  };

  // Calculate statistics
  const totalImports = paginationMeta?.total || imports.length;
  const totalProducts = imports.reduce((sum, imp) => sum + getTotalQuantity(imp), 0);
  const uniqueSuppliers = new Set(imports.map(imp => imp.supplier?.id).filter(Boolean)).size;

  if (loading && imports.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importations</h1>
          <p className="text-sm text-gray-600 mt-1">Gérer les importations de produits depuis les fournisseurs</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <PackageIcon className="w-5 h-5 mr-2" />
            Nouvelle Importation
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {imports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatisticsCard
            title="Total Importations"
            value={totalImports}
            icon={<PackageIcon className="w-6 h-6" />}
            colorScheme="blue"
          />
          <StatisticsCard
            title="Produits Importés"
            value={totalProducts}
            icon={<TruckIcon className="w-6 h-6" />}
            colorScheme="green"
          />
          <StatisticsCard
            title="Fournisseurs"
            value={uniqueSuppliers}
            icon={<TruckIcon className="w-6 h-6" />}
            colorScheme="purple"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="supplierFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par fournisseur
            </label>
            <div className="relative">
              <select
                id="supplierFilter"
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Tous les fournisseurs</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Imports List */}
      {imports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="text-center py-16 px-4">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PackageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune importation</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Commencez par créer une nouvelle importation pour gérer vos stocks depuis les fournisseurs.
            </p>
            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <PackageIcon className="w-5 h-5 mr-2" />
                Créer une importation
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {imports.map((importItem, index) => {
            const isExpanded = expandedImports.has(importItem.reference);
            const totalQuantity = getTotalQuantity(importItem);
            const daysAgo = Math.floor((new Date().getTime() - new Date(importItem.receivedDate).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Import Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <TruckIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 truncate">
                            {importItem.reference}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {importItem.lines.length} {importItem.lines.length === 1 ? 'produit' : 'produits'}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {importItem.supplier && (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <TruckIcon className="w-3 h-3 text-gray-600" />
                              </div>
                              <span className="font-medium">{importItem.supplier.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                              <PackageIcon className="w-3 h-3 text-gray-600" />
                            </div>
                            <span className="font-medium">{totalQuantity} unités</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                              <CalendarIcon className="w-3 h-3 text-gray-600" />
                            </div>
                            <span>
                              {new Date(importItem.receivedDate).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {daysAgo >= 0 && daysAgo <= 7 && (
                              <span className="ml-1 text-xs text-gray-500">({daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`})</span>
                            )}
                          </div>
                          {importItem.user && (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-gray-600" />
                              </div>
                              <span>
                                {importItem.user.firstName} {importItem.user.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Button - Always visible */}
                    <button
                      onClick={() => toggleImport(importItem.reference)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                    >
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Products List - Only shown when expanded (collapsed by default) */}
                {isExpanded && importItem.lines.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                        Produits importés ({importItem.lines.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {importItem.lines.map((line, lineIndex) => (
                          <div
                            key={lineIndex}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {line.productName}
                                </p>
                                {line.barcode && (
                                  <p className="text-xs text-gray-500 mt-1 font-mono">
                                    {line.barcode}
                                  </p>
                                )}
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {line.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {/* Import Form Modal */}
      {canCreate && (
        <ImportFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadImports();
          }}
        />
      )}
    </div>
  );
}
