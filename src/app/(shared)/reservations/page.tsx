'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, getUserRoleCode } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useToast } from '@/contexts/ToastContext';
import Pagination from '@/components/Pagination';
import { useReservationsRealtime } from '@/hooks/useReservationsRealtime';
import UpdateReservationModal from '@/components/reservations/UpdateReservationModal';
import UpdateGroupReservationModal from '@/components/reservations/UpdateGroupReservationModal';

interface ReservationItem {
  id: string;
  quantity: number;
  status: string;
  expiresAt?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
}

interface ReservationGroup {
  groupId: string;
  createdAt: string;
  status: string;
  expiresAt?: string;
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
  items: ReservationItem[];
  totalItems: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReservationsResponse {
  data: ReservationGroup[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Project {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [reservations, setReservations] = useState<ReservationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get('status') || 'all');
  const [projectFilter, setProjectFilter] = useState<string>(searchParams?.get('projectId') || 'all');
  const [productFilter, setProductFilter] = useState<string>(searchParams?.get('productId') || 'all');
  const [userFilter, setUserFilter] = useState<string>(searchParams?.get('userId') || 'all');
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [paginationMeta, setPaginationMeta] = useState<ReservationsResponse['meta'] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Autocomplete states
  const [projectSearch, setProjectSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const limit = 20;
  const canCreate = hasPermission(user, 'reservations.create');
  const canCancel = hasPermission(user, 'reservations.cancel');
  const canManage = hasPermission(user, 'reservations.manage');
  const userRoleCode = getUserRoleCode(user);
  const isAdmin = userRoleCode === 'ADMIN' || userRoleCode === 'MANAGER';
  
  // Update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [isUpdateGroupModalOpen, setIsUpdateGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ReservationGroup | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadOptions();
      loadReservations();
    }
  }, [user, authLoading]);

  // Synchroniser l'URL avec les filtres et la pagination
  useEffect(() => {
    if (!user) return;
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (projectFilter !== 'all') params.set('projectId', projectFilter);
    if (productFilter !== 'all') params.set('productId', productFilter);
    if (isAdmin && userFilter !== 'all') params.set('userId', userFilter);
    
    router.replace(`/reservations?${params.toString()}`, { scroll: false });
  }, [page, statusFilter, projectFilter, productFilter, userFilter, isAdmin, limit, router, user]);

  useEffect(() => {
    if (user) {
      setPage(1); // Reset to first page when filters change
      loadReservations();
    }
  }, [statusFilter, projectFilter, productFilter, userFilter]);

  // Écouter les événements temps réel des réservations
  useReservationsRealtime(
    () => {
      // Rafraîchir la liste quand une nouvelle réservation est créée
      loadReservations();
    },
    () => {
      // Rafraîchir la liste quand une réservation est mise à jour
      loadReservations();
    }
  );

  // Reset search fields when filters are cleared
  useEffect(() => {
    if (projectFilter === 'all') {
      setProjectSearch('');
    }
  }, [projectFilter]);

  useEffect(() => {
    if (productFilter === 'all') {
      setProductSearch('');
    }
  }, [productFilter]);

  useEffect(() => {
    if (userFilter === 'all') {
      setUserSearch('');
    }
  }, [userFilter]);

