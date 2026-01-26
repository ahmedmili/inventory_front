'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Autocomplete from '../ui/Autocomplete';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { useReservationCart } from '@/hooks/useReservationCart';

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

interface ReservationCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
  initialProjectId?: string; // Pre-fill project when creating reservation from project page
  onSuccess?: () => void;
}

export default function ReservationCartModal({
  isOpen,
  onClose,
  initialProductId,
  initialProjectId,
  onSuccess,
}: ReservationCartModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const { cart, setCart, clearCart } = useReservationCart();

  const [formData, setFormData] = useState({
    productId: initialProductId || '',
    projectId: initialProjectId || '', // Pre-fill project if provided
    quantity: 1,
    expiresAt: '',
    notes: '',
  });

  const canCreate = hasPermission(user, 'reservations.create');

  // Load initial product and project if provided
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        productId: initialProductId || prev.productId,
        projectId: initialProjectId || prev.projectId, // Pre-fill project
      }));
    }
  }, [initialProductId, initialProjectId, isOpen]);

  // Load options when modal opens
  useEffect(() => {
    if (isOpen && canCreate) {
      loadOptions();
    }
  }, [isOpen, canCreate]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      // If initialProjectId is provided, load that specific project too
      const projectsPromise = initialProjectId
        ? Promise.all([
            apiClient.get('/projects?status=ACTIVE'),
            apiClient.get(`/projects/${initialProjectId}`).catch(() => null), // Load specific project even if not active
          ]).then(([activeRes, specificRes]) => {
            const activeProjects = activeRes.data?.data || activeRes.data || [];
            const specificProject = specificRes?.data;
            // Merge and deduplicate
            const allProjects = [...activeProjects];
            if (specificProject && !allProjects.find(p => p.id === specificProject.id)) {
              allProjects.push(specificProject);
            }
            return { data: allProjects };
          })
        : apiClient.get('/projects?status=ACTIVE');
      
      const [productsRes, projectsRes] = await Promise.all([
        apiClient.get('/products?limit=1000'),
        projectsPromise,
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

    // Reset form (keep project, expiresAt, notes)
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

  const handleSubmit = async () => {
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

      // Always include projectId if provided (from initialProjectId or user selection)
      if (formData.projectId || initialProjectId) {
        payload.projectId = formData.projectId || initialProjectId;
      }

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      if (formData.notes) {
        payload.notes = formData.notes;
      }

      const response = await apiClient.post('/reservations/bulk', payload);
      
      // Clear cart and localStorage
      clearCart();
      
      toast.success(`Réservation créée avec succès (${response.data.totalItems} produit(s))`);
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate to reservations page
      router.push('/reservations');
    } catch (error: any) {
      console.error('Failed to create reservation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!canCreate) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Réservation de Produits" size="lg">
      <div className="space-y-6">
        {/* Add Product Form */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un Produit</h3>
          
          <div className="space-y-4">
            {/* Product Selection with Autocomplete */}
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
                disabled={loadingOptions}
              />
              {/* Display stock info */}
              {formData.productId && (
                <p className="mt-2 text-sm text-gray-600">
                  Stock disponible: <span className="font-semibold">{getAvailableStock(formData.productId)}</span>
                </p>
              )}
            </div>

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
          </div>

          <button
            onClick={handleAddToCart}
            disabled={loadingOptions || !formData.productId}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !formData.productId
                ? 'Sélectionnez un produit'
                : 'Ajouter ce produit au panier de réservation'
            }
          >
            Ajouter au Panier
          </button>
        </div>

        {/* Cart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Panier ({cart.length} {cart.length === 1 ? 'produit' : 'produits'})
          </h3>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p>Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.productName}</h4>
                      {item.productSku && (
                        <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                      )}
                      {/* Warehouse name removed from display */}
                      <p className="text-sm text-gray-500 mt-1">
                        Stock disponible: {item.availableStock}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Diminuer la quantité"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={
                            item.quantity >= item.availableStock
                              ? `Stock maximum disponible: ${item.availableStock}`
                              : 'Augmenter la quantité'
                          }
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(index)}
                        className="text-red-600 hover:text-red-800 p-2 transition-colors"
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

        {/* Reservation Details */}
        {cart.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Détails de la Réservation</h3>
            
            <div className="space-y-4">
              {/* Project Selection */}
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Projet {initialProjectId ? '(pré-sélectionné)' : '(optionnel)'}
                </label>
                {initialProjectId ? (
                  // Display selected project (read-only) when opened from project page
                  <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                    <p className="text-sm font-medium text-blue-900">
                      {projects.find(p => p.id === initialProjectId)?.name || 'Projet sélectionné'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Ce projet est automatiquement associé à cette réservation
                    </p>
                  </div>
                ) : (
                  // Allow selection if no initial project - using Autocomplete
                  <Autocomplete
                    options={[
                      { value: '', label: 'Aucun projet' },
                      ...projects.map((project) => ({
                        value: project.id,
                        label: project.name,
                      })),
                    ]}
                    value={formData.projectId || ''}
                    onChange={(value) => setFormData({ ...formData, projectId: value || '' })}
                    placeholder="Rechercher un projet..."
                    className="w-full"
                    allowClear={true}
                  />
                )}
              </div>

              {/* Expiration Date */}
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
            </div>

            {/* Notes */}
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
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            title={cart.length > 0 ? 'Fermer le panier' : 'Annuler et fermer'}
          >
            {cart.length > 0 ? 'Fermer' : 'Annuler'}
          </button>
          {cart.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              title="Créer la réservation avec les produits du panier"
            >
              {loading ? 'Création...' : `Créer la Réservation (${cart.length} produit${cart.length > 1 ? 's' : ''})`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

