'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useApiMutation } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
// Layout is handled by (shared)/layout.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const deliverSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
});

type DeliverFormData = z.infer<typeof deliverSchema>;

interface SalesOrder {
  id: string;
  number: string;
  status: string;
  lines: Array<{
    id: string;
    product: { id: string; name: string; sku: string };
    quantity: number;
    unitPrice: number;
  }>;
}

export default function DeliverSalesOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: order, loading: loadingOrder } = useApi<SalesOrder>(`/sales/${id}`);
  const { mutate, loading } = useApiMutation();
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DeliverFormData>({
    resolver: zodResolver(deliverSchema),
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      // COMMENTED: Multiple warehouses - always use MAIN
      const mainWarehouse = warehouses.find((w: any) => w.code === 'MAIN') || warehouses[0];
      reset({
        warehouseId: mainWarehouse?.id || '',
      });
    }
  }, [warehouses, reset]);

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

  const onSubmit = async (data: DeliverFormData) => {
    setError('');

    try {
      // COMMENTED: Multiple warehouses - always use MAIN
      const mainWarehouse = warehouses.find((w: any) => w.code === 'MAIN') || warehouses[0];
      const warehouseId = mainWarehouse?.id || data.warehouseId;
      
      await mutate(`/sales/${id}/deliver`, 'POST', { warehouseId }); // Always use MAIN
      router.push(`/sales/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deliver sales order');
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
          <p className="text-gray-500">Sales order not found</p>
        </div>
      );
  }

  const canDeliver = order.status === 'CONFIRMED';

  if (!canDeliver) {
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
            This sales order cannot be delivered. Status: {order.status}
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
          <h2 className="text-2xl font-bold mb-6">Deliver Sales Order: {order.number}</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Order Lines</h3>
            <div className="space-y-2">
              {order.lines.map((line) => (
                <div key={line.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{line.product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {line.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Quantity: {line.quantity}</p>
                    <p className="text-sm font-medium">
                      ${(line.quantity * Number(line.unitPrice)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* COMMENTED: Warehouse Selection - Using only MAIN warehouse (hidden from user) */}
            {/* Warehouse selection removed - using MAIN warehouse automatically */}

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
                {loading ? 'Delivering...' : 'Deliver Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}

