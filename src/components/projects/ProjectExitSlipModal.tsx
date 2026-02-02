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
  stock?: { quantity: number };
}

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
}

interface ProjectExitSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export default function ProjectExitSlipModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess,
}: ProjectExitSlipModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      setLines([]);
      setCurrentProductId('');
      setCurrentQuantity(1);
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

  const getAvailableStock = (productId: string): number => {
    const product = products.find((p) => p.id === productId);
    return product?.stock?.quantity ?? 0;
  };

  const handleAddLine = () => {
    if (!currentProductId) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    const product = products.find((p) => p.id === currentProductId);
    const available = getAvailableStock(currentProductId);
    if (currentQuantity < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }
    if (currentQuantity > available) {
      toast.error(`Stock insuffisant (disponible: ${available})`);
      return;
    }
    if (lines.some((l) => l.productId === currentProductId)) {
      toast.error('Ce produit est déjà dans la liste');
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        productId: currentProductId,
        productName: product!.name + (product!.sku ? ` (${product!.sku})` : ''),
        quantity: currentQuantity,
      },
    ]);
    setCurrentProductId('');
    setCurrentQuantity(1);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error('Ajoutez au moins un produit au bon de sortie');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/projects/${projectId}/exit-slip`, {
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      toast.success('Bon de sortie créé avec succès. Le stock a été décrémenté.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create exit slip:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création du bon de sortie');
    } finally {
      setLoading(false);
    }
  };

  const remainingProducts = products.filter((p) => !lines.some((l) => l.productId === p.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un bon de sortie"
      variant="form"
      size="lg"
    >
      <p className="text-sm text-gray-600 mb-4">
        Sortie de stock immédiate et définitive, liée au projet <strong>{projectName}</strong>.
        Les mouvements seront enregistrés dans l&apos;historique.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
            <Autocomplete
              options={remainingProducts.map((p) => ({
                value: p.id,
                label: `${p.name}${p.sku ? ` (${p.sku})` : ''} - Stock: ${getAvailableStock(p.id)}`,
              }))}
              value={currentProductId}
              onChange={(value) => setCurrentProductId(value)}
              placeholder="Rechercher un produit..."
              disabled={loadingProducts}
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              type="number"
              min={1}
              max={currentProductId ? getAvailableStock(currentProductId) : undefined}
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full border border-gray-300 rounded-md px-2 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddLine}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter
          </button>
        </div>

        {lines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantité</th>
                  <th className="px-4 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lines.map((line, index) => (
                  <tr key={`${line.productId}-${index}`}>
                    <td className="px-4 py-2 text-sm text-gray-900">{line.productName}</td>
                    <td className="px-4 py-2 text-sm text-right">{line.quantity}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || lines.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le bon de sortie'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
