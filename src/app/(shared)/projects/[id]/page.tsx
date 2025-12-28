'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import RouteGuard from '@/components/guards/RouteGuard';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { EditIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from '@/components/icons';
import Link from 'next/link';
import { useModal } from '@/contexts/ModalContext';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import ConfirmModal from '@/components/ConfirmModal';

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

  if (loading) {
    return (
      <RouteGuard requiredPermissions={['projects.read']}>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !project) {
    return (
      <RouteGuard requiredPermissions={['projects.read']}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Projet introuvable</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredPermissions={['projects.read']}>
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
                                await apiClient.delete(`/projects/${id}/members/${member.user.id}`);
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

        {/* Produits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Produits ({project.products?.length || 0})
            </h2>
            {canUpdate && (
              <button
                onClick={() => {
                  modal.info({
                    title: 'Ajouter un produit',
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
          {project.products && project.products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                    {canUpdate && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {project.products.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{item.product.name}</div>
                          {item.product.sku && (
                            <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {Number(item.product.salePrice).toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {item.notes || '-'}
                      </td>
                      {canUpdate && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              modal.confirm({
                                title: 'Retirer le produit',
                                content: `Êtes-vous sûr de vouloir retirer ${item.product.name} du projet ?`,
                                onConfirm: async () => {
                                  try {
                                    await apiClient.delete(`/projects/${id}/products/${item.product.id}`);
                                    toast.success('Produit retiré avec succès');
                                    mutate();
                                  } catch (error: any) {
                                    toast.error(error.response?.data?.message || 'Erreur lors du retrait du produit');
                                  }
                                },
                              });
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun produit assigné</p>
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
      </div>
    </RouteGuard>
  );
}

