'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal';
import Table, { Column, SortDirection } from '@/components/Table';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';

interface RoleOption {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

interface EmployeeUser {
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

interface CreateEmployeeForm {
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

export default function EmployeesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    if (includeDeleted) {
      params.set('includeDeleted', 'true');
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  }, [debouncedSearch, includeDeleted]);

  const {
    data: employeesData,
    loading: employeesLoading,
    mutate: refreshEmployees,
  } = useApi<EmployeeUser[]>(`/users/employees${queryString}`);

  const { data: roleOptions } = useApi<RoleOption[]>('/users/employees/roles');

  const { mutate: sendUserAction, loading: actionLoading } = useApiMutation();
  const { mutate: createEmployeeRequest, loading: inviteLoading } = useApiMutation();

  const employees = employeesData ?? [];

  const employeeRoles = useMemo(
    () => roleOptions?.filter((role) => ['EMPLOYEE', 'STOCK_KEEPER'].includes(role.code)) ?? [],
    [roleOptions],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEmployeeForm>({
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
    if (!watchedRoleId && employeeRoles.length > 0) {
      setValue('roleId', employeeRoles[0].id);
    }
  }, [employeeRoles, watchedRoleId, setValue]);

  const handleInviteModalClose = () => {
    setInviteModalOpen(false);
    reset();
  };

  const onInviteSubmit = async (data: CreateEmployeeForm) => {
    setActionUserId('create');
    try {
      await createEmployeeRequest('/users/employees', 'POST', data);
      toast.success('Nouvel employé créé avec succès');
      handleInviteModalClose();
      refreshEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de créer le compte');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeactivate = async (user: EmployeeUser) => {
    setActionUserId(user.id);
    try {
      await sendUserAction(`/users/${user.id}`, 'DELETE');
      toast.success('Compte employé désactivé');
      refreshEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la désactivation');
    } finally {
      setActionUserId(null);
    }
  };

  const handleRestore = async (user: EmployeeUser) => {
    setActionUserId(user.id);
    try {
      await sendUserAction(`/users/${user.id}/restore`, 'POST');
      toast.success('Compte restauré avec succès');
      refreshEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de restaurer le compte');
    } finally {
      setActionUserId(null);
    }
  };

  const handleStatusChange = async (user: EmployeeUser, value: 'active' | 'inactive') => {
    const isCurrentlyInactive = Boolean(user.deletedAt);
    if (value === 'active' && isCurrentlyInactive) {
      await handleRestore(user);
      return;
    }
    if (value === 'inactive' && !isCurrentlyInactive) {
      await handleDeactivate(user);
    }
  };

  const handleToggleRole = async (user: EmployeeUser) => {
    if (!user.role) return;
    const targetRoleCode = user.role.code === 'EMPLOYEE' ? 'STOCK_KEEPER' : 'EMPLOYEE';
    const targetRole = employeeRoles.find((role) => role.code === targetRoleCode);
    if (!targetRole) {
      toast.error('Rôle cible introuvable');
      return;
    }

    setActionUserId(user.id);
    try {
      await sendUserAction(`/users/${user.id}/role`, 'PATCH', { role: targetRole.id });
      toast.success(`Rôle mis à jour (${targetRole.name})`);
      refreshEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de mettre à jour le rôle');
    } finally {
      setActionUserId(null);
    }
  };

  const sortedEmployees = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return employees;
    }

    const data = [...employees];
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    const getValue = (user: EmployeeUser) => {
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
  }, [employees, sortKey, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : '');
    setSortDirection(direction);
  };

