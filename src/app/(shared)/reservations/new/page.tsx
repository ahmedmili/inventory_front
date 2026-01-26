'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import RouteGuard from '@/components/guards/RouteGuard';
import Autocomplete, { AutocompleteOption } from '@/components/ui/Autocomplete';
import ProductFormModal from '@/components/products/ProductFormModal';

interface Product {
  id: string;
  name: string;
  sku?: string;
  stock?: {
    id: string;
    quantity: number;
  };
}

interface Project {
  id: string;
  name: string;
}

interface CartItem {
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  availableStock: number;
}

export default function NewReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState<{ name?: string; sku?: string } | null>(null);

  // Get productId from URL query params
  const productIdFromUrl = searchParams?.get('productId') || '';

  const [formData, setFormData] = useState({
    productId: productIdFromUrl,
    projectId: '',
    quantity: 1,
    expiresAt: '',
    notes: '',
  });

  const canCreate = hasPermission(user, 'reservations.create');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadOptions();
    }
  }, [user, authLoading]);

  // Update productId when URL param changes
  useEffect(() => {
    if (productIdFromUrl) {
      setFormData(prev => ({ ...prev, productId: productIdFromUrl }));
    }
  }, [productIdFromUrl]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [productsRes, projectsRes] = await Promise.all([
        apiClient.get('/products?limit=1000'),
        apiClient.get('/projects?status=ACTIVE'),
      ]);

      const productsData = productsRes.data?.data || productsRes.data || [];
      setProducts(productsData);
      setProjects(projectsRes.data?.data || projectsRes.data || []);
    } catch (error: any) {
      console.error('Failed to load options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const getAvailableStock = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    return product?.stock?.quantity || 0;
  };

  const handleCreateProduct = (searchTerm: string) => {
    // Extraire le nom et le SKU si possible (format: "Nom (SKU)")
    const skuMatch = searchTerm.match(/\(([^)]+)\)$/);
    const name = skuMatch ? searchTerm.replace(/\s*\([^)]+\)$/, '').trim() : searchTerm.trim();
    const sku = skuMatch ? skuMatch[1] : undefined;
    
    setNewProductData({ name, sku });
    setShowProductModal(true);
  };

  const handleProductCreated = async (createdProductId?: string) => {
    const savedProductData = { ...newProductData };
    setShowProductModal(false);
    setNewProductData(null);
    
    // Recharger les produits
    try {
      const productsRes = await apiClient.get('/products?limit=1000');
      const productsData = productsRes.data?.data || productsRes.data || [];
      setProducts(productsData);
      
      // Sélectionner le produit créé
      let productToSelect: Product | undefined;
      
      if (createdProductId) {
        // Utiliser l'ID directement
        productToSelect = productsData.find((p: Product) => p.id === createdProductId);
      } else if (savedProductData) {
        // Chercher par nom ou SKU
        productToSelect = productsData.find(
          (p: Product) => 
            p.name.toLowerCase() === savedProductData.name?.toLowerCase() ||
            (savedProductData.sku && p.sku?.toLowerCase() === savedProductData.sku.toLowerCase())
        );
      }
      
      if (productToSelect) {
        setFormData(prev => ({ 
          ...prev, 
          productId: productToSelect!.id,
          // S'assurer que la quantité est au moins à 1
          quantity: prev.quantity || 1,
        }));
        toast.success('Produit créé et sélectionné ! Vous pouvez maintenant l\'ajouter au panier.');
      } else {
        toast.success('Produit créé avec succès ! Veuillez le sélectionner dans la liste.');
      }
    } catch (error: any) {
      console.error('Failed to reload products:', error);
      toast.error('Produit créé mais erreur lors du rechargement. Veuillez actualiser la page.');
    }
  };

  const handleAddToCart = () => {
    if (!formData.productId || formData.quantity < 1) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    
    if (!product) {
      toast.error('Produit introuvable');
      return;
    }

    const availableStock = getAvailableStock(formData.productId);
    
    if (availableStock < formData.quantity) {
      toast.error(`Stock insuffisant. Disponible: ${availableStock}`);
      return;
    }

    // Check if item already in cart
    const existingIndex = cart.findIndex(
      item => item.productId === formData.productId
    );

    if (existingIndex >= 0) {
      // Update quantity
      const newQuantity = cart[existingIndex].quantity + formData.quantity;
      if (newQuantity > availableStock) {
        toast.error(`Stock insuffisant. Disponible: ${availableStock}`);
        return;
      }
      setCart(prev => prev.map((item, index) => 
        index === existingIndex 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      // Add new item
      setCart(prev => [...prev, {
        productId: formData.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: formData.quantity,
        availableStock,
      }]);
    }

    // Reset form
    setFormData(prev => ({
      ...prev,
      productId: '',
      quantity: 1,
    }));

    toast.success('Produit ajouté au panier');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.success('Produit retiré du panier');
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }

    const item = cart[index];
    if (newQuantity > item.availableStock) {
      toast.error(`Stock insuffisant. Disponible: ${item.availableStock}`);
      return;
    }

    setCart(prev => prev.map((cartItem, i) => 
      i === index ? { ...cartItem, quantity: newQuantity } : cartItem
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreate) {
      toast.error('Vous n\'avez pas la permission de créer des réservations');
      return;
    }

    if (cart.length === 0) {
      toast.error('Veuillez ajouter au moins un produit au panier');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      if (formData.projectId) {
        payload.projectId = formData.projectId;
      }

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      if (formData.notes) {
        payload.notes = formData.notes;
      }

      const response = await apiClient.post('/reservations/bulk', payload);
      toast.success(`Réservation créée avec succès (${response.data.totalItems} produit(s))`);
      router.push('/reservations');
    } catch (error: any) {
      console.error('Failed to create reservation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingOptions) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <SkeletonLoader className="h-8 w-48 mb-6" />
        <SkeletonLoader className="h-96" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RouteGuard requirements={{ requirePermissions: ['reservations.create'] }}>
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/reservations"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux réservations
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouvelle Réservation
          </h1>
          <p className="text-gray-600">
            Ajoutez des produits au panier pour créer une réservation groupée
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Products Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ajouter un Produit
              </h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleAddToCart(); }} className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                    Produit <span className="text-red-500">*</span>
                  </label>
                  <Autocomplete
                    options={products.map((product) => ({
                      value: product.id,
                      label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
                    }))}
                    value={formData.productId}
                    onChange={(value) => setFormData({ ...formData, productId: value })}
                    placeholder="Rechercher un produit..."
                    className="w-full"
                    onCreateNew={handleCreateProduct}
                    createNewLabel="Créer le produit"
                  />
                </div>

                {/* Display stock info */}
                {formData.productId && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Stock disponible: {getAvailableStock(formData.productId)}
                    </p>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    required
                    min="1"
                    max={formData.productId ? getAvailableStock(formData.productId) : undefined}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Ajouter au Panier
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Cart and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Panier ({cart.length} {cart.length === 1 ? 'produit' : 'produits'})
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Votre panier est vide</p>
                  <p className="text-sm mt-2">Ajoutez des produits pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.productName}</h3>
                          {item.productSku && (
                            <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                          )}
                          {/* Warehouse name removed from display */}
                          <p className="text-sm text-gray-500 mt-1">
                            Stock disponible: {item.availableStock}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                              disabled={item.quantity >= item.availableStock}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Retirer du panier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reservation Details Form */}
            {cart.length > 0 && (
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Détails de la Réservation
                </h2>

                {/* Project Selection (Optional) */}
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                    Projet (optionnel)
                  </label>
                  <Autocomplete
                    options={[
                      { value: '', label: 'Aucun projet' },
                      ...projects.map((project) => ({
                        value: project.id,
                        label: project.name,
                      })),
                    ]}
                    value={formData.projectId}
                    onChange={(value) => setFormData({ ...formData, projectId: value })}
                    placeholder="Rechercher un projet..."
                    className="w-full"
                    allowClear={true}
                  />
                </div>

                {/* Expiration Date (Optional) */}
                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration (optionnel)
                  </label>
                  <input
                    type="datetime-local"
                    id="expiresAt"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    maxLength={250}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ajoutez des notes sur cette réservation..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.notes.length}/250 caractères
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Link
                    href="/reservations"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Annuler et retourner à la liste des réservations"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || cart.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={cart.length === 0 ? 'Ajoutez au moins un produit au panier' : 'Créer la réservation avec les produits du panier'}
                  >
                    {loading ? 'Création...' : `Créer la Réservation (${cart.length} produit${cart.length > 1 ? 's' : ''})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création de produit */}
      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setNewProductData(null);
        }}
        onSuccess={handleProductCreated}
        productId={null}
        initialData={newProductData || undefined}
      />
    </RouteGuard>
  );
}
