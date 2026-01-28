'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
// Layout is handled by (shared)/layout.tsx
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import RouteGuard from '@/components/guards/RouteGuard';
import ProductFormModal from '@/components/products/ProductFormModal';
import { EyeIcon, EditIcon, PlusIcon, TrashIcon, PackageIcon } from '@/components/icons';
import { StatisticsCard, ModernTable, SearchFilter } from '@/components/ui';
import type { TableColumn } from '@/types/shared';
import { type SortDirection } from '@/components/Table';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ConfirmModal from '@/components/ConfirmModal';
import ReservationCartModal from '@/components/reservations/ReservationCartModal';
import ImportProductsModal from '@/components/products/ImportProductsModal';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { useProductsRealtime } from '@/hooks/useProductsRealtime';
import { exportProductsToCSV, downloadCSV } from '@/lib/csv-utils';
import { exportProductsToExcel } from '@/lib/excel-utils';

interface Product {
  id: string;
  name: string;
  sku?: string | null; // Référence (optional)
  description?: string | null; // Description (optional)
  salePrice: number | string; // Prix
  minStock: number; // Seuil
  supplier?: { name: string }; // Fournisseur
  warehouseStock?: Array<{
    id: string;
    quantity: number;
    warehouseId: string;
  }>;
  // Commented out fields - can be restored later
  // barcode: string;
  // purchasePrice: number | string;
  // category?: { name: string };
}

interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || ''); // Input value (no debounce)
  const [search, setSearch] = useState(searchParams?.get('search') || ''); // Debounced search value
  const [sortBy, setSortBy] = useState<string>(searchParams?.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<SortDirection>((searchParams?.get('sortOrder') as SortDirection) || 'desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const limit = 20;
  const { mutate: deleteProduct, loading: deleting } = useApiMutation();
  const canDelete = hasPermission(user, 'products.delete');
  const canCreate = hasPermission(user, 'products.create');
  const canUpdate = hasPermission(user, 'products.update');
  const canCreateReservation = hasPermission(user, 'reservations.create');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const apiParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (sortBy && sortOrder) {
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
    }
    return params.toString();
  }, [page, search, limit, sortBy, sortOrder]);

  const { data, loading, error, mutate } = useApi<ProductsResponse>(`/products?${apiParams}`);

  // Debounce search input - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Synchroniser l'URL avec les filtres et la pagination
  useUrlSync({
    page: page > 1 ? page : undefined,
    search: search || undefined,
    sortBy: sortBy !== 'createdAt' ? sortBy : undefined,
    sortOrder: sortOrder !== 'desc' ? sortOrder : undefined,
  });

  // Écouter les mises à jour de stock en temps réel
  useProductsRealtime(() => {
    // Rafraîchir la liste des produits quand le stock est mis à jour
    mutate();
  });

  const handleSearch = (value: string) => {
    setSearchInput(value); // Update input immediately (no debounce)
  };

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (productId: string) => {
    setEditingProductId(productId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
  };

  const handleModalSuccess = () => {
    // Refresh the products list
    if (mutate) {
      mutate();
    }
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(`/products/${productToDelete.id}`, 'DELETE');
      toast.success('Produit supprimé avec succès! Il peut être restauré si nécessaire.');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      // Refresh the products list
      if (mutate) {
        mutate();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Échec de la suppression du produit';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortBy(key);
    setSortOrder(direction || 'desc');
    setPage(1); // Reset to first page when sorting changes
  };

  const handleExportCSV = async () => {
    try {
      // Fetch all products for export
      const response = await apiClient.get('/products?limit=10000');
      const products = response.data?.data || response.data || [];
      const csvContent = exportProductsToCSV(products);
      downloadCSV(csvContent, `produits_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Export CSV réussi');
    } catch (error: any) {
      console.error('Export CSV error:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const handleExportExcel = async () => {
    try {
      // Fetch all products for export
      const response = await apiClient.get('/products?limit=10000');
      const products = response.data?.data || response.data || [];
      await exportProductsToExcel(products, `produits_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export Excel réussi');
    } catch (error: any) {
      console.error('Export Excel error:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  // Calculate statistics
  const totalProducts = data?.meta?.total || data?.data?.length || 0;
  const lowStockProducts = data?.data?.filter(p => {
    const totalStock = p.warehouseStock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    return totalStock <= p.minStock;
  }).length || 0;
  const inStockProducts = data?.data?.filter(p => {
    const totalStock = p.warehouseStock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    return totalStock > p.minStock;
  }).length || 0;
  const outOfStockProducts = data?.data?.filter(p => {
    const totalStock = p.warehouseStock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    return totalStock === 0;
  }).length || 0;

  const columns: TableColumn<Product>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: false,
      className: 'font-mono text-xs min-w-[80px]',
      render: (product: Product) => (
        <div className="font-mono text-xs text-gray-500 min-w-[80px]">{product.id.slice(0, 8)}...</div>
      ),
    },
    {
      key: 'name',
      label: 'Nom du produit',
      sortable: true,
      render: (product: Product) => (
        <div className="font-semibold text-gray-900 min-w-[200px]">{product.name}</div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'supplier',
      label: 'Fournisseur',
      sortable: true,
      render: (product: Product) => (
        <div className="text-gray-600 min-w-[150px]">
          {product.supplier?.name || (
            <span className="text-gray-400 italic">Non assigné</span>
          )}
        </div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'sku',
      label: 'Référence',
      sortable: true,
      render: (product: Product) => (
        <div className="text-gray-600 font-mono text-sm min-w-[120px]">{product.sku || 'N/A'}</div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'salePrice',
      label: 'Prix',
      sortable: true,
      align: 'right',
      className: 'text-right min-w-[100px]',
      render: (product: Product) => (
        <div className="text-right font-bold text-green-600 min-w-[100px]">
          {Number(product.salePrice).toFixed(2)}€
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (product: Product) => (
        <div className="text-gray-600 max-w-xs truncate min-w-[200px]" title={product.description || undefined}>
          {product.description || (
            <span className="text-gray-400 italic">Aucune description</span>
          )}
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: false,
      align: 'right',
      className: 'text-right min-w-[100px]',
      render: (product: Product) => {
        const totalStock = product.warehouseStock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
        const isLowStock = totalStock <= product.minStock;
        return (
          <div className="text-right min-w-[100px]">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              isLowStock 
                ? 'bg-red-100 text-red-800 border-2 border-red-200' 
                : totalStock > product.minStock * 1.5
                ? 'bg-green-100 text-green-800 border-2 border-green-200'
                : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'
            }`}>
              {totalStock}
            </span>
          </div>
        );
      },
    },
    {
      key: 'minStock',
      label: 'Seuil',
      sortable: true,
      align: 'right',
      className: 'text-right min-w-[80px]',
      render: (product: Product) => (
        <div className="text-right min-w-[80px]">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            {product.minStock}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'center',
      className: 'text-center',
      render: (product: Product) => (
        <div className="flex items-center justify-center gap-1">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
            onClick={(e) => e.stopPropagation()}
            title="Voir les détails"
          >
            <EyeIcon />
          </Link>
          {canCreateReservation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProductId(product.id);
                setIsReservationModalOpen(true);
              }}
              className="inline-flex items-center justify-center p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="Réserver"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(product.id);
              }}
              className="inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="Modifier"
            >
              <EditIcon />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(product.id, product.name);
              }}
              disabled={deleting}
              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Supprimer"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      ),
    },
    // Commented out columns - can be restored later
    // {
    //   key: 'barcode',
    //   label: 'Code-barres',
    //   sortable: true,
    //   render: (product) => (
    //     <div className="text-gray-600 font-mono text-xs">{product.barcode}</div>
    //   ),
    // },
    // {
    //   key: 'category',
    //   label: 'Catégorie',
    //   sortable: false,
    //   render: (product) => (
    //     <div className="text-gray-600">
    //       {product.category?.name || (
    //         <span className="text-gray-400 italic">Non catégorisé</span>
    //       )}
    //     </div>
    //   ),
    // },
    // {
    //   key: 'purchasePrice',
    //   label: 'Prix d\'achat',
    //   sortable: true,
    //   className: 'text-right',
    //   render: (product) => (
    //     <div className="text-right font-medium text-gray-900">
    //       {Number(product.purchasePrice).toFixed(2)}€
    //     </div>
    //   ),
    // },
  ];

  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requirePermissions: ['products.read'],
      }}
    >
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border border-green-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Produits</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {data?.meta ? `${data.meta.total} produit${data.meta.total !== 1 ? 's' : ''} au total` : 'Gérez votre catalogue de produits'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canCreate && (
                  <>
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-sm hover:shadow-md"
                      title="Importer des produits depuis CSV/Excel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="hidden sm:inline">Importer</span>
                    </button>
                    <ExportDropdown
                      trigger={
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="hidden sm:inline">Exporter</span>
                        </>
                      }
                      options={[
                        {
                          label: 'Exporter en CSV',
                          description: 'Format texte compatible avec Excel',
                          icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ),
                          onClick: handleExportCSV,
                        },
                        {
                          label: 'Exporter en Excel',
                          description: 'Format .xlsx avec formatage',
                          icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ),
                          onClick: handleExportExcel,
                        },
                      ]}
                    />
                    <button
                      onClick={handleOpenCreateModal}
                      className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
                      title="Créer un nouveau produit"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">Ajouter un produit</span>
                      <span className="sm:hidden">Ajouter</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {data?.data && data.data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatisticsCard
                title="Total Produits"
                value={totalProducts}
                icon={<PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                colorScheme="green"
              />
              <StatisticsCard
                title="En stock"
                value={inStockProducts}
                icon={<PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                colorScheme="blue"
              />
              <StatisticsCard
                title="Stock faible"
                value={lowStockProducts}
                icon={<PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                colorScheme="orange"
              />
              <StatisticsCard
                title="Rupture"
                value={outOfStockProducts}
                icon={<PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                colorScheme="red"
              />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SearchFilter
              value={searchInput}
              onChange={handleSearch}
              placeholder="Rechercher par nom ou référence..."
              className="w-full"
            />
          </div>

          {/* Table */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Échec du chargement des produits. Veuillez réessayer.</p>
            </div>
          ) : (
            <>
              <ModernTable
                columns={columns}
                data={data?.data || []}
                headerGradient="from-green-600 via-green-500 to-emerald-600"
                striped={true}
                hoverable={true}
                emptyMessage="Aucun produit trouvé"
                minWidth="1200px"
              />

              {data?.meta && data.meta.total > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">{(data.meta.page - 1) * data.meta.limit + 1}</span> à{' '}
                    <span className="font-medium">
                      {Math.min(data.meta.page * data.meta.limit, data.meta.total)}
                    </span>{' '}
                    sur <span className="font-medium">{data.meta.total}</span> produit{data.meta.total !== 1 ? 's' : ''}
                  </div>
                  {data.meta.totalPages > 1 && (
                    <Pagination
                      currentPage={data.meta.page}
                      totalPages={data.meta.totalPages}
                      onPageChange={setPage}
                      hasNext={data.meta.hasNext}
                      hasPrev={data.meta.hasPrev}
                    />
                  )}
                </div>
              )}
            </>
          )}

        {/* Product Form Modal */}
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          productId={editingProductId}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          message={`Êtes-vous sûr de vouloir supprimer le produit "${productToDelete?.name}" ?\n\nLe produit sera masqué mais pourra être restauré ultérieurement si nécessaire.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          type="warning"
          loading={deleting}
        />

        {/* Reservation Cart Modal */}
        {canCreateReservation && (
          <ReservationCartModal
            isOpen={isReservationModalOpen}
            onClose={() => {
              setIsReservationModalOpen(false);
              setSelectedProductId(null);
            }}
            initialProductId={selectedProductId || undefined}
            onSuccess={() => {
              if (mutate) {
                mutate();
              }
            }}
          />
        )}

        {isImportModalOpen && (
          <ImportProductsModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={() => {
              if (mutate) {
                mutate();
              }
            }}
          />
        )}
        </div>
      </RouteGuard>
    );
  }

