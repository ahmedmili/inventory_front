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
import ConfirmModal from '@/components/ConfirmModal';
import ReservationCartModal from '@/components/reservations/ReservationCartModal';
import Pagination from '@/components/Pagination';

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
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Terminé', className: 'bg-blue-100 text-blue-800' },
      ON_HOLD: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

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

  const getReservationStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
      RELEASED: { label: 'Libérée', className: 'bg-green-100 text-green-800' },
      EXPIRED: { label: 'Expirée', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.description || 'Aucune description'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canUpdate && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <EditIcon className="w-5 h-5" />
                <span>Modifier</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Statut</label>
              <div className="mt-1">{getStatusBadge(project.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Créé par</label>
              <div className="mt-1 text-gray-900">
                {project.createdBy
                  ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                  : '-'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date de début</label>
              <div className="mt-1 text-gray-900">{formatDate(project.startDate)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date de fin</label>
              <div className="mt-1 text-gray-900">{formatDate(project.endDate)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date de création</label>
              <div className="mt-1 text-gray-900">{formatDate(project.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Membres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Membres ({project.members?.length || 0})
            </h2>
            {canUpdate && (
              <button
                onClick={() => {
                  modal.info({
                    title: 'Ajouter un membre',
                    content: 'Fonctionnalité à venir',
                  });
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            )}
          </div>
          {project.members && project.members.length > 0 ? (
            <div className="space-y-2">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.user.firstName} {member.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
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
            <p className="text-gray-500 text-center py-4">Aucun membre assigné</p>
          )}
        </div>

        {/* Produits Réservés */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Produits Réservés ({productReservations.length})
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setReservationPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="RELEASED">Libérée</option>
                <option value="EXPIRED">Expirée</option>
              </select>
              
              {canCreateReservation && (
                <button
                  onClick={() => setIsReservationModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <ReservationIcon className="w-4 h-4" />
                  <span>Nouvelle réservation</span>
                </button>
              )}
            </div>
          </div>

          {loadingReservations ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : productReservations.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">
                        {/* Expand/Collapse column */}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Produit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantité totale réservée
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nombre de réservations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productReservations.map((entry) => {
                      const isExpanded = expandedProducts.has(entry.product.id);
                      // Group reservations by groupId
                      const reservationsByGroup = entry.groups.map(group => ({
                        group,
                        items: entry.reservations.filter((r: any) => r.groupId === group.groupId),
                      }));

                      return (
                        <React.Fragment key={entry.product.id}>
                          <tr
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => toggleProduct(entry.product.id)}
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProduct(entry.product.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <svg
                                  className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">{entry.product.name}</div>
                                {entry.product.sku && (
                                  <div className="text-sm text-gray-500">SKU: {entry.product.sku}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-semibold">
                              {entry.totalQuantity}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {entry.reservations.length}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 bg-gray-50">
                                <div className="space-y-3">
                                  {reservationsByGroup.map(({ group, items }) => (
                                    <div
                                      key={group.groupId}
                                      className="border border-gray-200 rounded-lg p-4 bg-white"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          {getReservationStatusBadge(group.status)}
                                          <span className="text-sm text-gray-600">
                                            {formatDateTime(group.createdAt)}
                                          </span>
                                          {group.user && (
                                            <span className="text-sm text-gray-600">
                                              par {group.user.firstName} {group.user.lastName}
                                            </span>
                                          )}
                                        </div>
                                        {group.expiresAt && (
                                          <span className="text-sm text-gray-500">
                                            Expire le: {formatDateTime(group.expiresAt)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {group.notes && (
                                        <p className="text-sm text-gray-600 mb-3 italic">"{group.notes}"</p>
                                      )}

                                      <div className="space-y-2">
                                        {items.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                          >
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-900">{item.product?.name}</div>
                                              {item.product?.sku && (
                                                <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <div className="font-semibold text-gray-900">{item.quantity}</div>
                                              <div className="text-xs text-gray-500">quantité</div>
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
                <div className="mt-4">
                  <Pagination
                    currentPage={reservationPage}
                    totalPages={reservationMeta.totalPages}
                    onPageChange={setReservationPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Aucun produit réservé pour ce projet</p>
              {canCreateReservation && (
                <button
                  onClick={() => setIsReservationModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <ReservationIcon className="w-5 h-5" />
                  <span>Créer une réservation</span>
                </button>
              )}
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
      </div>
    </RouteGuard>
  );
}