  // Filter suggestions based on search
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  ).slice(0, 10);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 10);

  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 10);

  // Get selected item names for display
  const selectedProject = projects.find(p => p.id === projectFilter);
  const selectedProduct = products.find(p => p.id === productFilter);
  const selectedUser = users.find(u => u.id === userFilter);

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [page]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const requests: Promise<any>[] = [
        apiClient.get('/projects?status=ACTIVE'),
        apiClient.get('/products?limit=1000'),
      ];

      // Only admins need users list
      if (isAdmin) {
        requests.push(apiClient.get('/users?limit=1000'));
      }

      const responses = await Promise.all(requests);
      const [projectsRes, productsRes, usersRes] = responses;

      setProjects(projectsRes.data?.data || projectsRes.data || []);
      setProducts(productsRes.data?.data || productsRes.data || []);
      
      if (isAdmin && usersRes) {
        setUsers(usersRes.data?.data || usersRes.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load filter options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadReservations = async () => {
    try {
      setLoading(true);
      const params: any = {
        grouped: 'true',
        page: page.toString(),
        limit: limit.toString(),
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (projectFilter !== 'all') {
        params.projectId = projectFilter;
      }
      if (productFilter !== 'all') {
        params.productId = productFilter;
      }
      if (isAdmin && userFilter !== 'all') {
        params.userId = userFilter;
      }

      // Admins can see all reservations, others see only their own
      const endpoint = isAdmin ? '/reservations' : '/reservations/my';
      const response = await apiClient.get<ReservationsResponse | ReservationGroup[]>(endpoint, { params });
      
      // Check if response is the new format (object with data and meta) or old format (array)
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        // New format: { data: ReservationGroup[], meta: {...} }
        setReservations(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        // Old format: ReservationGroup[]
        setReservations(response.data);
        setPaginationMeta(null);
      } else {
        setReservations([]);
        setPaginationMeta(null);
      }
    } catch (error: any) {
      console.error('Failed to load reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir libérer cette réservation ?')) {
      return;
    }

    try {
      await apiClient.patch(`/reservations/${id}/release`, {
        notes: 'Libéré par l\'utilisateur',
      });
      toast.success('Réservation libérée avec succès');
      loadReservations();
    } catch (error: any) {
      console.error('Failed to release reservation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la libération');
    }
  };

  const handleDownloadGroupPDF = async (groupId: string) => {
    try {
      const response = await apiClient.get(`/reservations/group/${groupId}/pdf`, {
        responseType: 'blob',
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reservation-group-${groupId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement du PDF');
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RESERVED: 'bg-blue-100 text-blue-800',
      FULFILLED: 'bg-green-100 text-green-800',
      RELEASED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      RESERVED: 'Réservé',
      FULFILLED: 'Rempli',
      RELEASED: 'Libéré',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <SkeletonLoader className="h-8 w-48 mb-2" />
          <SkeletonLoader className="h-4 w-96" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <SkeletonLoader className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            {isAdmin ? 'Toutes les Réservations' : 'Mes Réservations'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isAdmin ? 'Gérez toutes les réservations de produits' : 'Gérez vos réservations de produits'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/reservations/new"
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            title="Créer une nouvelle réservation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nouvelle Réservation</span>
            <span className="sm:hidden">Nouvelle</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="RESERVED">Réservé</option>
              <option value="FULFILLED">Rempli</option>
              <option value="RELEASED">Libéré</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>

          {/* Project Autocomplete - Available for all users */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
            <div className="relative">
              <input
                type="text"
                value={selectedProject ? selectedProject.name : projectSearch}
                onChange={(e) => {
                  setProjectSearch(e.target.value);
                  setProjectFilter('all');
                  setShowProjectSuggestions(true);
                }}
                onFocus={() => setShowProjectSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 200)}
                placeholder="Rechercher un projet..."
                disabled={loadingOptions}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {projectFilter !== 'all' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectFilter('all');
                    setProjectSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Effacer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showProjectSuggestions && filteredProjects.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setProjectFilter(project.id);
                        setProjectSearch(project.name);
                        setShowProjectSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Autocomplete - Available for all users */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
            <div className="relative">
              <input
                type="text"
                value={selectedProduct ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ''}` : productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductFilter('all');
                  setShowProductSuggestions(true);
                }}
                onFocus={() => setShowProductSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                placeholder="Rechercher un produit..."
                disabled={loadingOptions}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {productFilter !== 'all' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductFilter('all');
                    setProductSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Effacer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showProductSuggestions && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setProductFilter(product.id);
                        setProductSearch(`${product.name}${product.sku ? ` (${product.sku})` : ''}`);
                        setShowProductSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                    >
                      {product.name} {product.sku && <span className="text-gray-500">({product.sku})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Autocomplete - Only for admins */}
          {isAdmin && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Utilisateur</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})` : userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserFilter('all');
                    setShowUserSuggestions(true);
                  }}
                  onFocus={() => setShowUserSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                  placeholder="Rechercher un utilisateur..."
                  disabled={loadingOptions}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {userFilter !== 'all' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserFilter('all');
                      setUserSearch('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Effacer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {showUserSuggestions && filteredUsers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setUserFilter(u.id);
                          setUserSearch(`${u.firstName} ${u.lastName} (${u.email})`);
                          setShowUserSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                      >
                        <div className="font-medium">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(statusFilter !== 'all' || projectFilter !== 'all' || productFilter !== 'all' || userFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setStatusFilter('all');
                setProjectFilter('all');
                setProductFilter('all');
                setUserFilter('all');
                setProjectSearch('');
                setProductSearch('');
                setUserSearch('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              title="Réinitialiser tous les filtres"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Reservations List */}
      <div className="space-y-4 mb-6">
        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md text-center py-12 px-4">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">Aucune réservation</h3>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              {canCreate
                ? 'Commencez par créer une nouvelle réservation.'
                : 'Vous n\'avez aucune réservation pour le moment.'}
            </p>
            {canCreate && (
              <div className="mt-6">
                <Link
                  href="/reservations/new"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent shadow-sm text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle Réservation
                </Link>
              </div>
            )}
          </div>
        ) : (
          reservations.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);
            const hasMultipleItems = group.totalItems > 1;
            const allReserved = group.items.every(item => item.status === 'RESERVED');

            return (
              <div key={group.groupId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Group Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          Réservation #{group.groupId.slice(-8)}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(
                            group.status
                          )}`}
                        >
                          {getStatusLabel(group.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          {group.totalItems} produit{group.totalItems > 1 ? 's' : ''}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(group.createdAt)}
                        </span>
                        {isAdmin && group.user && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[200px] sm:max-w-none">
                              Par: {group.user.firstName} {group.user.lastName}
                            </span>
                          </>
                        )}
                        {group.project && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 truncate">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {group.project.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {(canManage || isAdmin) && allReserved && (
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsUpdateGroupModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors text-xs sm:text-sm"
                          title="Modifier le groupe de réservations"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadGroupPDF(group.groupId)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors text-xs sm:text-sm"
                        title="Télécharger le PDF du groupe"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      {hasMultipleItems && (
                        <button
                          onClick={() => toggleGroup(group.groupId)}
                          className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                          title={isExpanded ? 'Masquer les détails' : 'Voir les détails des produits'}
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              <span className="hidden sm:inline">Masquer</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span className="hidden sm:inline">Voir</span>
                            </>
                          )}
                        </button>
                      )}
                      {canCancel && allReserved && (
                        <button
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir libérer toutes les réservations de ce groupe ?')) {
                              Promise.all(
                                group.items.map(item => 
                                  apiClient.patch(`/reservations/${item.id}/release`, {
                                    notes: 'Libéré par l\'utilisateur',
                                  })
                                )
                              ).then(() => {
                                toast.success('Toutes les réservations libérées avec succès');
                                loadReservations();
                              }).catch((error: any) => {
                                toast.error('Erreur lors de la libération');
                                console.error(error);
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-900 px-2.5 sm:px-3 py-2 border border-red-300 rounded-md hover:bg-red-50 transition-colors text-xs sm:text-sm"
                          title="Libérer toutes les réservations de ce groupe"
                        >
                          <span className="hidden sm:inline">Libérer tout</span>
                          <span className="sm:hidden">Libérer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group Items */}
                {isExpanded && hasMultipleItems && (
                  <div className="px-4 sm:px-6 py-4 bg-white">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Produits dans cette réservation:</h4>
                      {group.items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                  {item.product.name}
                                </div>
                                {item.product.sku && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap">SKU: {item.product.sku}</span>
                                )}
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(
                                    item.status
                                  )}`}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  Quantité: {item.quantity}
                                </span>
                                {item.expiresAt && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Expire: {formatDate(item.expiresAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(canManage || isAdmin) && item.status === 'RESERVED' && (
                                <button
                                  onClick={() => {
                                    setSelectedReservation(item);
                                    setIsUpdateModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-1 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
                                  title="Modifier cette réservation"
                                >
                                  Modifier
                                </button>
                              )}
                              {canCancel && item.status === 'RESERVED' && (
                                <button
                                  onClick={() => handleRelease(item.id)}
                                  className="text-red-600 hover:text-red-900 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap"
                                  title="Libérer cette réservation"
                                >
                                  Libérer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Item Display (when not expanded or only one item) */}
                {(!hasMultipleItems || !isExpanded) && (
                  <div className="px-4 sm:px-6 py-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {item.product.name}
                            </div>
                            {item.product.sku && (
                              <span className="text-xs text-gray-500">({item.product.sku})</span>
                            )}
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Quantité: {item.quantity}
                            </span>
                            {item.expiresAt && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Expire: {formatDate(item.expiresAt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(canManage || isAdmin) && item.status === 'RESERVED' && (
                            <button
                              onClick={() => {
                                setSelectedReservation(item);
                                setIsUpdateModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-1 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
                              title="Modifier cette réservation"
                            >
                              Modifier
                            </button>
                          )}
                          {canCancel && item.status === 'RESERVED' && (
                            <button
                              onClick={() => handleRelease(item.id)}
                              className="text-red-600 hover:text-red-900 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap"
                              title="Libérer cette réservation"
                            >
                              Libérer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {group.notes && (
                  <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                      <span className="font-medium">Notes:</span> {group.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={paginationMeta.page}
            totalPages={paginationMeta.totalPages}
            hasNext={paginationMeta.hasNext}
            hasPrev={paginationMeta.hasPrev}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Update Reservation Modal */}
      <UpdateReservationModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
        onSuccess={() => {
          loadReservations();
        }}
      />

      {/* Update Group Reservation Modal */}
      <UpdateGroupReservationModal
        isOpen={isUpdateGroupModalOpen}
        onClose={() => {
          setIsUpdateGroupModalOpen(false);
          setSelectedGroup(null);
        }}
        group={selectedGroup}
        onSuccess={() => {
          loadReservations();
        }}
      />
    </div>
  );
}
