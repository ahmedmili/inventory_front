'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import RouteGuard from '@/components/guards/RouteGuard';
import { EditIcon, ArrowLeftIcon } from '@/components/icons';
import { getImageUrl } from '@/lib/images';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ProductFormModal from '@/components/products/ProductFormModal';
import StockMovementModal from '@/components/products/StockMovementModal';
import { useState, useEffect } from 'react';

// Stock Movements History Component
function ProductMovementsHistory({ productId }: { productId: string }) {
  const { data: movements, loading, mutate } = useApi<any[]>(`/stock-movements?productId=${productId}`);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-green-100 text-green-800 border-green-200',
      OUT: 'bg-red-100 text-red-800 border-red-200',
      TRANSFER: 'bg-blue-100 text-blue-800 border-blue-200',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Dispose',
      OUT: 'Withdraw',
      TRANSFER: 'Transfer',
      ADJUSTMENT: 'Adjustment',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des mouvements</h3>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Historique des mouvements</h3>
          <Link
            href="/movements"
            className="text-sm text-primary-600 hover:text-primary-900 font-medium transition-colors"
          >
            Voir tout →
          </Link>
        </div>
      </div>
      <div className="px-6 py-5">
        {movements && movements.length > 0 ? (
          <div className="space-y-3">
            {movements.slice(0, 10).map((movement: any) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                      movement.type,
                    )}`}
                  >
                    {getTypeLabel(movement.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {movement.warehouse?.name || 'Entrepôt inconnu'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(movement.createdAt), 'dd MMM yyyy à HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        movement.type === 'OUT' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {movement.type === 'OUT' ? '-' : '+'}
                      {movement.quantity}
                    </div>
                    {movement.user && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {movement.user.firstName} {movement.user.lastName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {movements.length > 10 && (
              <div className="text-center pt-2">
                <Link
                  href="/movements"
                  className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                >
                  Voir les {movements.length - 10} autres mouvements →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <p className="text-sm text-gray-500">Aucun mouvement de stock enregistré</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Image component with fallback
function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  salePrice: number | string;
  purchasePrice?: number | string;
  minStock: number;
  barcode?: string;
  supplier?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  images?: string[] | null;
  warehouseStock?: Array<{
    id: string;
    quantity: number;
    warehouseId: string;
    warehouse?: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const { data: product, loading, error, mutate } = useApi<Product>(`/products/${id}`);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [movementRefreshKey, setMovementRefreshKey] = useState(0);
  const canEdit = hasPermission(user, 'products.update');

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (mutate) {
      mutate();
    }
    // Trigger movements refresh
    setMovementRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <RouteGuard
        requirements={{
          requireAuth: true,
          requirePermissions: ['products.read'],
        }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Chargement du produit...</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !product) {
    return (
      <RouteGuard
        requirements={{
          requireAuth: true,
          requirePermissions: ['products.read'],
        }}
      >
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Produit non trouvé</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-900 font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Retour à la liste des produits
            </Link>
          </div>
        </div>
      </RouteGuard>
    );
  }

  const images = product.images && Array.isArray(product.images) ? product.images : [];
  const totalStock = product.warehouseStock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
  const isLowStock = totalStock <= product.minStock;

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-900 font-medium w-fit"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Retour à la liste
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsDisposeModalOpen(true)}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Disposer
              </button>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Retirer
              </button>
              {canEdit && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <EditIcon className="w-5 h-5" />
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Information (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Product Info Card */}
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    {product.sku && (
                      <p className="mt-2 text-sm text-gray-500 font-mono">Réf: {product.sku}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {Number(product.salePrice).toFixed(2)}€
                    </div>
                    {product.purchasePrice && (
                      <div className="text-sm text-gray-500 mt-1">
                        Achat: {Number(product.purchasePrice).toFixed(2)}€
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{product.id}</dd>
                  </div>

                  {product.barcode && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Code-barres</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{product.barcode}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fournisseur</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.supplier ? (
                        <Link
                          href={`/suppliers/${product.supplier.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {product.supplier.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400 italic">Non assigné</span>
                      )}
                    </dd>
                  </div>

                  {product.category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Catégorie</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.category.name}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Seuil minimum</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {product.minStock} unités
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock total</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isLowStock
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {totalStock} unités
                        {isLowStock && ' (Stock faible)'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(product.createdAt), 'dd/MM/yyyy à HH:mm')}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Modifié le</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(product.updatedAt), 'dd/MM/yyyy à HH:mm')}
                    </dd>
                  </div>
                </dl>

                {product.description && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Description</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
                      {product.description}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Images Section */}
            {images.length > 0 && (
              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Images du produit</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((image, index) => {
                      const imageUrl = getImageUrl(image);
                      return (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`${product.name} - Image ${index + 1}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Stock Movements Section */}
            <ProductMovementsHistory key={movementRefreshKey} productId={product.id} />
          </div>

          {/* Right Column - Sidebar (4 columns) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Stock by Warehouse */}
              {product.warehouseStock && product.warehouseStock.length > 0 && (
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Stock par entrepôt</h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="space-y-3">
                      {product.warehouseStock.map((stock) => (
                        <div
                          key={stock.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {stock.warehouse?.name || `Entrepôt ${stock.warehouseId.slice(0, 8)}`}
                            </p>
                            {stock.warehouse?.code && (
                              <p className="text-xs text-gray-500 mt-0.5">{stock.warehouse.code}</p>
                            )}
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                stock.quantity <= product.minStock
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : 'bg-green-100 text-green-800 border-green-200'
                              }`}
                            >
                              {stock.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-600">Stock total</span>
                      <span
                        className={`text-sm font-bold ${
                          isLowStock ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {totalStock} unités
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-600">Seuil minimum</span>
                      <span className="text-sm font-semibold text-gray-900">{product.minStock}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-200 pt-3">
                      <span className="text-sm font-medium text-gray-600">Valeur du stock</span>
                      <span className="text-sm font-bold text-green-600">
                        {(totalStock * Number(product.salePrice)).toFixed(2)}€
                      </span>
                    </div>
                    {product.purchasePrice && (
                      <>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">Coût d'achat</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {(totalStock * Number(product.purchasePrice)).toFixed(2)}€
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-semibold text-gray-900">Marge potentielle</span>
                            <span className="text-sm font-bold text-green-600">
                              {(
                                totalStock *
                                (Number(product.salePrice) - Number(product.purchasePrice))
                              ).toFixed(2)}
                              €
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {canEdit && (
          <ProductFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            productId={id}
          />
        )}

        {/* Stock Movement Modals */}
        {product && (
          <>
            <StockMovementModal
              isOpen={isDisposeModalOpen}
              onClose={() => setIsDisposeModalOpen(false)}
              onSuccess={() => {
                handleEditSuccess();
                setMovementRefreshKey((prev) => prev + 1);
              }}
              productId={product.id}
              productName={product.name}
              type="IN"
              defaultWarehouseId={product.warehouseStock?.[0]?.warehouseId}
            />
            <StockMovementModal
              isOpen={isWithdrawModalOpen}
              onClose={() => setIsWithdrawModalOpen(false)}
              onSuccess={() => {
                handleEditSuccess();
                setMovementRefreshKey((prev) => prev + 1);
              }}
              productId={product.id}
              productName={product.name}
              type="OUT"
              defaultWarehouseId={product.warehouseStock?.[0]?.warehouseId}
            />
          </>
        )}
        </div>
      </div>
    </RouteGuard>
  );
}

