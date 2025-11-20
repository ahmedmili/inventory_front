'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useApiMutation } from '@/hooks/useApi';
// Layout is handled by (shared)/layout.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  location: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function EditWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: warehouse, loading: loadingData } = useApi<WarehouseFormData>(`/warehouses/${id}`);
  const { mutate, loading } = useApiMutation();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        name: warehouse.name || '',
        code: warehouse.code || '',
        location: warehouse.location || '',
      });
    }
  }, [warehouse, reset]);

  const onSubmit = async (data: WarehouseFormData) => {
    setError('');

    try {
      await mutate(`/warehouses/${id}`, 'PUT', data);
      router.push(`/warehouses/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update warehouse');
    }
  };

  if (loadingData) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      );
  }

  return (
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
          <h2 className="text-2xl font-bold mb-6">Edit Warehouse</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Warehouse Name *
                </label>
                <input
                  {...register('name')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Warehouse Code *
                </label>
                <input
                  {...register('code')}
                  placeholder="e.g., MAIN, WH-001"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  {...register('location')}
                  placeholder="e.g., Building A, Floor 2"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
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
                {loading ? 'Updating...' : 'Update Warehouse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}

