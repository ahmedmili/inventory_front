'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Modal from '../Modal';
import { extractCollection } from '@/types/api';

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Le produit est requis'),
  warehouseId: z.string().min(1, "L'entrepôt est requis"),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().min(1, 'La quantité doit être positive'),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface ManualStockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProductId?: string;
  initialWarehouseId?: string;
}

export default function ManualStockAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
  initialWarehouseId,
}: ManualStockAdjustmentModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'ADJUSTMENT',
      productId: initialProductId || '',
      warehouseId: initialWarehouseId || '',
    },
  });

  const movementType = watch('type');

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (initialProductId) {
        setValue('productId', initialProductId);
      }
      if (initialWarehouseId) {
        setValue('warehouseId', initialWarehouseId);
      }
    } else {
      reset();
    }
  }, [isOpen, initialProductId, initialWarehouseId, setValue, reset]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/warehouses'),
      ]);
      setProducts(extractCollection<Product>(productsRes.data));
      setWarehouses(extractCollection<Warehouse>(warehousesRes.data));
    } catch (error) {
      console.error('Failed to load options:', error);
      toast.error('Échec du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    setLoading(true);
    try {
      await apiClient.post('/stock-movements', {
        productId: data.productId,
        warehouseId: data.warehouseId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason || undefined,
        reference: data.reference || undefined,
      });
      toast.success('Mouvement de stock créé avec succès!');
      onClose();
      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Échec de la création du mouvement';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajustement manuel de stock">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produit <span className="text-red-500">*</span>
          </label>
          <select
            {...register('productId')}
            disabled={loadingOptions}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sélectionner un produit</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} {product.sku && `(${product.sku})`}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="mt-1 text-sm text-red-600">{errors.productId.message}</p>
          )}
        </div>

        {/* Warehouse Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrepôt <span className="text-red-500">*</span>
          </label>
          <select
            {...register('warehouseId')}
            disabled={loadingOptions}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sélectionner un entrepôt</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
          {errors.warehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
          )}
        </div>

        {/* Movement Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de mouvement <span className="text-red-500">*</span>
          </label>
          <select
            {...register('type')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ADJUSTMENT">Ajustement</option>
            <option value="IN">Ajout (IN)</option>
            <option value="OUT">Retrait (OUT)</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            {...register('quantity', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Entrez la quantité"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Raison (optionnel)</label>
          <input
            type="text"
            {...register('reason')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: Correction d'inventaire, Retour client..."
          />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Référence (optionnel)
          </label>
          <input
            type="text"
            {...register('reference')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Numéro de référence"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || loadingOptions}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le mouvement'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

