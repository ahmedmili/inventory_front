'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
// Layout is handled by (shared)/layout.tsx
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import RouteGuard from '@/components/guards/RouteGuard';
import ProductFormModal from '@/components/products/ProductFormModal';
import Table, { Column, SortDirection } from '@/components/Table';
import { EyeIcon, EditIcon, PlusIcon, SearchIcon, CloseIcon, TrashIcon } from '@/components/icons';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ConfirmModal from '@/components/ConfirmModal';
import ReservationCartModal from '@/components/reservations/ReservationCartModal';

interface Product {
  id: string;
  name: string;
  sku?: string | null; // Référence (optional)
  description?: string | null; // Description (optional)
  salePrice: number | string; // Prix
  minStock: number; // Seuil
  supplier?: { name: string }; // Fournisseur
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
  const toast = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');
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

  const searchParams = useMemo(() => {
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

  const { data, loading, error, mutate } = useApi<ProductsResponse>(`/products?${searchParams}`);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
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

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1); // Reset to first page when sorting changes
  };

  const columns: Column<Product>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: false,
      className: 'font-mono text-xs',
      render: (product) => (
        <div className="font-mono text-xs text-gray-500">{product.id.slice(0, 8)}...</div>
      ),
    },
    {
      key: 'name',
      label: 'Nom du produit',
      sortable: true,
      render: (product) => (
        <div className="font-medium text-gray-900">{product.name}</div>
      ),
    },
    {
      key: 'supplier',
      label: 'Fournisseur',
      sortable: true,
      render: (product) => (
        <div className="text-gray-600">
          {product.supplier?.name || (
            <span className="text-gray-400 italic">Non assigné</span>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'Référence',
      sortable: true,
      render: (product) => (
        <div className="text-gray-600">{product.sku || 'N/A'}</div>
      ),
    },
    {
      key: 'salePrice',
      label: 'Prix',
      sortable: true,
      className: 'text-right',
      render: (product) => (
        <div className="text-right font-medium text-green-600">
          {Number(product.salePrice).toFixed(2)}€
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (product) => (
        <div className="text-gray-600 max-w-xs truncate" title={product.description || undefined}>
          {product.description || (
            <span className="text-gray-400 italic">Aucune description</span>
          )}
        </div>
      ),
    },
    {
      key: 'minStock',
      label: 'Seuil',
      sortable: true,
      className: 'text-right',
      render: (product) => (
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {product.minStock}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      className: 'text-right',
      headerClassName: 'text-right',
      render: (product) => (
        <div className="flex items-center justify-end space-x-2">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center justify-center p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
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
              className="inline-flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
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
              className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="w-full">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Produits</h2>
              {data?.meta && (
                <p className="mt-1 text-sm text-gray-500">
                  {data.meta.total} produit{data.meta.total !== 1 ? 's' : ''} au total
                </p>
              )}
            </div>
            {canCreate && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm hover:shadow-md"
              >
                <PlusIcon />
                Ajouter un produit
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom ou référence..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Échec du chargement des produits. Veuillez réessayer.</p>
          </div>
        ) : (
          <>
            <Table
              data={data?.data || []}
              columns={columns}
              onSort={handleSort}
              sortKey={sortBy}
              sortDirection={sortOrder}
              loading={loading}
              emptyMessage="Aucun produit trouvé"
              onRowClick={(product) => router.push(`/products/${product.id}`)}
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
          </div>
        </div>
      </RouteGuard>
    );
  }

