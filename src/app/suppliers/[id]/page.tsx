'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  purchases?: Array<{
    id: string;
    number: string;
    status: string;
    expectedDate?: string;
    receivedDate?: string;
    createdAt: string;
    lines: Array<{
      id: string;
      quantityOrdered: number;
      quantityReceived: number;
      unitPrice: number;
      product: { name: string; sku: string };
    }>;
  }>;
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: supplier, loading, error } = useApi<Supplier>(`/suppliers/${id}`);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading supplier...</div>
        </div>
      </Layout>
    );
  }

  if (error || !supplier) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Supplier not found</p>
          <Link href="/suppliers" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Suppliers
          </Link>
        </div>
      </Layout>
    );
  }

  const totalPurchases = supplier.purchases?.length || 0;
  const totalValue = supplier.purchases?.reduce((sum, purchase) => {
    return sum + purchase.lines.reduce((lineSum, line) => {
      return lineSum + (line.quantityOrdered * line.unitPrice);
    }, 0);
  }, 0) || 0;

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4 flex justify-between items-center">
          <Link href="/suppliers" className="text-primary-600 hover:text-primary-900">
            ← Back to Suppliers
          </Link>
          <Link
            href={`/suppliers/${id}/edit`}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Edit Supplier
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {supplier.email && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{supplier.email}</dd>
                </>
              )}
              {supplier.phone && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{supplier.phone}</dd>
                </>
              )}
              {supplier.address && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">{supplier.address}</dd>
                </>
              )}
              <dt className="text-sm font-medium text-gray-500">Total Purchase Orders</dt>
              <dd className="text-sm text-gray-900">{totalPurchases}</dd>
              <dt className="text-sm font-medium text-gray-500">Total Purchase Value</dt>
              <dd className="text-sm text-gray-900">${totalValue.toFixed(2)}</dd>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Purchase History</h3>
          </div>
          {supplier.purchases && supplier.purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplier.purchases.map((purchase) => {
                    const total = purchase.lines.reduce(
                      (sum, line) => sum + line.quantityOrdered * line.unitPrice,
                      0,
                    );
                    const statusColors: Record<string, string> = {
                      DRAFT: 'bg-gray-100 text-gray-800',
                      VALIDATED: 'bg-blue-100 text-blue-800',
                      RECEIVED: 'bg-green-100 text-green-800',
                      CANCELLED: 'bg-red-100 text-red-800',
                    };

                    return (
                      <tr key={purchase.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {purchase.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              statusColors[purchase.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {purchase.expectedDate
                            ? format(new Date(purchase.expectedDate), 'MMM dd, yyyy')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/purchases/${purchase.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No purchase orders found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

