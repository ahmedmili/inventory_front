'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';
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
  warehouseStock?: Array<{
    warehouseId: string;
    warehouse: { id: string; name: string };
    quantity: number;
  }>;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface CartItem {
  productId: string;
  productName: string;
  productSku?: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  availableStock: number;
}

interface ReservationCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
  onSuccess?: () => void;
}

export default function ReservationCartModal({
  isOpen,
  onClose,
  initialProductId,
  onSuccess,
}: ReservationCartModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const { cart, setCart, clearCart } = useReservationCart();

  const [formData, setFormData] = useState({
    productId: initialProductId || '',
    warehouseId: '',
    projectId: '',
    quantity: 1,
    expiresAt: '',
    notes: '',
  });

  const canCreate = hasPermission(user, 'reservations.create');

  // Load initial product if provided
  useEffect(() => {
    if (initialProductId && isOpen) {
      setFormData(prev => ({ ...prev, productId: initialProductId }));
    }
  }, [initialProductId, isOpen]);

  // Load options when modal opens
  useEffect(() => {
    if (isOpen && canCreate) {
      loadOptions();
    }
  }, [isOpen, canCreate]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [productsRes, warehousesRes, projectsRes] = await Promise.all([
        apiClient.get('/products?limit=1000'),
        apiClient.get('/warehouses'),
        apiClient.get('/projects?status=ACTIVE'),
      ]);

      const productsData = productsRes.data?.data || productsRes.data || [];
      
      // Load stock for each product
      const productsWithStock = await Promise.all(
        productsData.slice(0, 50).map(async (product: Product) => {
          try {
            const productDetail = await apiClient.get(`/products/${product.id}`);
            return productDetail.data;
          } catch {
            return product;
          }
        })
      );

      setProducts(productsWithStock);
      setWarehouses(warehousesRes.data?.data || warehousesRes.data || []);
      setProjects(projectsRes.data?.data || projectsRes.data || []);
    } catch (error: any) {
      console.error('Failed to load options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const getAvailableStock = (productId: string, warehouseId: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.warehouseStock) return 0;
    
    const stock = product.warehouseStock.find(
      ws => ws.warehouseId === warehouseId
    );
    return stock?.quantity || 0;
  };

  const handleAddToCart = () => {
    if (!formData.productId || !formData.warehouseId || formData.quantity < 1) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    const warehouse = warehouses.find(w => w.id === formData.warehouseId);
    
    if (!product || !warehouse) {
      toast.error('Produit ou entrepôt introuvable');
      return;
    }

    const availableStock = getAvailableStock(formData.productId, formData.warehouseId);
    
    if (availableStock < formData.quantity) {
      toast.error(`Stock insuffisant. Disponible: ${availableStock}`);
      return;
    }

    // Check if item already in cart
    const existingIndex = cart.findIndex(
      item => item.productId === formData.productId && item.warehouseId === formData.warehouseId
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
        warehouseId: formData.warehouseId,
        warehouseName: warehouse.name,
        quantity: formData.quantity,
        availableStock,
      }]);
    }

    // Reset form (keep project, expiresAt, notes)
    setFormData(prev => ({
      ...prev,
      productId: '',
      warehouseId: '',
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
          warehouseId: item.warehouseId,
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Réservation de Produits" size="large">
      <div className="space-y-6">
        {/* Add Product Form */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un Produit</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product Selection */}
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                Produit <span className="text-red-500">*</span>
              </label>
              <select
                id="productId"
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingOptions}
              >
                <option value="">Sélectionner un produit</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku && `(${product.sku})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Selection */}
            <div>
              <label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700 mb-2">
                Entrepôt <span className="text-red-500">*</span>
              </label>
              <select
                id="warehouseId"
                required
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingOptions}
              >
                <option value="">Sélectionner un entrepôt</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {formData.productId && formData.warehouseId && (
                <p className="mt-1 text-sm text-gray-500">
                  Stock: {getAvailableStock(formData.productId, formData.warehouseId)}
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
                max={formData.productId && formData.warehouseId ? getAvailableStock(formData.productId, formData.warehouseId) : undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={loadingOptions || !formData.productId || !formData.warehouseId}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      {item.productSku && (
                        <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Entrepôt: {item.warehouseName}
                      </p>
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

        {/* Reservation Details */}
        {cart.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Détails de la Réservation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Selection */}
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Projet (optionnel)
                </label>
                <select
                  id="projectId"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
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
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cart.length > 0 ? 'Fermer' : 'Annuler'}
          </button>
          {cart.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : `Créer la Réservation (${cart.length} produit${cart.length > 1 ? 's' : ''})`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

