'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { downloadPurchaseOrderPDF } from '@/lib/pdf';
import { useToast } from '@/contexts/ToastContext';
// Layout is handled by (shared)/layout.tsx
import Link from 'next/link';

interface PurchaseOrder {
  id: string;
  number: string;
  status: string;
  expectedDate?: string;
  receivedDate?: string;
  supplier: { id: string; name: string };
  createdBy?: { firstName: string; lastName: string };
  lines: Array<{
    id: string;
    product: { id: string; name: string; sku: string };
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await apiClient.get(`/purchases/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      VALIDATED: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading purchase order...</div>
        </div>
      );
  }

  if (!order) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-500">Purchase order not found</p>
          <Link href="/purchases" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Purchase Orders
          </Link>
        </div>
      );
  }

  const totalAmount = order.lines.reduce(
    (sum, line) => sum + line.quantityOrdered * Number(line.unitPrice),
    0,
  );

  return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <Link href="/purchases" className="text-primary-600 hover:text-primary-900">
            ← Back to Purchase Orders
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
                    await downloadPurchaseOrderPDF(id);
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
                <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.supplier.name}</dd>
              </div>
              {order.expectedDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expected Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(order.expectedDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {order.receivedDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Received Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(order.receivedDate).toLocaleDateString()}
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
                      Quantity Ordered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity Received
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
                    const lineTotal = line.quantityOrdered * Number(line.unitPrice);
                    const receivedPercent =
                      (line.quantityReceived / line.quantityOrdered) * 100;
                    return (
                      <tr key={line.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {line.product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.quantityOrdered}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">
                              {line.quantityReceived}
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${Math.min(receivedPercent, 100)}%` }}
                              />
                            </div>
                          </div>
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
                    <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
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

          {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Link
                href={`/purchases/${id}/receive`}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 inline-block"
              >
                Receive Order
              </Link>
            </div>
          )}
        </div>
      </div>
    );
}

