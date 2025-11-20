'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { downloadSalesOrderPDF } from '@/lib/pdf';
import { useToast } from '@/contexts/ToastContext';
// Layout is handled by (shared)/layout.tsx
import Link from 'next/link';

interface SalesOrder {
  id: string;
  number: string;
  status: string;
  deliveryDate?: string;
  customer: { id: string; name: string };
  createdBy?: { firstName: string; lastName: string };
  lines: Array<{
    id: string;
    product: { id: string; name: string; sku: string };
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await apiClient.get(`/sales/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load sales order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading sales order...</div>
        </div>
      );
  }

  if (!order) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-500">Sales order not found</p>
          <Link href="/sales" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Sales Orders
          </Link>
        </div>
      );
  }

  const totalAmount = order.lines.reduce(
    (sum, line) => sum + line.quantity * Number(line.unitPrice),
    0,
  );

  return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <Link href="/sales" className="text-primary-600 hover:text-primary-900">
            ← Back to Sales Orders
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{order.number}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setDownloadingPDF(true);
                  try {
                    await downloadSalesOrderPDF(id);
                    toast.success('PDF downloaded successfully');
                  } catch (error) {
                    toast.error('Failed to download PDF');
                  } finally {
                    setDownloadingPDF(false);
                  }
                }}
                disabled={downloadingPDF}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm disabled:opacity-50"
              >
                {downloadingPDF ? 'Downloading...' : '📄 Download PDF'}
              </button>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                  order.status,
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customer.name}</dd>
              </div>
              {order.deliveryDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Delivery Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {order.createdBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.createdBy.firstName} {order.createdBy.lastName}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Order Lines</h3>
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
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.lines.map((line) => {
                    const lineTotal = line.quantity * Number(line.unitPrice);
                    return (
                      <tr key={line.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {line.product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${Number(line.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Link
                href={`/sales/${id}/deliver`}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 inline-block"
              >
                Deliver Order
              </Link>
            </div>
          )}
        </div>
      </div>
    );
}

