'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const salesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Price must be positive'),
      }),
    )
    .min(1, 'At least one line item is required'),
});

type SalesOrderFormData = z.infer<typeof salesOrderSchema>;

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string; salePrice: number }>>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      lines: [{ productId: '', quantity: 1, unitPrice: 0 }],
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
      const [customersRes, productsRes] = await Promise.all([
        apiClient.get('/customers'),
        apiClient.get('/products'),
      ]);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`lines.${index}.unitPrice`, product.salePrice);
    }
  };

  const onSubmit = async (data: SalesOrderFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/sales', data);
      router.push(`/sales/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sales order');
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
          <h2 className="text-2xl font-bold mb-6">Create Sales Order</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer *
                </label>
                <select
                  {...register('customerId')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Order Lines</h3>
                <button
                  type="button"
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
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
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku}) - ${product.salePrice}
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
                        {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.lines?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.quantity?.message}
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
                {loading ? 'Creating...' : 'Create Sales Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

