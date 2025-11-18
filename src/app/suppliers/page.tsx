'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await apiClient.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading suppliers...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Suppliers</h2>
          <Link
            href="/suppliers/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Add Supplier
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {supplier.name}
              </h3>
              {supplier.email && (
                <p className="text-sm text-gray-600 mb-1">
                  📧 {supplier.email}
                </p>
              )}
              {supplier.phone && (
                <p className="text-sm text-gray-600 mb-1">
                  📞 {supplier.phone}
                </p>
              )}
              {supplier.address && (
                <p className="text-sm text-gray-600 mb-4">
                  📍 {supplier.address}
                </p>
              )}
              <div className="flex space-x-3">
                <Link
                  href={`/suppliers/${supplier.id}`}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No suppliers found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

