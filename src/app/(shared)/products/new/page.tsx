'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
// Layout is handled by (shared)/layout.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/contexts/ToastContext';
import ImageUpload from '@/components/ImageUpload';
import RouteGuard from '@/components/guards/RouteGuard';
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

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      images: [],
    },
  });

  const images = watch('images') || [];

  useEffect(() => {
    loadOptions();
  }, []);

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

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    setError('');

    try {
      // Remove empty optional fields before sending
      const payload = {
        ...data,
        sku: data.sku || undefined, // Send undefined if empty
        supplierId: data.supplierId || undefined,
        categoryId: data.categoryId || undefined,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
      };
      
      await apiClient.post('/products', payload);
      toast.success('Produit créé avec succès!');
      router.push('/products');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Échec de la création du produit';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requirePermissions: ['products.create'],
      }}
    >
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-900 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Nouveau Produit</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                />
                <p className="mt-1 text-xs text-gray-500">
                  Laissé vide, une référence sera générée automatiquement
                </p>
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
            </div>

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

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm hover:shadow-md"
              >
                {loading ? 'Création...' : 'Créer le produit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
}

