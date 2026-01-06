'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useApiMutation } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
// Layout is handled by (shared)/layout.tsx
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const receiveSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  lines: z.array(
    z.object({
      lineId: z.string(),
      productId: z.string(),
      quantityReceived: z.number().int().min(1, 'Quantity must be at least 1'),
      quantityOrdered: z.number().int(),
    }),
  ),
});

type ReceiveFormData = z.infer<typeof receiveSchema>;

interface PurchaseOrder {
  id: string;
  number: string;
  status: string;
  lines: Array<{
    id: string;
    product: { id: string; name: string; sku: string };
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
  }>;
}

export default function ReceivePurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: order, loading: loadingOrder } = useApi<PurchaseOrder>(`/purchases/${id}`);
  const { mutate, loading } = useApiMutation();
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<ReceiveFormData>({
    resolver: zodResolver(receiveSchema),
  });

  const { fields } = useFieldArray({
    control,
    name: 'lines',
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (order && warehouses.length > 0) {
      const initialLines = order.lines.map((line) => ({
        lineId: line.id,
        productId: line.product.id,
        quantityReceived: Math.max(1, line.quantityOrdered - line.quantityReceived),
        quantityOrdered: line.quantityOrdered,
      }));

      // COMMENTED: Multiple warehouses - always use MAIN
      const mainWarehouse = warehouses.find((w: any) => w.code === 'MAIN') || warehouses[0];
      reset({
        warehouseId: mainWarehouse?.id || '',
        lines: initialLines,
      });
    }
  }, [order, warehouses, reset]);

  const loadWarehouses = async () => {
    try {
      // COMMENTED: Multiple warehouses - using only MAIN warehouse
      const response = await apiClient.get('/warehouses');
      const warehousesData = response.data?.data || response.data || [];
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const onSubmit = async (data: ReceiveFormData) => {
    setError('');

    try {
      // COMMENTED: Multiple warehouses - always use MAIN
      const mainWarehouse = warehouses.find((w: any) => w.code === 'MAIN') || warehouses[0];
      const warehouseId = mainWarehouse?.id || data.warehouseId;
      
      const payload = {
        warehouseId: warehouseId, // Always use MAIN
        lines: data.lines.map((line) => ({
          lineId: line.lineId,
          productId: line.productId,
          quantityReceived: line.quantityReceived,
        })),
      };
      await mutate(`/purchases/${id}/receive`, 'POST', payload);
      router.push(`/purchases/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to receive purchase order');
    }
  };

  if (loadingOrder || loadingWarehouses) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      );
  }

  if (!order) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-500">Purchase order not found</p>
        </div>
      );
  }

  const canReceive = order.status === 'VALIDATED' || order.status === 'PARTIAL';

  if (!canReceive) {
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
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            This purchase order cannot be received. Status: {order.status}
          </div>
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
          <h2 className="text-2xl font-bold mb-6">Receive Purchase Order: {order.number}</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* COMMENTED: Warehouse Selection - Using only MAIN warehouse (hidden from user) */}
            {/* Warehouse selection removed - using MAIN warehouse automatically */}

            <div>
              <h3 className="text-lg font-medium mb-4">Order Lines</h3>
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const line = order.lines.find((l) => l.id === field.lineId);
                  if (!line) return null;

                  const remaining = line.quantityOrdered - line.quantityReceived;
                  const maxQuantity = remaining;

                  return (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{line.product.name}</p>
                          <p className="text-sm text-gray-500">SKU: {line.product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Ordered: {line.quantityOrdered}
                          </p>
                          <p className="text-sm text-gray-500">
                            Already Received: {line.quantityReceived}
                          </p>
                          <p className="text-sm font-medium text-primary-600">
                            Remaining: {remaining}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity to Receive
                        </label>
                        <input
                          type="number"
                          {...register(`lines.${index}.quantityReceived`, {
                            valueAsNumber: true,
                            min: 1,
                            max: maxQuantity,
                          })}
                          min={1}
                          max={maxQuantity}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.lines?.[index]?.quantityReceived && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.lines[index]?.quantityReceived?.message}
                          </p>
                        )}
                        <input type="hidden" {...register(`lines.${index}.lineId`)} />
                        <input type="hidden" {...register(`lines.${index}.productId`)} />
                        <input type="hidden" {...register(`lines.${index}.quantityOrdered`)} />
                      </div>
                    </div>
                  );
                })}
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
                {loading ? 'Receiving...' : 'Receive Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}

