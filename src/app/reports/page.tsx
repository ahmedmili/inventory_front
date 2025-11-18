'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';

// Lazy load recharts for better performance - using a wrapper component
const RechartsChart = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod;
      return function Chart({ data }: { data: Array<{ name: string; value: number }> }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64">Loading chart...</div>,
  },
);

interface DashboardStats {
  products: number;
  lowStock: number;
  sales: number;
  purchases: number;
}

interface InventoryValue {
  inventoryValue: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventoryValue, setInventoryValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [statsResponse, valueResponse] = await Promise.all([
        apiClient.get('/reports/dashboard'),
        apiClient.get('/reports/inventory-value'),
      ]);
      setStats(statsResponse.data);
      setInventoryValue(valueResponse.data.inventoryValue);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </Layout>
    );
  }

  const chartData = stats
    ? [
        { name: 'Products', value: stats.products },
        { name: 'Low Stock', value: stats.lowStock },
        { name: 'Sales', value: stats.sales },
        { name: 'Purchases', value: stats.purchases },
      ]
    : [];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold mb-6">Reports & Analytics</h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Products</span>
                <span className="text-2xl font-bold">{stats?.products || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Low Stock Items</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {stats?.lowStock || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sales Orders</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats?.sales || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Purchase Orders</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats?.purchases || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Inventory Value</h3>
            <div className="text-4xl font-bold text-primary-600">
              ${inventoryValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Total value of current inventory
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Overview Chart</h3>
          <RechartsChart data={chartData} />
        </div>
      </div>
    </Layout>
  );
}

