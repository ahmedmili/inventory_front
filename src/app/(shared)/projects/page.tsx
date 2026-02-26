'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { TableSkeleton } from '@/components/SkeletonLoader';
import { SearchFilter, SelectFilter, StatusBadge, StatisticsCard, ModernTable, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import type { TableColumn } from '@/types/shared';
import type { Project, PaginationMeta, ProjectStatus } from '@/types/shared';

const LIMIT_OPTIONS = [10, 20, 50] as const;

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
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL = seule source de vérité : plus de retour à la page 1 par effet
  const page = Number(searchParams?.get('page')) || 1;
  const search = searchParams?.get('search') || '';
  const statusFilter = searchParams?.get('status') || 'all';
  const limitFromUrl = Math.min(
    Number(searchParams?.get('limit')) || 20,
    Math.max(...LIMIT_OPTIONS),
  );
  const limit = LIMIT_OPTIONS.includes(limitFromUrl as (typeof LIMIT_OPTIONS)[number])
    ? (limitFromUrl as (typeof LIMIT_OPTIONS)[number])
    : 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const toast = useToast();
  const modal = useModal();
  const { mutate: deleteProject, loading: deleting } = useApiMutation();
  const canDelete = hasPermission(user, 'projects.delete');
  const canCreate = hasPermission(user, 'projects.create');
  const canUpdate = hasPermission(user, 'projects.update');
  const canCreateReservation = hasPermission(user, 'reservations.create');

  const updateUrl = useCallback(
    (updates: { page?: number; search?: string; status?: string; limit?: number }) => {
      const p = new URLSearchParams(searchParams?.toString() || '');
      if (updates.page !== undefined) updates.page === 1 ? p.delete('page') : p.set('page', String(updates.page));
      if (updates.search !== undefined) updates.search ? p.set('search', updates.search) : p.delete('search');
      if (updates.status !== undefined) updates.status === 'all' ? p.delete('status') : p.set('status', updates.status);
      if (updates.limit !== undefined) updates.limit === 20 ? p.delete('limit') : p.set('limit', String(updates.limit));
      router.replace(`?${p.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleLimitChange = (newLimit: number) => {
    if (newLimit === limit) return;
    updateUrl({ limit: newLimit, page: 1 });
  };

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
    if (value === search) return; // évite le reset page 1 quand SearchFilter appelle onChange au montage / debounce
    updateUrl({ search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === statusFilter) return; // évite le reset page 1 si même valeur
    updateUrl({ status: value, page: 1 });
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

  const columns: TableColumn<ProjectWithCounts>[] = [
    {
      key: 'name',
      label: 'Nom du projet',
      render: (project: ProjectWithCounts) => (
        <div className="min-w-[200px]">
          <div className="font-semibold text-gray-900 mb-1">
            {/* {
            project.code &&
             <span className="text-gray-500 font-normal mr-2">
             {project.code}</span>
             }
            {' '} */}
            {project.name}
          </div>
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
            <div>
              <div className="font-medium text-gray-900">
                {project.createdBy.firstName} {project.createdBy.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[120px]">
                {project.createdBy.email}
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
        <div className="min-w-0 overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Projets</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Gérez vos projets et leurs ressources
              </p>
            </div>
            <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
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
            placeholder=""
            className="w-full sm:w-auto"
          />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <>
            <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <TableSkeleton rows={8} cols={6} />
            </div>
            <div className="md:hidden grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
                  <div className="border-t-4 border-t-blue-500 bg-gray-50/50 px-4 pt-4 pb-3">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-0">
                    <div className="flex justify-between py-2.5 border-b border-gray-100"><div className="h-3 bg-gray-100 rounded w-16" /><div className="h-3 bg-gray-100 rounded w-24" /></div>
                    <div className="flex justify-between py-2.5 border-b border-gray-100"><div className="h-3 bg-gray-100 rounded w-12" /><div className="h-3 bg-gray-100 rounded w-20" /></div>
                    <div className="flex justify-between py-2.5"><div className="h-3 bg-gray-100 rounded w-14" /><div className="h-3 bg-gray-100 rounded w-8" /></div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex gap-1">
                    <div className="h-9 w-9 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-9 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-9 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:block w-full min-w-0">
              <ModernTable
                columns={columns}
                data={data?.data || []}
                headerGradient="from-blue-600 via-blue-500 to-indigo-600"
                striped={true}
                hoverable={true}
                emptyMessage="Aucun projet trouvé"
                minWidth="100%"
                resizable={true}
              />
            </div>

            {/* Cards: small screens */}
            <div className="md:hidden grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {(!data?.data || data.data.length === 0) ? (
                <div className="col-span-full rounded-xl border-2 border-gray-200 bg-white py-8 text-center">
                  <p className="text-gray-500 text-sm">Aucun projet trouvé</p>
                </div>
              ) : (
                data.data.map((project: ProjectWithCounts) => (
                  <Card key={project.id} className="overflow-hidden border-t-4 border-t-blue-500">
                    <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-b from-gray-50/80 to-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-bold truncate text-gray-900" title={project.name}>{project.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 text-gray-500">
                            {formatDate(project.startDate)} → {formatDate(project.endDate)}
                          </CardDescription>
                        </div>
                        <span className="shrink-0"><StatusBadge status={project.status as ProjectStatus} variant="default" size="sm" /></span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 py-3 space-y-0">
                      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Membres</span>
                        <span className="text-sm font-medium text-gray-700">{project._count?.members ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Produits</span>
                        <span className="text-sm font-medium text-gray-700">{project._count?.products ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Créé par</span>
                        <span className="text-sm text-gray-700 truncate max-w-[55%]">
                          {project.createdBy ? `${project.createdBy.firstName} ${project.createdBy.lastName}` : '—'}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-0.5 px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors active:scale-95"
                        title="Voir les détails"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {canCreateReservation && (
                        <button
                          onClick={() => { setSelectedProjectId(project.id); setIsReservationModalOpen(true); }}
                          className="inline-flex items-center justify-center p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors active:scale-95"
                          title="Créer une réservation"
                        >
                          <ReservationIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenEditModal(project.id)}
                          className="inline-flex items-center justify-center p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors active:scale-95"
                          title="Modifier"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(project.id, project.name)}
                          disabled={deleting}
                          className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {data?.meta && data.meta.total > 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
                    <span className="text-sm text-gray-700">
                      Affichage de <span className="font-medium">{(data.meta.page - 1) * data.meta.limit + 1}</span> à{' '}
                      <span className="font-medium">
                        {Math.min(data.meta.page * data.meta.limit, data.meta.total)}
                      </span>{' '}
                      sur <span className="font-medium">{data.meta.total}</span> projet{data.meta.total !== 1 ? 's' : ''}
                    </span>
                    {data.meta.totalPages > 1 && (
                      <Pagination
                        currentPage={data.meta.page}
                        totalPages={data.meta.totalPages}
                        onPageChange={(p) => updateUrl({ page: p })}
                        hasNext={data.meta.hasNext}
                        hasPrev={data.meta.hasPrev}
                        embedded
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label htmlFor="projects-limit" className="text-sm text-gray-600 whitespace-nowrap">
                      Par page
                    </label>
                    <select
                      id="projects-limit"
                      value={limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {LIMIT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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

