'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Modal from '../Modal';
import ImageUpload from '../ImageUpload';
import {
  CategoryOption,
  SupplierSummary,
  extractCollection,
} from '@/types/api';

const productSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis'),
  sku: z.string().optional(), // Référence (optional)
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(), // Fournisseur (optional)
  purchasePrice: z.number().min(0, 'Le prix doit être positif'),
  salePrice: z.number().min(0, 'Le prix doit être positif'),
  minStock: z.number().int().min(0, 'Le seuil doit être non négatif'),
  images: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  purchasePrice: number | string;
  salePrice: number | string;
  minStock: number;
  images?: string[] | null;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productId?: string | null; // If provided, we're editing
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
}: ProductFormModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);

  const isEditMode = !!productId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      images: [],
    },
  });

  const images = watch('images') || [];

  // Load categories and suppliers
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // Load product data if editing
  useEffect(() => {
    if (isOpen && productId) {
      loadProduct();
    } else if (isOpen && !productId) {
      // Reset form for new product
      reset({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        categoryId: '',
        supplierId: '',
        purchasePrice: 0,
        salePrice: 0,
        minStock: 0,
        images: [],
      });
      setError('');
    }
  }, [isOpen, productId, reset]);

  const loadOptions = async () => {
    try {
      const [categoriesRes, suppliersRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/suppliers'),
      ]);
      setCategories(extractCollection<CategoryOption>(categoriesRes.data));
      setSuppliers(extractCollection<SupplierSummary>(suppliersRes.data));
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadProduct = async () => {
    if (!productId) return;

    setLoadingProduct(true);
    try {
      const response = await apiClient.get<Product>(`/products/${productId}`);
      const product = response.data;

      reset({
        name: product.name,
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        purchasePrice: Number(product.purchasePrice),
        salePrice: Number(product.salePrice),
        minStock: product.minStock,
        images: product.images || [],
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Échec du chargement du produit';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingProduct(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    setError('');

    try {
      // Remove empty optional fields before sending
      const payload = {
        name: data.name,
        sku: data.sku || undefined,
        supplierId: data.supplierId || undefined,
        categoryId: data.categoryId || undefined,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        minStock: data.minStock,
        images: data.images && data.images.length > 0 ? data.images : undefined,
      };

      if (isEditMode && productId) {
        await apiClient.put(`/products/${productId}`, payload);
        toast.success('Produit mis à jour avec succès!');
      } else {
        await apiClient.post('/products', payload);
        toast.success('Produit créé avec succès!');
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
        (isEditMode ? 'Échec de la mise à jour du produit' : 'Échec de la création du produit');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !loadingProduct) {
      reset();
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Modifier le produit' : 'Nouveau produit'}
      size="xl"
    >
      {loadingProduct ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du produit...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Nom de produit - Required */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de produit <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="Entrez le nom du produit"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Fournisseur - Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur
              </label>
              <select
                {...register('supplierId')}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Référence (SKU) - Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence
              </label>
              <input
                {...register('sku')}
                placeholder="Référence du produit (optionnel)"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={isEditMode} // Disable editing SKU when editing
              />
              {!isEditMode && (
                <p className="mt-1 text-xs text-gray-500">
                  Laissé vide, une référence sera générée automatiquement
                </p>
              )}
            </div>

            {/* Prix d'achat - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix d'achat <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('purchasePrice', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              {errors.purchasePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.purchasePrice.message}</p>
              )}
            </div>

            {/* Prix de vente - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix de vente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('salePrice', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              {errors.salePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.salePrice.message}</p>
              )}
            </div>

            {/* Seuil - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil de stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                {...register('minStock', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {errors.minStock && (
                <p className="mt-1 text-sm text-red-600">{errors.minStock.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Quantité minimale en stock avant alerte
              </p>
            </div>

            {/* Catégorie - Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                {...register('categoryId')}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description - Optional */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Description du produit (optionnel)"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Images */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images du produit
              </label>
              <ImageUpload
                value={images}
                onChange={(urls) => setValue('images', urls)}
                maxImages={5}
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || loadingProduct}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || loadingProduct}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm hover:shadow-md"
            >
              {loading
                ? isEditMode
                  ? 'Mise à jour...'
                  : 'Création...'
                : isEditMode
                ? 'Mettre à jour'
                : 'Créer le produit'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

