'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  expectedDate: z.string().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantityOrdered: z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Price must be positive'),
      }),
    )
    .min(1, 'At least one line item is required'),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string }>>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      lines: [{ productId: '', quantityOrdered: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        apiClient.get('/suppliers'),
        apiClient.get('/products'),
      ]);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/purchases', data);
      router.push(`/purchases/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-900"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Create Purchase Order</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supplier *
                </label>
                <select
                  {...register('supplierId')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Date
                </label>
                <input
                  type="date"
                  {...register('expectedDate')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Order Lines</h3>
                <button
                  type="button"
                  onClick={() => append({ productId: '', quantityOrdered: 1, unitPrice: 0 })}
                  className="text-sm text-primary-600 hover:text-primary-900"
                >
                  + Add Line
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-md"
                  >
                    <div className="col-span-5">
                      <label className="block text-sm font-medium text-gray-700">Product *</label>
                      <select
                        {...register(`lines.${index}.productId`)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[index]?.productId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.productId?.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        {...register(`lines.${index}.quantityOrdered`, { valueAsNumber: true })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.lines?.[index]?.quantityOrdered && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.quantityOrdered?.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.lines?.[index]?.unitPrice && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.unitPrice?.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 flex items-end">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.lines && (
                <p className="mt-2 text-sm text-red-600">{errors.lines.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

