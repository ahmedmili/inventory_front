'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import RouteGuard from '@/components/guards/RouteGuard';
import { EyeIcon, EditIcon, PlusIcon, TrashIcon, ReservationIcon, UserIcon, PackageIcon, ProjectIcon } from '@/components/icons';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import ConfirmModal from '@/components/ConfirmModal';
import { useModal } from '@/contexts/ModalContext';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import ReservationCartModal from '@/components/reservations/ReservationCartModal';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { apiClient } from '@/lib/api';
import { exportProjectsToCSV, downloadCSV } from '@/lib/csv-utils';
import { exportProjectsToExcel } from '@/lib/excel-utils';
import { SearchFilter, SelectFilter, StatusBadge, StatisticsCard, ModernTable } from '@/components/ui';
import type { TableColumn } from '@/types/shared';
import { useUrlSync } from '@/hooks/useUrlSync';
import type { Project, PaginationMeta, ProjectStatus } from '@/types/shared';

interface ProjectWithCounts extends Project {
  _count?: {
    members: number;
    products: number;
  };
}

interface ProjectsResponse {
  data: ProjectWithCounts[];
  meta: PaginationMeta;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const limit = 20;
  
  // Hooks that require providers - call them after state initialization
  const toast = useToast();
  const modal = useModal();
  const { mutate: deleteProject, loading: deleting } = useApiMutation();
  const canDelete = hasPermission(user, 'projects.delete');
  const canCreate = hasPermission(user, 'projects.create');
  const canUpdate = hasPermission(user, 'projects.update');
  const canCreateReservation = hasPermission(user, 'reservations.create');

  // Synchroniser l'URL avec les filtres et la pagination
  useUrlSync({
    page: page > 1 ? page : undefined,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const apiParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    return params.toString();
  }, [page, search, limit, statusFilter]);

