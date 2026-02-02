'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { StatisticsCard, ModernTable, SearchFilter, StatusBadge } from '@/components/ui';
import { UserIcon, PlusIcon } from '@/components/icons';
import type { TableColumn } from '@/types/shared';
import { type SortDirection } from '@/components/Table';
import Pagination from '@/components/Pagination';
import { useUrlSync } from '@/hooks/useUrlSync';

interface RoleOption {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  deletedAt: string | null;
  role: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface CreateAdminForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
}

const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default function AdminsPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [includeDeleted, setIncludeDeleted] = useState(searchParams?.get('includeDeleted') === 'true');
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const limit = 20;

  // Debounce search input - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Synchroniser l'URL avec les filtres et la pagination
  useUrlSync({
    page: page > 1 ? page : undefined,
    search: search || undefined,
    includeDeleted: includeDeleted ? 'true' : undefined,
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    if (includeDeleted) {
      params.set('includeDeleted', 'true');
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  }, [search, includeDeleted]);

  const {
    data: adminsData,
    loading: adminsLoading,
    mutate: refreshAdmins,
  } = useApi<AdminUser[]>(`/users/admins${queryString}`);

  const { data: roleOptions } = useApi<RoleOption[]>('/users/admins/roles');

  const { mutate: sendUserAction, loading: actionLoading } = useApiMutation();
  const { mutate: createAdminRequest, loading: inviteLoading } = useApiMutation();

  const admins = adminsData ?? [];

  const adminRoles = useMemo(
    () => roleOptions?.filter((role) => ['ADMIN', 'MANAGER'].includes(role.code)) ?? [],
    [roleOptions],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAdminForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: '',
    },
  });

  const watchedRoleId = watch('roleId');

  useEffect(() => {
    if (!watchedRoleId && adminRoles.length > 0) {
      setValue('roleId', adminRoles[0].id);
    }
  }, [adminRoles, watchedRoleId, setValue]);

  const handleInviteModalClose = () => {
    setInviteModalOpen(false);
    reset();
  };

  const onInviteSubmit = async (data: CreateAdminForm) => {
    setActionUserId('create');
    try {
      await createAdminRequest('/users/admins', 'POST', data);
      toast.success('Nouvel administrateur créé avec succès');
      handleInviteModalClose();
      refreshAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de créer le compte');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    setActionUserId(user.id);
    try {
      await sendUserAction(`/users/${user.id}`, 'DELETE');
      toast.success('Compte administrateur désactivé');
      refreshAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la désactivation');
    } finally {
      setActionUserId(null);
    }
  };

  const handleRestore = async (user: AdminUser) => {
    setActionUserId(user.id);
    try {
      await sendUserAction(`/users/${user.id}/restore`, 'POST');
      toast.success('Compte restauré avec succès');
      refreshAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de restaurer le compte');
    } finally {
      setActionUserId(null);
    }
  };

  const handleStatusChange = async (user: AdminUser, value: 'active' | 'inactive') => {
    const isCurrentlyInactive = Boolean(user.deletedAt);
    if (value === 'active' && isCurrentlyInactive) {
      await handleRestore(user);
      return;
    }
    if (value === 'inactive' && !isCurrentlyInactive) {
      await handleDeactivate(user);
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    if (!user.role) return;
    const targetRoleCode = user.role.code === 'ADMIN' ? 'MANAGER' : 'ADMIN';
    const targetRole = adminRoles.find((role) => role.code === targetRoleCode);
    if (!targetRole) {
      toast.error('Rôle cible introuvable');
      return;
    }

    setActionUserId(user.id);
    try {
      await sendUserAction(`/users/${user.id}/role`, 'PATCH', { role: targetRole.id });
      toast.success(`Rôle mis à jour (${targetRole.name})`);
      refreshAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de mettre à jour le rôle');
    } finally {
      setActionUserId(null);
    }
  };

  const sortedAdmins = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return admins;
    }

    const data = [...admins];
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    const getValue = (user: AdminUser) => {
      switch (sortKey) {
        case 'name':
          return `${user.firstName} ${user.lastName}`.toLowerCase();
        case 'email':
          return user.email.toLowerCase();
        case 'role':
          return user.role?.code ?? '';
        case 'status':
          return user.deletedAt ? 'inactive' : 'active';
        case 'createdAt':
        default:
          return user.createdAt;
      }
    };

    data.sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);
      if (valueA < valueB) return -1 * multiplier;
      if (valueA > valueB) return 1 * multiplier;
      return 0;
    });

    return data;
  }, [admins, sortKey, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : '');
    setSortDirection(direction);
  };

  // Pagination côté client
  const paginatedAdmins = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedAdmins.slice(start, end);
  }, [sortedAdmins, page, limit]);

  const totalPages = Math.ceil(sortedAdmins.length / limit);

  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'name',
      label: 'Utilisateur',
      sortable: true,
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (user: AdminUser) => (
        user.role?.code ? (
          <StatusBadge status={user.role.code} variant="default" size="sm" />
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
      align: 'center',
      className: 'text-center',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user: AdminUser) => (
        <span className="text-sm text-gray-700 min-w-[200px]">{user.email}</span>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-600">{dateFormatter.format(new Date(user.createdAt))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              user.deletedAt ? 'bg-gray-400' : 'bg-green-500'
            }`}
            aria-hidden
          />
          <select
            value={user.deletedAt ? 'inactive' : 'active'}
            onChange={(event) =>
              handleStatusChange(user, event.target.value as 'active' | 'inactive')
            }
            disabled={actionLoading && actionUserId === user.id}
            className="rounded-lg border border-gray-200 bg-white py-1 pl-2 pr-6 text-xs font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200 disabled:opacity-50"
          >
            <option value="active">Actif</option>
            <option value="inactive">Désactivé</option>
          </select>
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'min-w-0 w-28',
      render: (user) => (
        <div className="flex min-w-0 flex-shrink items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleRole(user)}
            disabled={actionLoading && actionUserId === user.id}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-primary-200 bg-white p-2 text-primary-600 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={user.role?.code === 'ADMIN' ? 'Basculer en Manager' : 'Basculer en Admin'}
            aria-label={user.role?.code === 'ADMIN' ? 'Basculer en Manager' : 'Basculer en Admin'}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h13M4 17h13" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3l6 4-6 4M15 21l6-4-6-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => (user.deletedAt ? handleRestore(user) : handleDeactivate(user))}
            disabled={actionLoading && actionUserId === user.id}
            className={`inline-flex flex-shrink-0 items-center justify-center rounded-full border p-2 ${
              user.deletedAt
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={user.deletedAt ? 'Restaurer le compte' : 'Désactiver le compte'}
            aria-label={user.deletedAt ? 'Restaurer le compte' : 'Désactiver le compte'}
          >
            {user.deletedAt ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12l5 5M4 12l5-5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      ),
    },
  ];

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((user) => !user.deletedAt).length;
  const adminCount = admins.filter((user) => user.role?.code === 'ADMIN').length;
  const managerCount = admins.filter((user) => user.role?.code === 'MANAGER').length;
  const inactiveAdmins = totalAdmins - activeAdmins;

  return (
    <div className="max-w-7xl mx-auto min-w-0 w-full overflow-x-hidden p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="min-w-0 overflow-hidden bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 break-words">Administrateurs</h1>
            <p className="text-sm sm:text-base text-gray-600 break-words">
              Suivez et pilotez les accès sensibles. Seuls les rôles Admin et Manager sont listés ici.
            </p>
          </div>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 flex-shrink-0 whitespace-nowrap"
            title="Inviter un nouvel administrateur ou manager"
          >
            <PlusIcon className="w-5 h-5 sm:mr-2 flex-shrink-0" />
            <span className="hidden lg:inline">Inviter un administrateur</span>
            <span className="lg:hidden">Inviter</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {admins.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <StatisticsCard
            title="Comptes actifs"
            value={activeAdmins}
            icon={<UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="green"
          />
          <StatisticsCard
            title="Admins"
            value={adminCount}
            icon={<UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="purple"
          />
          <StatisticsCard
            title="Managers"
            value={managerCount}
            icon={<UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="blue"
          />
          <StatisticsCard
            title="Total comptes"
            value={totalAdmins}
            icon={<UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            colorScheme="orange"
          />
        </div>
      )}

      {/* Filters */}
      <div className="min-w-0 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full min-w-0">
            <SearchFilter
              value={searchInput}
              onChange={(value) => {
                setSearchInput(value);
                setPage(1);
              }}
              placeholder="Rechercher par nom ou email..."
              className="flex-1 min-w-0"
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 sm:whitespace-nowrap">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={includeDeleted}
                onChange={(event) => {
                  setIncludeDeleted(event.target.checked);
                  setPage(1);
                }}
              />
              Inclure les comptes désactivés
            </label>
          </div>
        </div>
      </div>

      {/* Table: scroll container so horizontal scroll stays here, not on viewport */}
      <div className="min-w-0 w-full overflow-x-auto">
        <ModernTable
          columns={columns}
          data={paginatedAdmins}
          headerGradient="from-purple-600 via-purple-500 to-indigo-600"
          striped={true}
          hoverable={true}
          emptyMessage={
            search
              ? 'Aucun administrateur ne correspond à votre recherche.'
              : 'Aucun administrateur enregistré pour le moment.'
          }
          minWidth="1000px"
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            hasNext={page < totalPages}
            hasPrev={page > 1}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      <Modal
        isOpen={isInviteModalOpen}
        onClose={handleInviteModalClose}
        title="Inviter un administrateur"
        size="lg"
        variant="form"
        icon={
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-blue-100">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        }
      >
        <form className="space-y-6" onSubmit={handleSubmit(onInviteSubmit)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">Prénom</label>
              <input
                type="text"
                {...register('firstName', { required: 'Le prénom est requis' })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
                placeholder="Ex: Jean"
              />
              {errors.firstName && (
                <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">Nom</label>
              <input
                type="text"
                {...register('lastName', { required: 'Le nom est requis' })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
                placeholder="Ex: Dupont"
              />
              {errors.lastName && (
                <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">Adresse email</label>
            <input
              type="email"
              {...register('email', {
                required: "L'email est requis",
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' },
              })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
              placeholder="exemple@entreprise.com"
            />
            {errors.email && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">Mot de passe initial</label>
            <input
              type="password"
              {...register('password', {
                required: 'Le mot de passe est requis',
                minLength: { value: 8, message: 'Au moins 8 caractères' },
              })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
              placeholder="Minimum 8 caractères"
            />
            {errors.password && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-600 flex items-start gap-1.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>L'utilisateur pourra modifier ce mot de passe après sa première connexion.</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">Rôle attribué</label>
            <select
              {...register('roleId', { required: 'Sélectionnez un rôle' })}
              disabled={adminRoles.length === 0}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              <option value="" disabled>
                Choisir un rôle
              </option>
              {adminRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} · {role.code}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.roleId.message}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-600 flex items-start gap-1.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Seuls les rôles Admin et Manager sont autorisés dans cette section.</span>
            </p>
          </div>

          <div className="rounded-xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900 text-sm mb-1.5">Bon à savoir</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  L'envoi automatique d'e-mails n'est pas encore configuré. Transmettez les identifiants
                  via votre canal sécurisé habituel.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200/60 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleInviteModalClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white hover:border-gray-400 hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              title="Annuler la création"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={inviteLoading || actionUserId === 'create'}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              title="Créer le compte administrateur"
            >
              {inviteLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Création...
                </span>
              ) : (
                'Créer le compte'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <p className="text-center text-xs text-gray-500">
        Pensez à auditer régulièrement les accès privilégiés.
      </p>
    </div>
  );
}