  const columns: Column<EmployeeUser>[] = [
    {
      key: 'name',
      label: 'Utilisateur',
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500">{user.id.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
            {user.role?.name || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => <span className="text-sm text-gray-700">{user.email}</span>,
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
      render: (user) => (
        <div className="flex items-center gap-2">
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
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleRole(user)}
            disabled={actionLoading && actionUserId === user.id}
            className="inline-flex items-center justify-center rounded-full border border-primary-200 bg-white p-2 text-primary-600 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={user.role?.code === 'EMPLOYEE' ? 'Basculer en Stock Keeper' : 'Basculer en Employé'}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h13M4 17h13" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3l6 4-6 4M15 21l6-4-6-4" />
            </svg>
            <span className="sr-only">
              {user.role?.code === 'EMPLOYEE' ? 'Basculer en Stock Keeper' : 'Basculer en Employé'}
            </span>
          </button>
          <button
            onClick={() => (user.deletedAt ? handleRestore(user) : handleDeactivate(user))}
            disabled={actionLoading && actionUserId === user.id}
            className={`inline-flex items-center justify-center rounded-full border p-2 ${
              user.deletedAt
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={user.deletedAt ? 'Restaurer le compte' : 'Désactiver le compte'}
          >
            {user.deletedAt ? (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12l5 5M4 12l5-5" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="sr-only">
              {user.deletedAt ? 'Restaurer le compte' : 'Désactiver le compte'}
            </span>
          </button>
        </div>
      ),
    },
  ];

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((user) => !user.deletedAt).length;
  const employeeCount = employees.filter((user) => user.role?.code === 'EMPLOYEE').length;
  const stockKeeperCount = employees.filter((user) => user.role?.code === 'STOCK_KEEPER').length;
  const inactiveEmployees = totalEmployees - activeEmployees;

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employés</h1>
          <p className="text-gray-600 mt-2">
            Gérez les comptes des employés et des gestionnaires de stock.
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          title="Créer un nouveau compte employé"
        >
          + Ajouter un employé
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Comptes actifs"
          value={activeEmployees}
          helperText={`${inactiveEmployees} inactif${inactiveEmployees > 1 ? 's' : ''}`}
        />
        <StatCard label="Employés" value={employeeCount} helperText="Rôle EMPLOYEE" />
        <StatCard label="Gestionnaires de stock" value={stockKeeperCount} helperText="Rôle STOCK_KEEPER" />
        <StatCard
          label="Tous les comptes"
          value={totalEmployees}
          helperText={debouncedSearch ? 'Recherche filtrée' : 'Tous les employés'}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={includeDeleted}
                onChange={(event) => setIncludeDeleted(event.target.checked)}
              />
              Inclure les comptes désactivés
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Actualisé le {dateFormatter.format(new Date())}
          </p>
        </div>

        <Table
          data={sortedEmployees}
          columns={columns}
          loading={employeesLoading}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
          emptyMessage={
            debouncedSearch
              ? 'Aucun employé ne correspond à votre recherche.'
              : 'Aucun employé enregistré pour le moment.'
          }
        />
      </div>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={handleInviteModalClose}
        title="Ajouter un employé"
        size="lg"
      >
        <form className="space-y-5" onSubmit={handleSubmit(onInviteSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                type="text"
                {...register('firstName', { required: 'Le prénom est requis' })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                {...register('lastName', { required: 'Le nom est requis' })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
            <input
              type="email"
              {...register('email', {
                required: "L'email est requis",
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' },
              })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe initial</label>
            <input
              type="password"
              {...register('password', {
                required: 'Le mot de passe est requis',
                minLength: { value: 8, message: 'Au moins 8 caractères' },
              })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              L'utilisateur pourra modifier ce mot de passe après sa première connexion.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle attribué</label>
            <select
              {...register('roleId', { required: 'Sélectionnez un rôle' })}
              disabled={employeeRoles.length === 0}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200 disabled:bg-gray-100"
            >
              <option value="" disabled>
                Choisir un rôle
              </option>
              {employeeRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} · {role.code}
                </option>
              ))}
            </select>
            {errors.roleId && <p className="mt-1 text-xs text-red-600">{errors.roleId.message}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Seuls les rôles Employé et Gestionnaire de stock sont autorisés dans cette section.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Bon à savoir</p>
            <p className="mt-1">
              L'envoi automatique d'e-mails n'est pas encore configuré. Transmettez les identifiants
              via votre canal sécurisé habituel.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleInviteModalClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Annuler la création"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={inviteLoading || actionUserId === 'create'}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
              title="Créer le compte employé"
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
        Gérez les accès et permissions des employés depuis cette interface.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helperText,
}: {
  label: string;
  value: number;
  helperText?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{numberFormatter.format(value)}</p>
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
