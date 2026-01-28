'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { SupplierSummary, extractCollection } from '@/types/api';
import Pagination from '@/components/Pagination';
import { BuildingIcon, EmailIcon, PhoneIcon, LocationIcon, PlusIcon, ArrowRightIcon } from '@/components/icons';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { StatisticsCard, SearchFilter } from '@/components/ui';
import Modal from '@/components/Modal';

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

interface SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuppliersModal({ isOpen, onClose }: SuppliersModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [page, search, isOpen]);

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

  const handleSupplierClick = (supplierId: string) => {
    onClose();
    router.push(`/suppliers/${supplierId}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fournisseurs" size="full">
      <div className="space-y-6">
        {/* Statistics Cards */}
        {suppliers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatisticsCard
              title="Total Fournisseurs"
              value={totalSuppliers}
              icon={<BuildingIcon className="w-6 h-6" />}
              colorScheme="blue"
            />
            <StatisticsCard
              title="Avec Email"
              value={withEmail}
              icon={<EmailIcon className="w-6 h-6" />}
              colorScheme="green"
            />
            <StatisticsCard
              title="Avec Téléphone"
              value={withPhone}
              icon={<PhoneIcon className="w-6 h-6" />}
              colorScheme="purple"
            />
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <SearchFilter
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Rechercher un fournisseur par nom, email, téléphone ou adresse..."
              className="flex-1"
            />
            {canCreate && (
              <Link
                href="/suppliers/new"
                onClick={onClose}
                className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Ajouter un fournisseur</span>
                <span className="sm:hidden">Ajouter</span>
              </Link>
            )}
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
                      onClick={onClose}
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
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden group cursor-pointer"
                    onClick={() => handleSupplierClick(supplier.id)}
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
                              onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => e.stopPropagation()}
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
                      <div className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group/link transition-colors">
                        <span>Voir les détails</span>
                        <ArrowRightIcon className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                      </div>
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
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
