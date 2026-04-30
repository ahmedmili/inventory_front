'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { ModernTable, SearchFilter, StatusBadge } from '@/components/ui';
import { UserIcon, PlusIcon, EditIcon } from '@/components/icons';
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

interface UpdateAdminForm {
  firstName: string;
  lastName: string;
  email: string;
}

interface ChangePasswordForm {
  newPassword: string;
}

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
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
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

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm<UpdateAdminForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordForm>({
    defaultValues: {
      newPassword: '',
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

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedAdmin(null);
    resetEdit();
  };

  const handlePasswordModalClose = () => {
    setPasswordModalOpen(false);
    setSelectedAdmin(null);
    resetPassword();
  };

  const handleOpenEditModal = (user: AdminUser) => {
    setSelectedAdmin(user);
    setEditValue('firstName', user.firstName);
    setEditValue('lastName', user.lastName);
    setEditValue('email', user.email);
    setEditModalOpen(true);
  };

  const handleOpenPasswordModal = (user: AdminUser) => {
    setSelectedAdmin(user);
    resetPassword();
    setPasswordModalOpen(true);
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

  const onEditSubmit = async (data: UpdateAdminForm) => {
    if (!selectedAdmin) return;
    setActionUserId(selectedAdmin.id);
    try {
      await sendUserAction(`/users/${selectedAdmin.id}`, 'PATCH', data);
      toast.success('Administrateur modifié avec succès');
      handleEditModalClose();
      refreshAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de modifier le compte');
    } finally {
      setActionUserId(null);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordForm) => {
    if (!selectedAdmin) return;
    setActionUserId(selectedAdmin.id);
    try {
      await sendUserAction(`/users/${selectedAdmin.id}/password`, 'POST', data);
      toast.success('Mot de passe modifié avec succès');
      handlePasswordModalClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de modifier le mot de passe');
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
        <div className="flex items-center gap-2 min-w-[120px] text-xs font-medium">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              user.deletedAt ? 'bg-gray-400' : 'bg-green-500'
            }`}
            aria-hidden
          />
          <span className={user.deletedAt ? 'text-gray-500' : 'text-green-700'}>
            {user.deletedAt ? 'Désactivé' : 'Actif'}
          </span>
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'min-w-0 w-40',
      render: (user) => (
        <div className="flex min-w-0 flex-shrink items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenEditModal(user)}
            disabled={actionLoading && actionUserId === user.id}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Modifier le compte"
            aria-label="Modifier le compte"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenPasswordModal(user)}
            disabled={actionLoading && actionUserId === user.id}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Changer le mot de passe"
            aria-label="Changer le mot de passe"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 116 0v2H9z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleDeactivate(user)}
            disabled={Boolean(user.deletedAt) || (actionLoading && actionUserId === user.id)}
            className={`inline-flex flex-shrink-0 items-center justify-center rounded-full border p-2 ${
              user.deletedAt
                ? 'border-gray-200 bg-gray-100 text-gray-400'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={user.deletedAt ? 'Compte déjà supprimé' : 'Supprimer le compte'}
            aria-label={user.deletedAt ? 'Compte déjà supprimé' : 'Supprimer le compte'}
          >
            {user.deletedAt ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

  const totalAdmins = sortedAdmins.length;
  const paginationStart = totalAdmins === 0 ? 0 : (page - 1) * limit + 1;
  const paginationEnd = totalAdmins === 0
    ? 0
    : Math.min((page - 1) * limit + paginatedAdmins.length, totalAdmins);

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
            title="Ajouter un nouvel administrateur ou manager"
          >
            <PlusIcon className="w-5 h-5 sm:mr-2 flex-shrink-0" />
            <span className="hidden lg:inline">Ajouter un administrateur</span>
            <span className="lg:hidden">Ajouter</span>
          </button>
        </div>
      </div>

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
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
            <span className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{paginationStart}</span> à{' '}
              <span className="font-medium">{paginationEnd}</span> sur{' '}
              <span className="font-medium">{totalAdmins}</span> administrateur{totalAdmins > 1 ? 's' : ''}
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              hasNext={page < totalPages}
              hasPrev={page > 1}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              embedded
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={isInviteModalOpen}
        onClose={handleInviteModalClose}
        title="Ajouter un administrateur"
        size="lg"
        variant="form"
        icon={
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-blue-100">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        }
      >
        <form className="space-y-6 max-h-[70vh] overflow-y-auto pr-1" onSubmit={handleSubmit(onInviteSubmit)}>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        title="Modifier un administrateur"
        size="lg"
        variant="form"
      >
        <form className="space-y-6" onSubmit={handleEditSubmit(onEditSubmit)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">Prénom</label>
              <input
                type="text"
                {...registerEdit('firstName', { required: 'Le prénom est requis' })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {editErrors.firstName && <p className="mt-2 text-xs font-medium text-red-600">{editErrors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">Nom</label>
              <input
                type="text"
                {...registerEdit('lastName', { required: 'Le nom est requis' })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {editErrors.lastName && <p className="mt-2 text-xs font-medium text-red-600">{editErrors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">Adresse email</label>
            <input
              type="email"
              {...registerEdit('email', {
                required: "L'email est requis",
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' },
              })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {editErrors.email && <p className="mt-2 text-xs font-medium text-red-600">{editErrors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200/60 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleEditModalClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedAdmin || (actionLoading && actionUserId === selectedAdmin.id)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordModalClose}
        title="Changer le mot de passe"
        size="lg"
        variant="form"
      >
        <form className="space-y-6" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">Nouveau mot de passe</label>
            <input
              type="password"
              {...registerPassword('newPassword', {
                required: 'Le mot de passe est requis',
                minLength: { value: 8, message: 'Au moins 8 caractères' },
              })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Minimum 8 caractères"
            />
            {passwordErrors.newPassword && (
              <p className="mt-2 text-xs font-medium text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200/60 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handlePasswordModalClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedAdmin || (actionLoading && actionUserId === selectedAdmin.id)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Mettre à jour
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
