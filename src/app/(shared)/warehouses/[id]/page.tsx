'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
// Layout is handled by (shared)/layout.tsx
import Link from 'next/link';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  stocks: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      sku: string;
      barcode: string;
      minStock: number;
    };
  }>;
}

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarehouse();
  }, [id]);

  const loadWarehouse = async () => {
    try {
      const response = await apiClient.get(`/warehouses/${id}`);
      setWarehouse(response.data);
    } catch (error) {
      console.error('Failed to load warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading warehouse...</div>
        </div>
      );
  }

  if (!warehouse) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-500">Warehouse not found</p>
          <Link href="/warehouses" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Warehouses
          </Link>
        </div>
      );
  }

  return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <Link href="/warehouses" className="text-primary-600 hover:text-primary-900">
            ← Back to Warehouses
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{warehouse.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Code: {warehouse.code}</p>
            </div>
            <Link
              href={`/warehouses/${id}/edit`}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Edit
            </Link>
          </div>

          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {warehouse.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{warehouse.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Products</dt>
                <dd className="mt-1 text-sm text-gray-900">{warehouse.stocks.length}</dd>
              </div>
            </dl>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Stock Levels</h3>
            {warehouse.stocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Min Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouse.stocks.map((stock) => {
                      const isLowStock = stock.quantity <= stock.product.minStock;
                      return (
                        <tr key={stock.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stock.product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stock.product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stock.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stock.product.minStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isLowStock ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No stock in this warehouse</p>
            )}
          </div>
        </div>
      </div>
    );
}