  const { data, loading, error, mutate } = useApi<ProjectsResponse>(`/projects?${apiParams}`);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
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


  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleExportProjectsCSV = async () => {
    try {
      // Fetch all projects for export
      const response = await apiClient.get('/projects?limit=10000');
      const projects = response.data?.data || response.data || [];
      const csvContent = exportProjectsToCSV(projects);
      downloadCSV(csvContent, `projets_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Export CSV réussi');
    } catch (error: any) {
      console.error('Export CSV error:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const handleExportProjectsExcel = async () => {
    try {
      // Fetch all projects for export
      const response = await apiClient.get('/projects?limit=10000');
      const projects = response.data?.data || response.data || [];
      await exportProjectsToExcel(projects, `projets_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export Excel réussi');
    } catch (error: any) {
      console.error('Export Excel error:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const columns: TableColumn<ProjectWithCounts>[] = [
    {
      key: 'name',
      label: 'Nom du projet',
      render: (project: ProjectWithCounts) => (
        <div className="min-w-[200px]">
          <div className="font-semibold text-gray-900 mb-1">{project.name}</div>
          {project.description && (
            <div className="text-xs text-gray-500 line-clamp-2">{project.description}</div>
          )}
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'status',
      label: 'Statut',
      align: 'center',
      render: (project) => (
        <StatusBadge status={project.status as ProjectStatus} variant="default" size="sm" />
      ),
      className: 'text-center',
      width: '120px',
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (project: ProjectWithCounts) => (
        <div className="text-sm space-y-1 min-w-[150px]">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-xs">Début:</span>
            <span className="font-medium text-gray-700">{formatDate(project.startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-xs">Fin:</span>
            <span className="font-medium text-gray-700">{formatDate(project.endDate)}</span>
          </div>
        </div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'stats',
      label: 'Membres / Produits',
      align: 'center',
      render: (project: ProjectWithCounts) => (
        <div className="text-sm text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-700">{project._count?.members || 0}</span>
            <span className="text-gray-500 text-xs">membre(s)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <PackageIcon className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-gray-700">{project._count?.products || 0}</span>
            <span className="text-gray-500 text-xs">produit(s)</span>
          </div>
        </div>
      ),
      className: 'text-center min-w-[150px]',
      width: '150px',
    },
    {
      key: 'createdBy',
      label: 'Créé par',
      render: (project) => (
        <div className="text-sm min-w-[150px]">
          {project.createdBy ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {project.createdBy.firstName[0]}{project.createdBy.lastName[0]}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {project.createdBy.firstName} {project.createdBy.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[120px]">
                  {project.createdBy.email}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 italic">-</span>
          )}
        </div>
      ),
      className: 'min-w-[150px]',
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (project: ProjectWithCounts) => (
        <div className="flex items-center justify-center gap-1">
          <Link
            href={`/projects/${project.id}`}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
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
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="Créer une réservation pour ce projet"
            >
              <ReservationIcon className="w-5 h-5" />
            </button>
          )}
          {canUpdate && (
            <button
              onClick={() => handleOpenEditModal(project.id)}
              className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="Modifier"
            >
              <EditIcon className="w-5 h-5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteClick(project.id, project.name)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="Supprimer"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      ),
      className: 'text-center',
      width: '150px',
    },
  ];

  if (error) {
    return (
      <RouteGuard requirements={{ requirePermissions: ['projects.read'] }}>
        <div className="max-w-7xl mx-auto min-w-0 w-full p-4 sm:p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erreur lors du chargement des projets</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  // Calculate statistics
  const totalProjects = data?.meta?.total || data?.data?.length || 0;
  const activeProjects = data?.data?.filter(p => p.status === 'ACTIVE').length || 0;
  const completedProjects = data?.data?.filter(p => p.status === 'COMPLETED').length || 0;
  const onHoldProjects = data?.data?.filter(p => p.status === 'ON_HOLD').length || 0;

  return (
    <RouteGuard requirements={{ requirePermissions: ['projects.read'] }}>
      <div className="max-w-7xl mx-auto min-w-0 w-full p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="min-w-0 overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Projets</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Gérez vos projets et leurs ressources
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                    label: 'Exporter en CSV',
                    description: 'Format texte compatible avec Excel',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    onClick: handleExportProjectsCSV,
                  },
                  {
                    label: 'Exporter en Excel',
                    description: 'Format .xlsx avec formatage',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    onClick: handleExportProjectsExcel,
                  },
                ]}
              />
              {canCreate && (
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Nouveau projet</span>
                  <span className="sm:hidden">Nouveau</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {data?.data && data.data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatisticsCard
              title="Total Projets"
              value={totalProjects}
              icon={<ProjectIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="blue"
            />
            <StatisticsCard
              title="Actifs"
              value={activeProjects}
              icon={<ProjectIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="green"
            />
            <StatisticsCard
              title="Terminés"
              value={completedProjects}
              icon={<ProjectIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="purple"
            />
            <StatisticsCard
              title="En attente"
              value={onHoldProjects}
              icon={<ProjectIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              colorScheme="orange"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
          <SearchFilter
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher un projet..."
            className="flex-1"
          />
          <SelectFilter
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'ACTIVE', label: 'Actif' },
              { value: 'COMPLETED', label: 'Terminé' },
              { value: 'ON_HOLD', label: 'En attente' },
              { value: 'CANCELLED', label: 'Annulé' },
            ]}
            placeholder="Tous les statuts"
            className="w-full sm:w-auto"
          />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <ModernTable
              columns={columns}
              data={data?.data || []}
              headerGradient="from-blue-600 via-blue-500 to-indigo-600"
              striped={true}
              hoverable={true}
              emptyMessage="Aucun projet trouvé"
              minWidth="1000px"
            />

            {/* Pagination */}
            {data?.meta && data.meta.total > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{(data.meta.page - 1) * data.meta.limit + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(data.meta.page * data.meta.limit, data.meta.total)}
                  </span>{' '}
                  sur <span className="font-medium">{data.meta.total}</span> projet{data.meta.total !== 1 ? 's' : ''}
                </div>
                {data.meta.totalPages > 1 && (
                  <Pagination
                    currentPage={data.meta.page}
                    totalPages={data.meta.totalPages}
                    onPageChange={setPage}
                    hasNext={data.meta.hasNext}
                    hasPrev={data.meta.hasPrev}
                  />
                )}
              </div>
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

