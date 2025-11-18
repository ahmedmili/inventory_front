'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await apiClient.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading warehouses...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Warehouses</h2>
          <Link
            href="/warehouses/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Add Warehouse
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {warehouse.name}
                </h3>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {warehouse.code}
                </span>
              </div>
              {warehouse.location && (
                <p className="text-sm text-gray-600 mb-4">
                  📍 {warehouse.location}
                </p>
              )}
              <div className="flex space-x-3">
                <Link
                  href={`/warehouses/${warehouse.id}`}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {warehouses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No warehouses found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

