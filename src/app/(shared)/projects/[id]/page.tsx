'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import RouteGuard from '@/components/guards/RouteGuard';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { EditIcon, PlusIcon, TrashIcon, ArrowLeftIcon, ReservationIcon } from '@/components/icons';
import Link from 'next/link';
import { useModal } from '@/contexts/ModalContext';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import AddProjectProductModal from '@/components/projects/AddProjectProductModal';
import AddProjectMemberModal from '@/components/projects/AddProjectMemberModal';
import ConfirmModal from '@/components/ConfirmModal';
import ReservationCartModal from '@/components/reservations/ReservationCartModal';
import ProjectExitSlipModal from '@/components/projects/ProjectExitSlipModal';
import Pagination from '@/components/Pagination';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { exportProjectsToCSV, downloadCSV, exportProductsToCSV } from '@/lib/csv-utils';
import { exportProjectsToExcel, exportProductsToExcel } from '@/lib/excel-utils';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ModernTable from '@/components/ui/ModernTable';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import SelectFilter from '@/components/ui/SelectFilter';

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role?: { code: string };
    };
  }>;
  products?: Array<{
    id: string;
    quantity: number;
    notes?: string | null;
    product: {
      id: string;
      name: string;
      sku?: string | null;
      salePrice: number;
    };
  }>;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const toast = useToast();
  const modal = useModal();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isExitSlipModalOpen, setIsExitSlipModalOpen] = useState(false);
  
  // Reservations state
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reservationPage, setReservationPage] = useState(1);
  const [reservationMeta, setReservationMeta] = useState<any>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const canCreateReservation = hasPermission(user, 'reservations.create');
  const { mutate: deleteProject, loading: deleting } = useApiMutation();
  const canUpdate = hasPermission(user, 'projects.update');
  const canDelete = hasPermission(user, 'projects.delete');

  const { data: project, loading, error, mutate } = useApi<Project>(
    projectId ? `/projects/${projectId}` : null
  );

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProject(`/projects/${projectId}`, 'DELETE');
      toast.success('Projet supprimé avec succès!');
      router.push('/projects');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Échec de la suppression du projet';
      toast.error(errorMessage);
    }
  };

  // Status badge is now handled by StatusBadge component

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Load reservations for this project
  useEffect(() => {
    if (projectId) {
      loadReservations();
    }
  }, [projectId, statusFilter, reservationPage]);

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);
      const params: any = {
        projectId,
        grouped: 'true',
        page: reservationPage.toString(),
        limit: '20',
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiClient.get('/reservations', { params });
      const data = response.data?.data || [];
      const meta = response.data?.meta || null;
      
      setReservations(data);
      setReservationMeta(meta);
    } catch (error: any) {
      console.error('Failed to load reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoadingReservations(false);
    }
  };

  // Reservation status badge is now handled by StatusBadge component

  // Calculate total reserved quantity per product
  const productReservations = useMemo(() => {
    const productMap = new Map<string, {
      product: { id: string; name: string; sku?: string | null };
      totalQuantity: number;
      reservations: any[];
      groups: any[];
    }>();

    reservations.forEach((group) => {
      group.items?.forEach((item: any) => {
        const productId = item.product?.id;
        if (!productId) return;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: item.product,
            totalQuantity: 0,
            reservations: [],
            groups: [],
          });
        }

        const entry = productMap.get(productId)!;
        entry.totalQuantity += item.quantity;
        entry.reservations.push({
          ...item,
          groupId: group.groupId,
          createdAt: group.createdAt,
          status: group.status,
          user: group.user,
          expiresAt: group.expiresAt,
          notes: group.notes,
        });
        
        // Add group if not already added
        if (!entry.groups.find(g => g.groupId === group.groupId)) {
          entry.groups.push(group);
        }
      });
    });

    return Array.from(productMap.values());
  }, [reservations]);

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleExportProjectCSV = () => {
    if (!project) return;
    const csvContent = exportProjectsToCSV([project]);
    downloadCSV(csvContent, `projet_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Projet exporté en CSV');
  };

  const handleExportProjectExcel = async () => {
    if (!project) return;
    await exportProjectsToExcel([project], `projet_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Projet exporté en Excel');
  };

  const handleExportProjectProductsCSV = () => {
    if (!project || !productReservations.length) {
      toast.error('Aucun produit à exporter');
      return;
    }
    // Convert reservations to products format
    const products = productReservations.map(entry => ({
      name: entry.product.name,
      sku: entry.product.sku,
      description: '',
      salePrice: 0,
      minStock: 0,
      supplier: null,
      warehouseStock: [{ quantity: entry.totalQuantity }],
    }));
    const csvContent = exportProductsToCSV(products);
    downloadCSV(csvContent, `produits_projet_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Produits du projet exportés en CSV');
  };

  const handleExportProjectProductsExcel = async () => {
    if (!project || !productReservations.length) {
      toast.error('Aucun produit à exporter');
      return;
    }
    // Convert reservations to products format
    const products = productReservations.map(entry => ({
      name: entry.product.name,
      sku: entry.product.sku,
      description: '',
      salePrice: 0,
      minStock: 0,
      supplier: null,
      warehouseStock: [{ quantity: entry.totalQuantity }],
    }));
    await exportProductsToExcel(products, `produits_projet_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Produits du projet exportés en Excel');
  };

  if (loading) {
    return (
      <RouteGuard requirements={{ requirePermissions: ['projects.read'] }}>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !project) {
    return (
      <RouteGuard requirements={{ requirePermissions: ['projects.read'] }}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Projet introuvable</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requirements={{ requirePermissions: ['projects.read'] }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title={project.name}
          description={project.description || 'Aucune description'}
          backUrl="/projects"
          actions={
            <>
              <ExportDropdown
                trigger={
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exporter
                  </>
                }
                options={[
                  {
                    label: 'Exporter le projet (CSV)',
                    description: 'Informations du projet',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    onClick: handleExportProjectCSV,
                  },
                  {
                    label: 'Exporter le projet (Excel)',
                    description: 'Informations du projet',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    onClick: handleExportProjectExcel,
                  },
                  ...(productReservations.length > 0 ? [
                    {
                      label: 'Exporter les produits (CSV)',
                      description: `${productReservations.length} produit(s) réservé(s)`,
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                      onClick: handleExportProjectProductsCSV,
                    },
                    {
                      label: 'Exporter les produits (Excel)',
                      description: `${productReservations.length} produit(s) réservé(s)`,
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                      onClick: handleExportProjectProductsExcel,
                    },
                  ] : []),
                ]}
              />
              {canUpdate && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <EditIcon className="w-5 h-5" />
                  <span>Modifier</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Supprimer</span>
                </button>
              )}
            </>
          }
        />

        {/* Informations générales */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            <span>Informations générales</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Statut</label>
              <div className="mt-2"><StatusBadge status={project.status} variant="rounded" size="md" /></div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Créé par</label>
              <div className="mt-2 text-gray-900 font-semibold">
                {project.createdBy
                  ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                  : <span className="text-gray-400 italic">-</span>}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Date de début</label>
              <div className="mt-2 text-gray-900 font-semibold">{formatDate(project.startDate)}</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Date de fin</label>
              <div className="mt-2 text-gray-900 font-semibold">{formatDate(project.endDate)}</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Date de création</label>
              <div className="mt-2 text-gray-900 font-semibold">{formatDate(project.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Membres */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              <span>Membres ({project.members?.length || 0})</span>
            </h2>
            {canUpdate && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            )}
          </div>
          {project.members && project.members.length > 0 ? (
            <div className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {member.user.firstName} {member.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-lg text-xs font-bold border border-blue-300 shadow-sm">
                      {member.role}
                    </span>
                    {canUpdate && (
                      <button
                        onClick={() => {
                          modal.confirm({
                            title: 'Retirer le membre',
                            content: `Êtes-vous sûr de vouloir retirer ${member.user.firstName} ${member.user.lastName} du projet ?`,
                            onConfirm: async () => {
                              try {
                                await apiClient.delete(`/projects/${projectId}/members/${member.user.id}`);
                                toast.success('Membre retiré avec succès');
                                mutate();
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || 'Erreur lors du retrait du membre');
                              }
                            },
                          });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Aucun membre assigné</p>
              <p className="text-sm text-gray-500 mt-1">Ajoutez des membres pour collaborer sur ce projet</p>
            </div>
          )}
        </div>

        {/* Produits Réservés */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <span>Produits Réservés ({productReservations.length})</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setReservationPage(1);
                }}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="RELEASED">Libérée</option>
                <option value="EXPIRED">Expirée</option>
              </select>
              
              {canCreateReservation && (
                <>
                  <button
                    onClick={() => setIsReservationModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  >
                    <ReservationIcon className="w-4 h-4" />
                    <span>Nouvelle réservation</span>
                  </button>
                  {canUpdate && (
                    <button
                      onClick={() => setIsExitSlipModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                      title="Sortie de stock immédiate et définitive, liée au projet"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Bon de sortie</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {loadingReservations ? (
            <div className="text-center py-12 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Chargement...</p>
            </div>
          ) : productReservations.length > 0 ? (
            <>
              <div className="overflow-x-auto rounded-xl border-2 border-gray-300 bg-white shadow-xl">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                        Quantité totale réservée
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                        Nombre de réservations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {productReservations.map((entry, index) => {
                      const isExpanded = expandedProducts.has(entry.product.id);
                      // Group reservations by groupId
                      const reservationsByGroup = entry.groups.map(group => ({
                        group,
                        items: entry.reservations.filter((r: any) => r.groupId === group.groupId),
                      }));

                      return (
                        <React.Fragment key={entry.product.id}>
                          <tr
                            className={`hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-white cursor-pointer transition-all duration-200 group/row ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            }`}
                            onClick={() => toggleProduct(entry.product.id)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 via-purple-500 to-pink-600 border-2 border-purple-300 flex items-center justify-center text-sm font-bold text-white shadow-md group-hover/row:scale-110 group-hover/row:rotate-6 transition-all duration-300">
                                  {index + 1}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProduct(entry.product.id);
                                  }}
                                  className="p-1.5 hover:bg-purple-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                                >
                                  <svg
                                    className={`w-5 h-5 text-purple-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-bold text-gray-900 group-hover/row:text-purple-700 transition-colors">{entry.product.name}</div>
                                {entry.product.sku && (
                                  <div className="text-xs text-gray-500 font-mono mt-1">SKU: {entry.product.sku}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-lg">
                                {entry.totalQuantity}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-bold bg-purple-100 text-purple-700 border border-purple-300">
                                {entry.reservations.length}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="px-4 py-5 bg-gradient-to-br from-purple-50/50 via-gray-50 to-pink-50/50">
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    <span>Détails des réservations</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                  </h4>
                                  {reservationsByGroup.map(({ group, items }) => (
                                    <div
                                      key={group.groupId}
                                      className="border-2 border-gray-200 rounded-xl p-4 bg-white shadow-md hover:shadow-lg hover:border-purple-300 transition-all duration-200"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <StatusBadge status={group.status} variant="default" size="sm" />
                                          <div className="flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>{formatDateTime(group.createdAt)}</span>
                                          </div>
                                          {group.user && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-200">
                                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                              </svg>
                                              <span className="font-medium">{group.user.firstName} {group.user.lastName}</span>
                                            </div>
                                          )}
                                        </div>
                                        {group.expiresAt && (
                                          <div className="flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200">
                                            <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-medium">Expire: {formatDateTime(group.expiresAt)}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {group.notes && (
                                        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                                          <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                                          <p className="text-sm text-gray-600 italic">"{group.notes}"</p>
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        {items.map((item: any, itemIndex: number) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                                          >
                                            <div className="flex-1">
                                              <div className="font-semibold text-gray-900">{item.product?.name}</div>
                                              {item.product?.sku && (
                                                <div className="text-xs text-gray-500 font-mono mt-1">SKU: {item.product.sku}</div>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <div className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-md">
                                                {item.quantity}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reservationMeta && reservationMeta.totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Pagination
                    currentPage={reservationPage}
                    totalPages={reservationMeta.totalPages}
                    hasNext={reservationMeta.hasNext}
                    hasPrev={reservationMeta.hasPrev}
                    onPageChange={setReservationPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ReservationIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Aucun produit réservé</p>
              <p className="text-sm text-gray-600 mb-6">Commencez par créer une réservation pour ce projet</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {canCreateReservation && (
                  <button
                    onClick={() => setIsReservationModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <ReservationIcon className="w-5 h-5" />
                    <span>Créer une réservation</span>
                  </button>
                )}
                {canUpdate && (
                  <button
                    onClick={() => setIsExitSlipModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    title="Sortie de stock immédiate et définitive"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Créer un bon de sortie</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {isEditModalOpen && (
          <ProjectFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            projectId={projectId}
            onSuccess={() => {
              mutate();
              setIsEditModalOpen(false);
            }}
          />
        )}

        {isDeleteModalOpen && (
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title="Supprimer le projet"
            message={`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Cette action peut être annulée.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            type="danger"
            loading={deleting}
          />
        )}

        {isAddProductModalOpen && (
          <AddProjectProductModal
            isOpen={isAddProductModalOpen}
            onClose={() => setIsAddProductModalOpen(false)}
            projectId={projectId}
            onSuccess={() => {
              mutate();
              setIsAddProductModalOpen(false);
            }}
          />
        )}

        {isAddMemberModalOpen && (
          <AddProjectMemberModal
            isOpen={isAddMemberModalOpen}
            onClose={() => setIsAddMemberModalOpen(false)}
            projectId={projectId}
            existingMemberIds={project.members?.map(m => m.user.id) || []}
            onSuccess={() => {
              mutate();
              setIsAddMemberModalOpen(false);
            }}
          />
        )}

        {isReservationModalOpen && (
          <ReservationCartModal
            isOpen={isReservationModalOpen}
            onClose={() => setIsReservationModalOpen(false)}
            initialProjectId={projectId}
            onSuccess={() => {
              loadReservations();
              setIsReservationModalOpen(false);
            }}
          />
        )}

        {isExitSlipModalOpen && project && (
          <ProjectExitSlipModal
            isOpen={isExitSlipModalOpen}
            onClose={() => setIsExitSlipModalOpen(false)}
            projectId={projectId}
            projectName={project.name}
            onSuccess={() => {
              mutate();
              setIsExitSlipModalOpen(false);
            }}
          />
        )}
      </div>
    </RouteGuard>
  );
}

