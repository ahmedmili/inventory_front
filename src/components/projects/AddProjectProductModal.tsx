'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Autocomplete from '../ui/Autocomplete';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
}

interface AddProjectProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export default function AddProjectProductModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: AddProjectProductModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      // Reset form when modal opens
      setFormData({
        productId: '',
        quantity: 1,
        notes: '',
      });
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiClient.get('/products?limit=1000');
      const productsData = response.data?.data || response.data || [];
      setProducts(productsData);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }

    if (formData.quantity < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/projects/${projectId}/products`, {
        productId: formData.productId,
        quantity: formData.quantity,
        notes: formData.notes.trim() || undefined,
      });
      
      toast.success('Produit ajouté au projet avec succès');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to add product to project:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du produit au projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un produit" size="md" variant="form">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loadingProducts}
          />
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
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ajouter des notes sur ce produit pour ce projet..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || loadingProducts || !formData.productId}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

