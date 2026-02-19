'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import UsersListRealtime from '@/components/users/UsersListRealtime';
import { usePresenceNotifications } from '@/hooks/usePresenceNotifications';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DashboardChart = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
      return function Chart({ data }: { data: Array<{ name: string; value: number }> }) {
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Quantité" />
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false, loading: () => <div className="h-[260px] flex items-center justify-center text-gray-500">Chargement du graphique...</div> },
);

interface DashboardStats {
  products: number;
  lowStock: number;
  sales: number;
  purchases: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  minStock: number;
}

interface RecentSale {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  customerName: string;
}

interface RecentPurchase {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  supplierName: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  href?: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, bgGradient, href, subtitle }: StatCardProps) {
  const content = (
    <div className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${bgGradient} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white/90 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-1`}>
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-white/70">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
        </div>
      </div>
      {href && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <span className="text-xs text-white/90 font-medium hover:text-white transition-colors">
            Voir les détails →
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>('/reports/dashboard');
  const { data: inventoryValueData } = useApi<{ inventoryValue: number }>('/reports/inventory-value');
  const { data: lowStockProducts } = useApi<LowStockProduct[]>('/reports/low-stock-products?limit=6');
  const { data: recentSales } = useApi<RecentSale[]>('/reports/recent-sales?limit=5');
  const { data: recentPurchases } = useApi<RecentPurchase[]>('/reports/recent-purchases?limit=5');

  usePresenceNotifications();

  const chartData = stats
    ? [
        { name: 'Produits', value: stats.products },
        { name: 'Stock faible', value: stats.lowStock },
        { name: 'Ventes (livrées)', value: stats.sales },
        { name: 'Achats (reçus)', value: stats.purchases },
      ]
    : [];

  if (authLoading || statsLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <SkeletonLoader className="h-8 w-48 mb-2" />
          <SkeletonLoader className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de Bord Administrateur
        </h1>
        <p className="text-gray-600">
          Bienvenue, {user.firstName} {user.lastName} • Vue d'ensemble complète de votre gestion de stock
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Produits Totaux"
          value={stats?.products ?? 0}
          icon={
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="text-blue-100"
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
          href="/products"
        />

        <StatCard
          title="Stock Faible"
          value={stats?.lowStock ?? 0}
          icon={
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="text-amber-100"
          bgGradient="bg-gradient-to-br from-amber-500 to-orange-500"
          href="/products"
          subtitle={stats?.lowStock ? "Action requise" : "Tout est OK"}
        />

        <StatCard
          title="Commandes de Vente"
          value={stats?.sales ?? 0}
          icon={
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          color="text-green-100"
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          href="/sales"
        />

        <StatCard
          title="Commandes d'Achat"
          value={stats?.purchases ?? 0}
          icon={
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="text-purple-100"
          bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          href="/purchases"
        />
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/products/new"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Nouveau Produit</span>
            </Link>
            <Link
              href="/sales/new"
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <svg className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Nouvelle Vente</span>
            </Link>
            <Link
              href="/purchases/new"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <svg className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Nouvel Achat</span>
            </Link>
            <Link
              href="/reservations/new"
              className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Nouvelle Réservation</span>
            </Link>
            <Link
              href="/reports"
              className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors group"
            >
              <svg className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Rapports</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Navigation Rapide</h2>
          <div className="space-y-3">
            <Link
              href="/users"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Gestion des Utilisateurs</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/customers"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Clients</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/suppliers"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Fournisseurs</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/movements"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Mouvements de Stock</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/projects"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Projets</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/reservations"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Réservations</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Section for Low Stock */}
      {stats?.lowStock && stats.lowStock > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">
                Attention : Stock Faible Détecté
              </h3>
              <p className="text-amber-700 mt-1">
                Vous avez {stats.lowStock} produit{stats.lowStock > 1 ? 's' : ''} avec un stock faible nécessitant une attention immédiate.
              </p>
            </div>
            <Link
              href="/products"
              className="ml-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Voir les Produits
            </Link>
          </div>
        </div>
      )}

      {/* Chart + Inventory value */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé en graphique</h2>
          <DashboardChart data={chartData} />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Valeur de l&apos;inventaire</h2>
          <p className="text-3xl font-bold text-blue-600">
            {inventoryValueData?.inventoryValue != null
              ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(inventoryValueData.inventoryValue)
              : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Valeur totale du stock (prix d&apos;achat)</p>
          <Link href="/reports" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
            Voir les rapports →
          </Link>
        </div>
      </div>

      {/* Lists: Low stock, Recent sales, Recent purchases */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Produits en stock faible</h2>
            <Link href="/products" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Tous
            </Link>
          </div>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {lowStockProducts?.length ? (
              lowStockProducts.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="flex justify-between items-center py-2 px-2 rounded hover:bg-gray-50 text-sm">
                    <span className="font-medium text-gray-900 truncate flex-1 mr-2">{p.name}</span>
                    <span className="text-amber-600 font-medium shrink-0">{p.quantity} / {p.minStock}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500 py-4">Aucun produit en stock faible</li>
            )}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Dernières ventes</h2>
            <Link href="/sales" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Toutes
            </Link>
          </div>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {recentSales?.length ? (
              recentSales.map((o) => (
                <li key={o.id}>
                  <Link href={`/sales/${o.id}`} className="block py-2 px-2 rounded hover:bg-gray-50 text-sm">
                    <span className="font-medium text-gray-900">{o.number}</span>
                    <span className="text-gray-500 ml-2">{o.customerName}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{format(new Date(o.createdAt), 'd MMM yyyy', { locale: fr })} · {o.status}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500 py-4">Aucune vente récente</li>
            )}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Derniers achats</h2>
            <Link href="/purchases" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Tous
            </Link>
          </div>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {recentPurchases?.length ? (
              recentPurchases.map((o) => (
                <li key={o.id}>
                  <Link href={`/purchases/${o.id}`} className="block py-2 px-2 rounded hover:bg-gray-50 text-sm">
                    <span className="font-medium text-gray-900">{o.number}</span>
                    <span className="text-gray-500 ml-2">{o.supplierName}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{format(new Date(o.createdAt), 'd MMM yyyy', { locale: fr })} · {o.status}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500 py-4">Aucun achat récent</li>
            )}
          </ul>
        </div>
      </div>

      {/* Users List with Real-time Status */}
      <div className="mb-8">
        <UsersListRealtime
          endpoint="/users"
          title="Utilisateurs et Statut en Temps Réel"
          showRole={true}
        />
      </div>
    </div>
  );
}

