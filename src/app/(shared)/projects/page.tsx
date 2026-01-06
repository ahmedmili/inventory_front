'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import RouteGuard from '@/components/guards/RouteGuard';
import Table, { Column, SortDirection } from '@/components/Table';
import { EyeIcon, EditIcon, PlusIcon, SearchIcon, TrashIcon, ReservationIcon } from '@/components/icons';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ConfirmModal from '@/components/ConfirmModal';
import { useModal } from '@/contexts/ModalContext';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import ReservationCartModal from '@/components/reservations/ReservationCartModal';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
  _count?: {
    members: number;
    products: number;
  };
}

interface ProjectsResponse {
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const modal = useModal();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(''); // Valeur dans l'input (sans debounce)
  const [search, setSearch] = useState(''); // Valeur utilisée pour la requête API (avec debounce)
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const limit = 20;
  const { mutate: deleteProject, loading: deleting } = useApiMutation();
  const canDelete = hasPermission(user, 'projects.delete');
  const canCreate = hasPermission(user, 'projects.create');
  const canUpdate = hasPermission(user, 'projects.update');
  const canCreateReservation = hasPermission(user, 'reservations.create');

  // Debounce pour la recherche : attendre 500ms après la dernière saisie
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Réinitialiser à la page 1 lors d'une nouvelle recherche
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    return params.toString();
  }, [page, search, limit, statusFilter]);

  const { data, loading, error, mutate } = useApi<ProjectsResponse>(`/projects?${searchParams}`);

  const handleSearch = (value: string) => {
    setSearchInput(value); // Mettre à jour immédiatement l'input (sans debounce)
  };

  const handleOpenCreateModal = () => {
    setEditingProjectId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (projectId: string) => {
    setEditingProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProjectId(null);
  };

  const handleModalSuccess = () => {
    if (mutate) {
      mutate();
    }
  };

  const handleDeleteClick = (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(`/projects/${projectToDelete.id}`, 'DELETE');
      toast.success('Projet supprimé avec succès! Il peut être restauré si nécessaire.');
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      if (mutate) {
        mutate();
      }
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Nom du projet',
      sortable: false,
      render: (project) => (
        <div>
          <div className="font-medium text-gray-900">{project.name}</div>
          {project.description && (
            <div className="text-sm text-gray-500 truncate max-w-md">{project.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: false,
      render: (project) => getStatusBadge(project.status),
    },
    {
      key: 'dates',
      label: 'Dates',
      sortable: false,
      render: (project) => (
        <div className="text-sm">
          <div>Début: {formatDate(project.startDate)}</div>
          <div>Fin: {formatDate(project.endDate)}</div>
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Membres / Produits',
      sortable: false,
      render: (project) => (
        <div className="text-sm text-gray-600">
          {project._count?.members || 0} membre(s) / {project._count?.products || 0} produit(s)
        </div>
      ),
    },
    {
      key: 'createdBy',
      label: 'Créé par',
      sortable: false,
      render: (project) => (
        <div className="text-sm text-gray-600">
          {project.createdBy
            ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
            : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (project) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir les détails"
          >
            <EyeIcon className="w-5 h-5" />
          </Link>
          {canCreateReservation && (
            <button
              onClick={() => {
                setSelectedProjectId(project.id);
                setIsReservationModalOpen(true);
              }}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Créer une réservation pour ce projet"
            >
              <ReservationIcon className="w-5 h-5" />
            </button>
          )}
          {canUpdate && (
            <button
              onClick={() => handleOpenEditModal(project.id)}
              className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <EditIcon className="w-5 h-5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteClick(project.id, project.name)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <RouteGuard requirements={{ requirePermissions: ['projects.read'] }}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erreur lors du chargement des projets</p>
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
            <p className="text-gray-600 mt-1">Gérez vos projets et leurs ressources</p>
          </div>
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nouveau projet</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="COMPLETED">Terminé</option>
            <option value="ON_HOLD">En attente</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <Table
                data={data?.data || []}
                columns={columns}
                emptyMessage="Aucun projet trouvé"
              />
            </div>

            {/* Pagination */}
            {data?.meta && data.meta.totalPages > 1 && (
              <Pagination
                currentPage={data.meta.page}
                totalPages={data.meta.totalPages}
                hasNext={data.meta.hasNext}
                hasPrev={data.meta.hasPrev}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* Modals */}
        {isModalOpen && (
          <ProjectFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            projectId={editingProjectId}
            onSuccess={handleModalSuccess}
          />
        )}

        {isDeleteModalOpen && projectToDelete && (
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Supprimer le projet"
            message={`Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete.name}" ? Cette action peut être annulée.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            type="danger"
            loading={deleting}
          />
        )}

        {/* Reservation Modal */}
        {canCreateReservation && (
          <ReservationCartModal
            isOpen={isReservationModalOpen}
            onClose={() => {
              setIsReservationModalOpen(false);
              setSelectedProjectId(null);
            }}
            initialProjectId={selectedProjectId || undefined}
            onSuccess={() => {
              setIsReservationModalOpen(false);
              setSelectedProjectId(null);
              toast.success('Réservation créée avec succès pour ce projet!');
            }}
          />
        )}
      </div>
    </RouteGuard>
  );
}

