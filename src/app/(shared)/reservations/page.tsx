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

// Icons as SVG components
const CalendarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PackageIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const UserIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ProjectIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChevronDownIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const PlusIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

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
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Réservations</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{totalReservations}</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 via-green-50 to-green-100 rounded-xl p-4 sm:p-5 border border-green-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Produits Réservés</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">{totalProducts}</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-200 to-green-300 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                <PackageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 rounded-xl p-4 sm:p-5 border border-purple-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">En Attente</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900 mt-1">{reservedCount}</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 rounded-xl p-4 sm:p-5 border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-orange-600 truncate">Remplies</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-900 mt-1">{fulfilledCount}</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-orange-200 to-orange-300 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                <PackageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5 hover:shadow-lg transition-shadow duration-200">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="RESERVED">Réservé</option>
              <option value="FULFILLED">Rempli</option>
              <option value="RELEASED">Libéré</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>

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
              <div
                key={group.groupId}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:shadow-2xl hover:border-blue-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 group"
              >
                {/* Group Header */}
                <div className="p-5 sm:p-7 bg-gradient-to-br from-white via-blue-50/30 to-gray-50 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-blue-100 group-hover:ring-blue-200 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                            Réservation #{group.groupId.slice(-8)}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold border-2 shadow-md flex-shrink-0 ${getStatusColor(
                              group.status
                            )}`}
                          >
                            {getStatusLabel(group.status)}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                            <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <PackageIcon className="w-3 h-3 text-blue-700" />
                            </div>
                            <span className="font-semibold text-gray-700 whitespace-nowrap">{group.totalItems} produit{group.totalItems > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                            <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <CalendarIcon className="w-3 h-3 text-purple-700" />
                            </div>
                            <span className="font-medium text-gray-700 whitespace-nowrap">{formatDate(group.createdAt)}</span>
                            {daysAgo >= 0 && daysAgo <= 7 && (
                              <span className="ml-1 text-xs text-gray-500 whitespace-nowrap">({daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`})</span>
                            )}
                          </div>
                          {isAdmin && group.user && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 min-w-0">
                              <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <UserIcon className="w-3 h-3 text-green-700" />
                              </div>
                              <span className="font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                                {group.user.firstName} {group.user.lastName}
                              </span>
                            </div>
                          )}
                          {group.project && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 min-w-0">
                              <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <ProjectIcon className="w-3 h-3 text-orange-700" />
                              </div>
                              <span className="font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">{group.project.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:ml-auto">
                      {(canManage || isAdmin) && allReserved && (
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsUpdateGroupModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 text-blue-600 hover:text-blue-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                          title="Modifier le groupe de réservations"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadGroupPDF(group.groupId)}
                        className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 text-blue-600 hover:text-blue-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                        title="Télécharger le PDF du groupe"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      {/* Collapse/Expand Button - Always visible for groups with multiple items */}
                      {hasMultipleItems && (
                        <button
                          onClick={() => toggleGroup(group.groupId)}
                          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:border-blue-400 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 text-gray-700 hover:text-blue-700 transition-all duration-300 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                          title={isExpanded ? 'Masquer les détails' : 'Voir les détails des produits'}
                        >
                          <ChevronDownIcon
                            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                          <span className="hidden sm:inline">{isExpanded ? 'Masquer' : 'Voir les détails'}</span>
                          <span className="sm:hidden">{isExpanded ? 'Masquer' : 'Voir'}</span>
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
                          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-red-300 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 text-red-600 hover:text-red-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                          title="Libérer toutes les réservations de ce groupe"
                        >
                          <span className="hidden sm:inline">Libérer tout</span>
                          <span className="sm:hidden">Libérer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group Items - Expanded View (only shown when expanded) */}
                {isExpanded && hasMultipleItems && (
                  <div className="border-t-2 border-gray-200 bg-gradient-to-br from-blue-50/50 via-gray-50 to-purple-50/50 overflow-hidden">
                    <div className="p-5 sm:p-7 animate-in slide-in-from-top-2 duration-300">
                      <div className="mb-6">
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-2 flex items-center gap-3">
                          <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                          <span>Produits dans cette réservation</span>
                          <span className="ml-auto px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs sm:text-sm">
                            {group.items.length}
                          </span>
                        </h4>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-2"></div>
                      </div>
                      <div className="overflow-x-auto rounded-xl border-2 border-gray-300 bg-white shadow-xl">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
                            <tr>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-12">
                                #
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Produit
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                                SKU
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-24">
                                Quantité
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-28">
                                Statut
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden lg:table-cell">
                                Expiration
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-32">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {group.items.map((item, index) => (
                              <tr
                                key={item.id}
                                className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200 group/row ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 border-2 border-blue-300 flex items-center justify-center text-sm font-bold text-white shadow-md group-hover/row:scale-110 group-hover/row:rotate-6 transition-all duration-300">
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-col">
                                    <p className="text-sm font-bold text-gray-900 group-hover/row:text-blue-700 transition-colors">
                                      {item.product.name}
                                    </p>
                                    {item.product.sku && (
                                      <p className="text-xs text-gray-500 font-mono mt-1 sm:hidden">
                                        SKU: {item.product.sku}
                                      </p>
                                    )}
                                    {item.expiresAt && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 lg:hidden">
                                        <CalendarIcon className="w-3 h-3 text-purple-600" />
                                        <span>Expire: {formatDate(item.expiresAt)}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                  {item.product.sku ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 font-mono text-xs font-semibold text-gray-700">
                                      {item.product.sku}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-lg">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border-2 shadow-sm ${getStatusColor(
                                      item.status
                                    )}`}
                                  >
                                    {getStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                  {item.expiresAt ? (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
                                      <span>{formatDate(item.expiresAt)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {(canManage || isAdmin) && item.status === 'RESERVED' && (
                                      <button
                                        onClick={() => {
                                          setSelectedReservation(item);
                                          setIsUpdateModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs px-2.5 py-1.5 border-2 border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
                                        title="Modifier"
                                      >
                                        Modifier
                                      </button>
                                    )}
                                    {canCancel && item.status === 'RESERVED' && (
                                      <button
                                        onClick={() => handleRelease(item.id)}
                                        className="text-red-600 hover:text-red-800 text-xs px-2.5 py-1.5 border-2 border-red-300 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
                                        title="Libérer"
                                      >
                                        Libérer
                                      </button>
                                    )}
                                    {(!canManage && !isAdmin && !canCancel) || item.status !== 'RESERVED' ? (
                                      <span className="text-xs text-gray-400 italic">Aucune action</span>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Single Item Display (only for groups with one item, always visible) */}
                {!hasMultipleItems && (
                  <div className="border-t-2 border-gray-200 bg-gradient-to-br from-blue-50/50 via-gray-50 to-purple-50/50">
                    <div className="p-5 sm:p-7">
                      <div className="mb-4">
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-2 flex items-center gap-3">
                          <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                          <span>Détails du produit</span>
                        </h4>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-2"></div>
                      </div>
                      <div className="overflow-x-auto rounded-xl border-2 border-gray-300 bg-white shadow-xl">
                        <table className="w-full min-w-[500px]">
                          <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
                            <tr>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Produit
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                                SKU
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                Quantité
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                Statut
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden lg:table-cell">
                                Expiration
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {group.items.map((item, index) => (
                              <tr
                                key={item.id}
                                className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                              >
                                <td className="px-4 py-4">
                                  <div className="flex flex-col">
                                    <p className="text-sm font-bold text-gray-900">
                                      {item.product.name}
                                    </p>
                                    {item.product.sku && (
                                      <p className="text-xs text-gray-500 font-mono mt-1 sm:hidden">
                                        SKU: {item.product.sku}
                                      </p>
                                    )}
                                    {item.expiresAt && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 lg:hidden">
                                        <CalendarIcon className="w-3 h-3 text-purple-600" />
                                        <span>Expire: {formatDate(item.expiresAt)}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                  {item.product.sku ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 font-mono text-xs font-semibold text-gray-700">
                                      {item.product.sku}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-lg">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border-2 shadow-sm ${getStatusColor(
                                      item.status
                                    )}`}
                                  >
                                    {getStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                  {item.expiresAt ? (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
                                      <span>{formatDate(item.expiresAt)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {(canManage || isAdmin) && item.status === 'RESERVED' && (
                                      <button
                                        onClick={() => {
                                          setSelectedReservation(item);
                                          setIsUpdateModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs px-2.5 py-1.5 border-2 border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
                                        title="Modifier cette réservation"
                                      >
                                        Modifier
                                      </button>
                                    )}
                                    {canCancel && item.status === 'RESERVED' && (
                                      <button
                                        onClick={() => handleRelease(item.id)}
                                        className="text-red-600 hover:text-red-800 text-xs px-2.5 py-1.5 border-2 border-red-300 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
                                        title="Libérer cette réservation"
                                      >
                                        Libérer
                                      </button>
                                    )}
                                    {(!canManage && !isAdmin && !canCancel) || item.status !== 'RESERVED' ? (
                                      <span className="text-xs text-gray-400 italic">Aucune action</span>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {group.notes && (
                  <div className="border-t-2 border-gray-200 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                        <p className="text-sm text-gray-600 break-words leading-relaxed">{group.notes}</p>
                      </div>
                    </div>
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
