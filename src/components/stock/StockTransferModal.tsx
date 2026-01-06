'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Modal from '../Modal';
import { extractCollection } from '@/types/api';

const transferSchema = z.object({
  productId: z.string().min(1, 'Le produit est requis'),
  fromWarehouseId: z.string().min(1, "L'entrepôt source est requis"),
  toWarehouseId: z.string().min(1, "L'entrepôt de destination est requis"),
  quantity: z.number().int().min(1, 'La quantité doit être positive'),
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: "L'entrepôt source et de destination doivent être différents",
  path: ['toWarehouseId'],
});

type TransferFormData = z.infer<typeof transferSchema>;

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

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProductId?: string;
}

export default function StockTransferModal({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
}: StockTransferModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [availableStock, setAvailableStock] = useState<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      productId: initialProductId || '',
      fromWarehouseId: '',
      toWarehouseId: '',
      quantity: 1,
    },
  });

  const productId = watch('productId');
  const fromWarehouseId = watch('fromWarehouseId');
  const quantity = watch('quantity');

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (initialProductId) {
        setValue('productId', initialProductId);
      }
    } else {
      reset();
      setAvailableStock(0);
    }
  }, [isOpen, initialProductId, setValue, reset]);

  useEffect(() => {
    if (productId && fromWarehouseId) {
      loadAvailableStock();
    } else {
      setAvailableStock(0);
    }
  }, [productId, fromWarehouseId]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        apiClient.get('/products'),
        // COMMENTED: Multiple warehouses - transfer not available with single warehouse
        apiClient.get('/warehouses'), // Still loading but transfer disabled
      ]);
      setProducts(extractCollection<Product>(productsRes.data));
      // COMMENTED: Multiple warehouses - storing but transfer disabled
      setWarehouses(extractCollection<Warehouse>(warehousesRes.data));
    } catch (error) {
      console.error('Failed to load options:', error);
      toast.error('Échec du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadAvailableStock = async () => {
    if (!productId || !fromWarehouseId) return;
    try {
      const response = await apiClient.get(`/products/${productId}`);
      const product = response.data;
      const stock = product.warehouseStock?.find(
        (ws: any) => ws.warehouseId === fromWarehouseId,
      );
      setAvailableStock(stock?.quantity || 0);
    } catch (error) {
      console.error('Failed to load stock:', error);
      setAvailableStock(0);
    }
  };

  const onSubmit = async (data: TransferFormData) => {
    if (data.quantity > availableStock) {
      toast.error(`Stock insuffisant. Disponible: ${availableStock}`);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/stock-movements/transfer', {
        productId: data.productId,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        quantity: data.quantity,
        reason: 'TRANSFER',
      });
      toast.success('Transfert de stock créé avec succès!');
      onClose();
      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Échec du transfert de stock';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setAvailableStock(0);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Transfert de stock">
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

        {/* COMMENTED: Warehouse Selection - Transfer disabled with single warehouse */}
        {/* From Warehouse */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrepôt source <span className="text-red-500">*</span>
          </label>
          <select
            {...register('fromWarehouseId')}
            disabled={loadingOptions}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sélectionner l'entrepôt source</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
          {errors.fromWarehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.fromWarehouseId.message}</p>
          )}
          {fromWarehouseId && availableStock >= 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Stock disponible: <span className="font-semibold">{availableStock}</span>
            </p>
          )}
        </div> */}

        {/* To Warehouse */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrepôt de destination <span className="text-red-500">*</span>
          </label>
          <select
            {...register('toWarehouseId')}
            disabled={loadingOptions}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sélectionner l'entrepôt de destination</option>
            {warehouses
              .filter((w) => w.id !== fromWarehouseId)
              .map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
          </select>
          {errors.toWarehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.toWarehouseId.message}</p>
          )}
        </div> */}
        
        {/* Message: Transfer disabled with single warehouse */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-700">
            <strong>Transfert désactivé:</strong> Le transfert entre entrepôts n'est pas disponible avec un seul entrepôt (MAIN).
          </p>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max={availableStock}
            {...register('quantity', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Entrez la quantité"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
          {fromWarehouseId && availableStock > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Maximum: {availableStock} unités disponibles
            </p>
          )}
          {quantity > availableStock && (
            <p className="mt-1 text-sm text-red-600">
              La quantité ne peut pas dépasser le stock disponible ({availableStock})
            </p>
          )}
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
            disabled={true} // COMMENTED: Transfer disabled with single warehouse
            className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
            title="Transfert désactivé avec un seul entrepôt"
          >
            Transfert désactivé
          </button>
        </div>
      </form>
    </Modal>
  );
}

