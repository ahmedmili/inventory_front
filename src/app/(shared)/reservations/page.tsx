'use client';

import { useState, useEffect } from 'react';
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
import { CalendarIcon, PackageIcon, PlusIcon } from '@/components/icons';
import StatisticsCard from '@/components/ui/StatisticsCard';
import PageHeader from '@/components/ui/PageHeader';
import SelectFilter from '@/components/ui/SelectFilter';
import SearchFilter from '@/components/ui/SearchFilter';
import ReservationCard from '@/components/reservations/ReservationCard';
import ReservationProductsTable from '@/components/reservations/ReservationProductsTable';
import { useUrlSync } from '@/hooks/useUrlSync';
import { UserIcon, ProjectIcon } from '@/components/icons';
import type { ReservationItem, ReservationGroup, PaginationMeta } from '@/types/shared';

interface ReservationsResponse {
  data: ReservationGroup[];
  meta: PaginationMeta;
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

  // Status helpers - using StatusBadge component now, but keeping for backward compatibility
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RESERVED: 'bg-blue-100 text-blue-800 border-blue-200',
      FULFILLED: 'bg-green-100 text-green-800 border-green-200',
      RELEASED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Calculate statistics
  const totalReservations = paginationMeta?.total || reservations.length;
  const totalProducts = reservations.reduce((sum, res) => sum + res.totalItems, 0);
  const reservedCount = reservations.filter(r => r.status === 'RESERVED').length;
  const fulfilledCount = reservations.filter(r => r.status === 'FULFILLED').length;

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {isAdmin ? 'Toutes les Réservations' : 'Mes Réservations'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {isAdmin ? 'Gérez toutes les réservations de produits' : 'Gérez vos réservations de produits'}
            </p>
          </div>
          {canCreate && (
            <Link
              href="/reservations/new"
              className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              title="Créer une nouvelle réservation"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Nouvelle Réservation</span>
              <span className="sm:hidden">Nouvelle</span>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {reservations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatisticsCard
            title="Total Réservations"
            value={totalReservations}
            icon={<CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="blue"
          />
          <StatisticsCard
            title="Produits Réservés"
            value={totalProducts}
            icon={<PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="green"
          />
          <StatisticsCard
            title="En Attente"
            value={reservedCount}
            icon={<CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="purple"
          />
          <StatisticsCard
            title="Remplies"
            value={fulfilledCount}
            icon={<PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="orange"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5 hover:shadow-lg transition-shadow duration-200">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
          <SelectFilter
            label="Statut"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'RESERVED', label: 'Réservé' },
              { value: 'FULFILLED', label: 'Rempli' },
              { value: 'RELEASED', label: 'Libéré' },
              { value: 'CANCELLED', label: 'Annulé' },
            ]}
            placeholder="Tous"
            showClear={statusFilter !== 'all'}
          />

          {/* Project Autocomplete */}
          <div className="relative">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Projet</label>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {projectFilter !== 'all' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectFilter('all');
                    setProjectSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Effacer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showProjectSuggestions && filteredProjects.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setProjectFilter(project.id);
                        setProjectSearch(project.name);
                        setShowProjectSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm transition-colors"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Autocomplete */}
          <div className="relative">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Produit</label>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {productFilter !== 'all' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductFilter('all');
                    setProductSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Effacer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showProductSuggestions && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setProductFilter(product.id);
                        setProductSearch(`${product.name}${product.sku ? ` (${product.sku})` : ''}`);
                        setShowProductSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm transition-colors"
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Utilisateur</label>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {userFilter !== 'all' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserFilter('all');
                      setUserSearch('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Effacer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {showUserSuggestions && filteredUsers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setUserFilter(u.id);
                          setUserSearch(`${u.firstName} ${u.lastName} (${u.email})`);
                          setShowUserSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm transition-colors"
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
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
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
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              title="Réinitialiser tous les filtres"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        {reservations.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="text-center py-20 px-4">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CalendarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aucune réservation</h3>
              <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
                {canCreate
                  ? 'Commencez par créer une nouvelle réservation pour gérer vos produits.'
                  : 'Vous n\'avez aucune réservation pour le moment.'}
              </p>
              {canCreate && (
                <Link
                  href="/reservations/new"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5" />
                  Nouvelle Réservation
                </Link>
              )}
            </div>
          </div>
        ) : (
          reservations.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);
            const hasMultipleItems = group.totalItems > 1;
            const allReserved = group.items.every(item => item.status === 'RESERVED');
            const daysAgo = Math.floor((new Date().getTime() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <ReservationCard
                key={group.groupId}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group.groupId)}
                onUpdateGroup={allReserved && (canManage || isAdmin) ? () => {
                  setSelectedGroup(group);
                  setIsUpdateGroupModalOpen(true);
                } : undefined}
                onDownloadPDF={() => handleDownloadGroupPDF(group.groupId)}
                onRelease={canCancel && allReserved ? () => {
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
                } : undefined}
                canManage={canManage}
                canCancel={canCancel}
                isAdmin={isAdmin}
                formatDate={formatDate}
                daysAgo={daysAgo}
                expandedContent={
                  isExpanded && hasMultipleItems ? (
                    <div className="p-5 sm:p-7">
                      <ReservationProductsTable
                        items={group.items}
                        canManage={canManage}
                        canCancel={canCancel}
                        isAdmin={isAdmin}
                        onUpdate={(item) => {
                          setSelectedReservation(item);
                          setIsUpdateModalOpen(true);
                        }}
                        onRelease={handleRelease}
                        formatDate={formatDate}
                      />
                    </div>
                  ) : !hasMultipleItems ? (
                    <div className="p-5 sm:p-7">
                      <ReservationProductsTable
                        items={group.items}
                        canManage={canManage}
                        canCancel={canCancel}
                        isAdmin={isAdmin}
                        onUpdate={(item) => {
                          setSelectedReservation(item);
                          setIsUpdateModalOpen(true);
                        }}
                        onRelease={handleRelease}
                        formatDate={formatDate}
                      />
                    </div>
                  ) : undefined
                }
              />
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
