'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import Layout from '@/components/Layout';

interface DashboardStats {
  products: number;
  lowStock: number;
  sales: number;
  purchases: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>('/reports/dashboard');

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <Layout>
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.products ?? 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Products</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats?.lowStock ?? 0}
                    </div>
                    <div className="text-sm text-gray-500">Low Stock Items</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.sales ?? 0}
                    </div>
                    <div className="text-sm text-gray-500">Sales Orders</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.purchases ?? 0}
                    </div>
                    <div className="text-sm text-gray-500">Purchase Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
}

