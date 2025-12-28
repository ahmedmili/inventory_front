'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal';
import Table, { Column, SortDirection } from '@/components/Table';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import Pagination from '@/components/Pagination';
import { SearchIcon, CloseIcon } from '@/components/icons';
import Autocomplete from '@/components/ui/Autocomplete';
import { apiClient } from '@/lib/api';

interface Permission {
  id: string;
  name: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
  isActive: boolean;
}

interface RolePermission {
  id: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  permissions: RolePermission[];
  _count?: {
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateRoleForm {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

interface CreatePermissionForm {
  name: string;
  code: string;
  resource: string;
  action: string;
  description: string;
  isActive?: boolean;
}

// Suggestions de codes de rôles (utilisés pour l'autocomplete)
const ROLE_CODE_SUGGESTIONS = [
  'ADMIN',
  'MANAGER',
  'EMPLOYEE',
  'STOCK_KEEPER',
  'PROJECT_MANAGER',
  'VIEWER',
];

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default function RolesPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCreatePermissionModalOpen, setCreatePermissionModalOpen] = useState(false);
  const [isEditPermissionModalOpen, setEditPermissionModalOpen] = useState(false);
  const [isDeletePermissionModalOpen, setDeletePermissionModalOpen] = useState(false);
  const [isUsersModalOpen, setUsersModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filtres et pagination pour les rôles
  const [roleSearch, setRoleSearch] = useState('');
  const [roleStatusFilter, setRoleStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [rolePage, setRolePage] = useState(1);
  const rolesPerPage = 10;
  
  // Filtres et pagination pour les permissions
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionResourceFilter, setPermissionResourceFilter] = useState<string>('all');
  const [permissionActionFilter, setPermissionActionFilter] = useState<string>('all');
  const [permissionPage, setPermissionPage] = useState(1);
  const permissionsPerPage = 10;

  const { data: rolesData, loading: rolesLoading, mutate: refreshRoles } = useApi<Role[]>('/roles');
  const { data: allPermissions, mutate: refreshPermissions } = useApi<Permission[]>('/roles/permissions/all');
  const { mutate: sendAction, loading: actionLoading } = useApiMutation();

  const roles = rolesData ?? [];
  const permissions = allPermissions ?? [];

  const canManage = hasPermission(user, 'roles.manage');

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    setValue: setCreateValue,
    formState: { errors: errorsCreate },
  } = useForm<CreateRoleForm>({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      isActive: true,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setEditValue,
    formState: { errors: errorsEdit },
  } = useForm<CreateRoleForm>();

  const {
    register: registerCreatePermission,
    handleSubmit: handleSubmitCreatePermission,
    reset: resetCreatePermission,
    watch: watchCreatePermission,
    setValue: setCreatePermissionValue,
    formState: { errors: errorsCreatePermission },
  } = useForm<CreatePermissionForm>({
    defaultValues: {
      name: '',
      code: '',
      resource: '',
      action: 'read',
      description: '',
      isActive: true,
    },
  });

  const {
    register: registerEditPermission,
    handleSubmit: handleSubmitEditPermission,
    reset: resetEditPermission,
    watch: watchEditPermission,
    setValue: setEditPermissionValue,
    formState: { errors: errorsEditPermission },
  } = useForm<CreatePermissionForm>();

  // États pour l'autocomplete du code de rôle
  const [showCreateCodeSuggestions, setShowCreateCodeSuggestions] = useState(false);
  const [showEditCodeSuggestions, setShowEditCodeSuggestions] = useState(false);

  const createCodeValue = (watchCreate('code') || '').toString();
  const editCodeValue = (watchEdit('code') || '').toString();

  const filteredRoleCodeSuggestionsCreate = useMemo(
    () =>
      ROLE_CODE_SUGGESTIONS.filter((code) =>
        code.toLowerCase().includes(createCodeValue.toLowerCase()),
      ),
    [createCodeValue],
  );

  const filteredRoleCodeSuggestionsEdit = useMemo(
    () =>
      ROLE_CODE_SUGGESTIONS.filter((code) =>
        code.toLowerCase().includes(editCodeValue.toLowerCase()),
      ),
    [editCodeValue],
  );

  // Filtrer et trier les rôles
  const filteredAndSortedRoles = useMemo(() => {
    let data = [...roles];

    // Filtre par recherche
    if (roleSearch) {
      const searchLower = roleSearch.toLowerCase();
      data = data.filter(
        (role) =>
          role.name.toLowerCase().includes(searchLower) ||
          role.code.toLowerCase().includes(searchLower) ||
          role.description?.toLowerCase().includes(searchLower),
      );
    }

    // Filtre par statut
    if (roleStatusFilter === 'active') {
      data = data.filter((role) => role.isActive);
    } else if (roleStatusFilter === 'inactive') {
      data = data.filter((role) => !role.isActive);
    }

    // Tri
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    const getValue = (role: Role) => {
      switch (sortKey) {
        case 'name':
          return role.name.toLowerCase();
        case 'code':
          return role.code.toLowerCase();
        case 'users':
          return role._count?.users ?? 0;
        case 'permissions':
          return role.permissions.length;
        case 'isActive':
          return role.isActive ? 1 : 0;
        default:
          return role.name.toLowerCase();
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
  }, [roles, sortKey, sortDirection, roleSearch, roleStatusFilter]);

  // Pagination des rôles
  const paginatedRoles = useMemo(() => {
    const start = (rolePage - 1) * rolesPerPage;
    const end = start + rolesPerPage;
    return filteredAndSortedRoles.slice(start, end);
  }, [filteredAndSortedRoles, rolePage, rolesPerPage]);

  const totalRolePages = Math.ceil(filteredAndSortedRoles.length / rolesPerPage);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : '');
    setSortDirection(direction);
  };

  const handleOpenCreateModal = () => {
    resetCreate();
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    resetEdit({
      name: role.name,
      code: role.code,
      description: role.description || '',
      isActive: role.isActive,
    });
    setEditModalOpen(true);
  };

  const handleOpenPermissionsModal = (role: Role) => {
    setEditingRole(role);
    setPermissionsModalOpen(true);
  };

  const handleOpenDeleteModal = async (role: Role) => {
    setRoleToDelete(role);
    // Load users before showing delete modal
    try {
      setLoadingUsers(true);
      const response = await apiClient.get(`/roles/${role.id}/users`);
      setRoleUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setRoleUsers([]);
    } finally {
      setLoadingUsers(false);
    }
    setDeleteModalOpen(true);
  };

  const handleOpenUsersModal = async (role: Role) => {
    setEditingRole(role);
    try {
      setLoadingUsers(true);
      const response = await apiClient.get(`/roles/${role.id}/users`);
      setRoleUsers(response.data || []);
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Error loading users:', error);
      setRoleUsers([]);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
    setUsersModalOpen(true);
  };

  const handleCreateRole = async (data: CreateRoleForm) => {
    try {
      await sendAction('/roles', 'POST', data);
      toast.success('Rôle créé avec succès');
      setCreateModalOpen(false);
      resetCreate();
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du rôle');
    }
  };

  const handleUpdateRole = async (data: CreateRoleForm) => {
    if (!editingRole) return;
    try {
      await sendAction(`/roles/${editingRole.id}`, 'PUT', data);
      toast.success('Rôle mis à jour avec succès');
      setEditModalOpen(false);
      setEditingRole(null);
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du rôle');
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    // If role has users, remove them first
    if (roleUsers.length > 0) {
      try {
        const userIds = roleUsers.map((u) => u.id);
        await sendAction('/roles/users/remove-role', 'POST', { userIds });
        toast.success(`${roleUsers.length} utilisateur(s) retiré(s) du rôle`);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors du retrait des utilisateurs');
        return;
      }
    }
    // Now delete the role
    try {
      await sendAction(`/roles/${roleToDelete.id}`, 'DELETE');
      toast.success('Rôle supprimé avec succès');
      setDeleteModalOpen(false);
      setRoleToDelete(null);
      setRoleUsers([]);
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du rôle');
    }
  };

  const handleRemoveUsersFromRole = async (userIds: string[]) => {
    if (!editingRole || userIds.length === 0) return;
    try {
      await sendAction('/roles/users/remove-role', 'POST', { userIds });
      toast.success(`${userIds.length} utilisateur(s) retiré(s) du rôle`);
      // Refresh users list
      const response = await apiClient.get(`/roles/${editingRole.id}/users`);
      setRoleUsers(response.data || []);
      setSelectedUserIds([]);
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait des utilisateurs');
    }
  };

  const handleRemoveAllUsersFromRole = async () => {
    if (!editingRole || roleUsers.length === 0) return;
    await handleRemoveUsersFromRole(roleUsers.map((u) => u.id));
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === roleUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(roleUsers.map((u) => u.id));
    }
  };

  const handleUpdatePermissions = async (permissionIds: string[]) => {
    if (!editingRole) return;
    try {
      await sendAction(`/roles/${editingRole.id}/permissions`, 'PUT', { permissionIds });
      toast.success('Permissions mises à jour avec succès');
      setPermissionsModalOpen(false);
      setEditingRole(null);
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour des permissions');
    }
  };

  const handleOpenCreatePermissionModal = () => {
    resetCreatePermission();
    setCreatePermissionModalOpen(true);
  };

  const handleOpenEditPermissionModal = (permission: Permission) => {
    setEditingPermission(permission);
    resetEditPermission({
      name: permission.name,
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || '',
      isActive: permission.isActive ?? true,
    });
    setEditPermissionModalOpen(true);
  };

  const handleOpenDeletePermissionModal = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeletePermissionModalOpen(true);
  };

  const handleCreatePermission = async (data: CreatePermissionForm) => {
    try {
      await sendAction('/roles/permissions', 'POST', data);
      toast.success('Permission créée avec succès');
      setCreatePermissionModalOpen(false);
      resetCreatePermission();
      refreshRoles();
      refreshPermissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la permission');
    }
  };

  const handleUpdatePermission = async (data: CreatePermissionForm) => {
    if (!editingPermission) return;
    try {
      await sendAction(`/roles/permissions/${editingPermission.id}`, 'PUT', data);
      toast.success('Permission mise à jour avec succès');
      setEditPermissionModalOpen(false);
      setEditingPermission(null);
      refreshRoles();
      refreshPermissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la permission');
    }
  };

  const handleDeletePermission = async () => {
    if (!permissionToDelete) return;
    try {
      await sendAction(`/roles/permissions/${permissionToDelete.id}`, 'DELETE');
      toast.success('Permission supprimée avec succès');
      setDeletePermissionModalOpen(false);
      setPermissionToDelete(null);
      refreshRoles();
      refreshPermissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la permission');
    }
  };

  const handleToggleRoleStatus = async (role: Role) => {
    try {
      await sendAction(`/roles/${role.id}/toggle-status`, 'PATCH');
      toast.success(`Rôle ${role.isActive ? 'désactivé' : 'activé'} avec succès`);
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut du rôle');
    }
  };

  const handleTogglePermissionStatus = async (permission: Permission) => {
    try {
      await sendAction(`/roles/permissions/${permission.id}/toggle-status`, 'PATCH');
      toast.success(`Permission ${permission.isActive ? 'désactivée' : 'activée'} avec succès`);
      refreshPermissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut de la permission');
    }
  };

  const columns: Column<Role>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Rôle',
      sortable: true,
      render: (role) => (
        <div>
          <p className="font-semibold text-gray-900">{role.name}</p>
          <p className="text-xs text-gray-500">{role.code}</p>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (role) => (
        <span className="text-sm text-gray-600">{role.description || '—'}</span>
      ),
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      sortable: true,
      render: (role) => (
        <span className="text-sm font-medium text-gray-700">
          {role._count?.users ?? 0}
        </span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      sortable: true,
      render: (role) => (
        <span className="text-sm font-medium text-gray-700">
          {role.permissions.length}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      sortable: true,
      render: (role) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleRoleStatus(role)}
            disabled={actionLoading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              role.isActive ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            title={role.isActive ? 'Désactiver le rôle' : 'Activer le rôle'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                role.isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-xs font-medium ${
              role.isActive ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {role.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (role) => (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenPermissionsModal(role)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            title="Gérer les permissions"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Permissions
          </button>
          <button
            onClick={() => handleOpenUsersModal(role)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            title="Gérer les utilisateurs assignés"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            Utilisateurs ({role._count?.users ?? 0})
          </button>
          {canManage && (
            <>
              <button
                onClick={() => handleOpenEditModal(role)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title="Modifier le rôle"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Modifier
              </button>
              <button
                onClick={() => handleOpenDeleteModal(role)}
                disabled={(role._count?.users ?? 0) > 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={
                  role._count?.users && role._count.users > 0
                    ? 'Impossible de supprimer : des utilisateurs sont assignés'
                    : 'Supprimer le rôle'
                }
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Supprimer
              </button>
            </>
          )}
        </div>
      ),
    },
  ], []);

  if (!canManage) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">Vous n'avez pas la permission d'accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const permissionColumns: Column<Permission>[] = useMemo(() => [
    {
      key: 'isActive',
      label: 'Statut',
      sortable: true,
      render: (permission) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTogglePermissionStatus(permission)}
            disabled={actionLoading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              permission.isActive ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            title={permission.isActive ? 'Désactiver la permission' : 'Activer la permission'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                permission.isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-xs font-medium ${
              permission.isActive ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {permission.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Permission',
      sortable: true,
      render: (permission) => (
        <div>
          <p className="font-semibold text-gray-900">{permission.name}</p>
          <p className="text-xs text-gray-500">{permission.code}</p>
        </div>
      ),
    },
    {
      key: 'resource',
      label: 'Ressource',
      sortable: true,
      render: (permission) => (
        <span className="text-sm text-gray-600 capitalize">{permission.resource}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (permission) => (
        <span className="text-sm text-gray-600 capitalize">{permission.action}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (permission) => (
        <span className="text-sm text-gray-600">{permission.description || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (permission) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditPermissionModal(permission)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            title="Modifier la permission"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Modifier
          </button>
          <button
            onClick={() => handleOpenDeletePermissionModal(permission)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            title="Supprimer la permission"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Supprimer
          </button>
        </div>
      ),
    },
  ], []);

  // Filtrer les permissions
  const filteredPermissions = useMemo(() => {
    let data = [...permissions];

    // Filtre par recherche
    if (permissionSearch) {
      const searchLower = permissionSearch.toLowerCase();
      data = data.filter(
        (perm) =>
          perm.name.toLowerCase().includes(searchLower) ||
          perm.code.toLowerCase().includes(searchLower) ||
          perm.resource.toLowerCase().includes(searchLower) ||
          perm.action.toLowerCase().includes(searchLower) ||
          perm.description?.toLowerCase().includes(searchLower),
      );
    }

    // Filtre par ressource
    if (permissionResourceFilter !== 'all') {
      data = data.filter((perm) => perm.resource === permissionResourceFilter);
    }

    // Filtre par action
    if (permissionActionFilter !== 'all') {
      data = data.filter((perm) => perm.action === permissionActionFilter);
    }

    // Tri par défaut
    data.sort((a, b) => {
      if (a.resource < b.resource) return -1;
      if (a.resource > b.resource) return 1;
      if (a.action < b.action) return -1;
      if (a.action > b.action) return 1;
      return 0;
    });

    return data;
  }, [permissions, permissionSearch, permissionResourceFilter, permissionActionFilter]);

  // Pagination des permissions
  const paginatedPermissions = useMemo(() => {
    const start = (permissionPage - 1) * permissionsPerPage;
    const end = start + permissionsPerPage;
    return filteredPermissions.slice(start, end);
  }, [filteredPermissions, permissionPage, permissionsPerPage]);

  const totalPermissionPages = Math.ceil(filteredPermissions.length / permissionsPerPage);

  // Ressources uniques pour le filtre
  const uniqueResources = useMemo(() => {
    const resources = new Set(permissions.map((p) => p.resource));
    return Array.from(resources).sort();
  }, [permissions]);

  // Actions uniques pour le filtre
  const uniqueActions = useMemo(() => {
    const actions = new Set(permissions.map((p) => p.action));
    return Array.from(actions).sort();
  }, [permissions]);

  // Options pour les filtres
  const roleStatusOptions = useMemo(
    () => [
      { value: 'all', label: 'Tous les statuts' },
      { value: 'active', label: 'Actifs uniquement' },
      { value: 'inactive', label: 'Inactifs uniquement' },
    ],
    [],
  );

  const permissionResourceOptions = useMemo(
    () => [
      { value: 'all', label: 'Toutes les ressources' },
      ...uniqueResources.map((resource) => ({ value: resource, label: resource })),
    ],
    [uniqueResources],
  );

  const permissionActionOptions = useMemo(
    () => [
      { value: 'all', label: 'Toutes les actions' },
      ...uniqueActions.map((action) => ({ value: action, label: action })),
    ],
    [uniqueActions],
  );

  return (
    <>
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rôles & Permissions</h1>
            <p className="text-gray-600 mt-2">
              Gérez les rôles et leurs permissions dans le système
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'roles' ? (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                title="Créer un nouveau rôle"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nouveau rôle
              </button>
            ) : (
              <button
                onClick={handleOpenCreatePermissionModal}
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                title="Créer une nouvelle permission"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle permission
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('roles');
                setRolePage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rôles ({filteredAndSortedRoles.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('permissions');
                setPermissionPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions ({filteredPermissions.length})
            </button>
          </nav>
        </div>

        {/* Filtres */}
        {activeTab === 'roles' ? (
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un rôle..."
                  value={roleSearch}
                  onChange={(e) => {
                    setRoleSearch(e.target.value);
                    setRolePage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {roleSearch && (
                  <button
                    onClick={() => {
                      setRoleSearch('');
                      setRolePage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Filtre par statut */}
              <div className="w-full sm:w-auto min-w-[200px]">
                <Autocomplete
                  options={roleStatusOptions}
                  value={roleStatusFilter}
                  onChange={(value) => {
                    setRoleStatusFilter(value as any);
                    setRolePage(1);
                  }}
                  placeholder="Tous les statuts"
                  allowClear={false}
                />
              </div>

              {/* Bouton réinitialiser */}
              {(roleSearch || roleStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setRoleSearch('');
                    setRoleStatusFilter('all');
                    setRolePage(1);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            {(roleSearch || roleStatusFilter !== 'all') && (
              <div className="text-sm text-gray-600">
                {filteredAndSortedRoles.length} rôle(s) trouvé(s)
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une permission..."
                  value={permissionSearch}
                  onChange={(e) => {
                    setPermissionSearch(e.target.value);
                    setPermissionPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {permissionSearch && (
                  <button
                    onClick={() => {
                      setPermissionSearch('');
                      setPermissionPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Filtre par ressource */}
              <div className="w-full sm:w-auto min-w-[200px]">
                <Autocomplete
                  options={permissionResourceOptions}
                  value={permissionResourceFilter}
                  onChange={(value) => {
                    setPermissionResourceFilter(value);
                    setPermissionPage(1);
                  }}
                  placeholder="Toutes les ressources"
                  allowClear={false}
                />
              </div>

              {/* Filtre par action */}
              <div className="w-full sm:w-auto min-w-[200px]">
                <Autocomplete
                  options={permissionActionOptions}
                  value={permissionActionFilter}
                  onChange={(value) => {
                    setPermissionActionFilter(value);
                    setPermissionPage(1);
                  }}
                  placeholder="Toutes les actions"
                  allowClear={false}
                />
              </div>

              {/* Bouton réinitialiser */}
              {(permissionSearch || permissionResourceFilter !== 'all' || permissionActionFilter !== 'all') && (
                <button
                  onClick={() => {
                    setPermissionSearch('');
                    setPermissionResourceFilter('all');
                    setPermissionActionFilter('all');
                    setPermissionPage(1);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            {(permissionSearch || permissionResourceFilter !== 'all' || permissionActionFilter !== 'all') && (
              <div className="text-sm text-gray-600">
                {filteredPermissions.length} permission(s) trouvée(s)
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'roles' ? (
          <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <Table
                data={paginatedRoles}
                columns={columns}
                loading={rolesLoading}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                emptyMessage={
                  roleSearch || roleStatusFilter !== 'all'
                    ? 'Aucun rôle ne correspond aux filtres'
                    : 'Aucun rôle trouvé'
                }
              />
            </div>
            {totalRolePages > 1 && (
              <Pagination
                currentPage={rolePage}
                totalPages={totalRolePages}
                onPageChange={setRolePage}
                hasNext={rolePage < totalRolePages}
                hasPrev={rolePage > 1}
              />
            )}
          </>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <Table
                data={paginatedPermissions}
                columns={permissionColumns}
                loading={false}
                emptyMessage={
                  permissionSearch || permissionResourceFilter !== 'all' || permissionActionFilter !== 'all'
                    ? 'Aucune permission ne correspond aux filtres'
                    : 'Aucune permission trouvée'
                }
              />
            </div>
            {totalPermissionPages > 1 && (
              <Pagination
                currentPage={permissionPage}
                totalPages={totalPermissionPages}
                onPageChange={setPermissionPage}
                hasNext={permissionPage < totalPermissionPages}
                hasPrev={permissionPage > 1}
              />
            )}
          </>
        )}
      </div>

      {/* Create Role Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Créer un nouveau rôle"
        >
          <form onSubmit={handleSubmitCreate(handleCreateRole)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom du rôle *
              </label>
              <input
                {...registerCreate('name', { required: 'Le nom est requis' })}
                type="text"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errorsCreate.name && (
                <p className="mt-1 text-xs text-red-600">{errorsCreate.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code du rôle *
              </label>
              <div className="relative">
                <input
                  {...registerCreate('code', {
                    required: 'Le code est requis',
                    pattern: {
                      value: /^[A-Z_]+$/,
                      message: 'Le code doit être en majuscules avec des underscores',
                    },
                  })}
                  type="text"
                  placeholder="EXEMPLE_ROLE"
                  onFocus={() => setShowCreateCodeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCreateCodeSuggestions(false), 200)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {showCreateCodeSuggestions && filteredRoleCodeSuggestionsCreate.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-auto">
                    {filteredRoleCodeSuggestionsCreate.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setCreateValue('code', code);
                          setShowCreateCodeSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errorsCreate.code && (
                <p className="mt-1 text-xs text-red-600">{errorsCreate.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...registerCreate('description')}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center">
              <input
                {...registerCreate('isActive')}
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Rôle actif
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                title="Annuler la création"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                title="Créer le nouveau rôle"
              >
                {actionLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Role Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingRole(null);
          }}
          title="Modifier le rôle"
        >
          <form onSubmit={handleSubmitEdit(handleUpdateRole)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom du rôle *
              </label>
              <input
                {...registerEdit('name', { required: 'Le nom est requis' })}
                type="text"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errorsEdit.name && (
                <p className="mt-1 text-xs text-red-600">{errorsEdit.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code du rôle *
              </label>
              <div className="relative">
                <input
                  {...registerEdit('code', {
                    required: 'Le code est requis',
                    pattern: {
                      value: /^[A-Z_]+$/,
                      message: 'Le code doit être en majuscules avec des underscores',
                    },
                  })}
                  type="text"
                  onFocus={() => setShowEditCodeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEditCodeSuggestions(false), 200)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {showEditCodeSuggestions && filteredRoleCodeSuggestionsEdit.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-auto">
                    {filteredRoleCodeSuggestionsEdit.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setEditValue('code', code);
                          setShowEditCodeSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errorsEdit.code && (
                <p className="mt-1 text-xs text-red-600">{errorsEdit.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...registerEdit('description')}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center">
              <input
                {...registerEdit('isActive')}
                type="checkbox"
                id="editIsActive"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                Rôle actif
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingRole(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                title="Annuler les modifications"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                title="Enregistrer les modifications du rôle"
              >
                {actionLoading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Permissions Modal */}
        {editingRole && (
          <PermissionsModal
            isOpen={isPermissionsModalOpen}
            onClose={() => {
              setPermissionsModalOpen(false);
              setEditingRole(null);
            }}
            role={editingRole}
            allPermissions={permissions}
            onUpdate={handleUpdatePermissions}
            loading={actionLoading}
          />
        )}

        {/* Users Management Modal */}
        <Modal
          isOpen={isUsersModalOpen}
          onClose={() => {
            setUsersModalOpen(false);
            setEditingRole(null);
            setRoleUsers([]);
            setSelectedUserIds([]);
          }}
          title={`Utilisateurs assignés au rôle : ${editingRole?.name}`}
        >
          <div className="space-y-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Chargement des utilisateurs...</div>
              </div>
            ) : roleUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Aucun utilisateur assigné à ce rôle</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedUserIds.length > 0
                      ? `${selectedUserIds.length} utilisateur(s) sélectionné(s)`
                      : `${roleUsers.length} utilisateur(s) au total`}
                  </div>
                  <div className="flex gap-2">
                    {selectedUserIds.length > 0 && (
                      <button
                        onClick={() => handleRemoveUsersFromRole(selectedUserIds)}
                        disabled={actionLoading}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retirer sélection ({selectedUserIds.length})
                      </button>
                    )}
                    <button
                      onClick={handleRemoveAllUsersFromRole}
                      disabled={actionLoading || roleUsers.length === 0}
                      className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Retirer tous
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === roleUsers.length && roleUsers.length > 0}
                            onChange={handleSelectAllUsers}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roleUsers.map((user: any) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={() => handleToggleUserSelection(user.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveUsersFromRole([user.id])}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                              title="Retirer ce rôle"
                            >
                              Retirer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">
                    ℹ️ Les utilisateurs retirés de ce rôle seront automatiquement réassignés au rôle EMPLOYEE.
                  </p>
                </div>
              </>
            )}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setUsersModalOpen(false);
                  setEditingRole(null);
                  setRoleUsers([]);
                  setSelectedUserIds([]);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setRoleToDelete(null);
          }}
          title="Supprimer le rôle"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer le rôle{' '}
              <span className="font-semibold">{roleToDelete?.name}</span> ?
            </p>
            {roleToDelete?._count?.users && roleToDelete._count.users > 0 && (
              <div className="rounded-lg bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Ce rôle est assigné à {roleToDelete._count.users} utilisateur(s).
                  Vous devez d'abord réassigner ces utilisateurs avant de pouvoir supprimer ce rôle.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setRoleToDelete(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                title="Annuler la suppression"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={actionLoading || loadingUsers}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Supprimer définitivement ce rôle"
              >
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Create Permission Modal */}
        <Modal
          isOpen={isCreatePermissionModalOpen}
          onClose={() => setCreatePermissionModalOpen(false)}
          title="Créer une nouvelle permission"
        >
          <form onSubmit={handleSubmitCreatePermission(handleCreatePermission)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la permission *
              </label>
              <input
                {...registerCreatePermission('name', { required: 'Le nom est requis' })}
                type="text"
                placeholder="Ex: Créer des produits"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errorsCreatePermission.name && (
                <p className="mt-1 text-xs text-red-600">{errorsCreatePermission.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code de la permission *
              </label>
              <input
                {...registerCreatePermission('code', {
                  required: 'Le code est requis',
                  pattern: {
                    value: /^[a-z]+\.[a-z]+$/,
                    message: 'Format: resource.action (ex: products.create)',
                  },
                })}
                type="text"
                placeholder="products.create"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errorsCreatePermission.code && (
                <p className="mt-1 text-xs text-red-600">{errorsCreatePermission.code.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format: resource.action (ex: products.create, users.read)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ressource *
                </label>
                <input
                  {...registerCreatePermission('resource', { required: 'La ressource est requise' })}
                  type="text"
                  placeholder="products"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errorsCreatePermission.resource && (
                  <p className="mt-1 text-xs text-red-600">{errorsCreatePermission.resource.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Action *
                </label>
                <select
                  {...registerCreatePermission('action', { required: 'L\'action est requise' })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="create">Créer</option>
                  <option value="read">Lire</option>
                  <option value="update">Modifier</option>
                  <option value="delete">Supprimer</option>
                  <option value="manage">Gérer</option>
                  <option value="export">Exporter</option>
                  <option value="transfer">Transférer</option>
                  <option value="adjust">Ajuster</option>
                  <option value="receive">Recevoir</option>
                  <option value="deliver">Livrer</option>
                  <option value="cancel">Annuler</option>
                </select>
                {errorsCreatePermission.action && (
                  <p className="mt-1 text-xs text-red-600">{errorsCreatePermission.action.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...registerCreatePermission('description')}
                rows={3}
                placeholder="Description de la permission..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCreatePermissionModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {actionLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Permission Modal */}
        <Modal
          isOpen={isEditPermissionModalOpen}
          onClose={() => {
            setEditPermissionModalOpen(false);
            setEditingPermission(null);
          }}
          title="Modifier la permission"
        >
          <form onSubmit={handleSubmitEditPermission(handleUpdatePermission)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la permission *
              </label>
              <input
                {...registerEditPermission('name', { required: 'Le nom est requis' })}
                type="text"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errorsEditPermission.name && (
                <p className="mt-1 text-xs text-red-600">{errorsEditPermission.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code de la permission *
              </label>
              <input
                {...registerEditPermission('code', {
                  required: 'Le code est requis',
                  pattern: {
                    value: /^[a-z]+\.[a-z]+$/,
                    message: 'Format: resource.action (ex: products.create)',
                  },
                })}
                type="text"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errorsEditPermission.code && (
                <p className="mt-1 text-xs text-red-600">{errorsEditPermission.code.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ressource *
                </label>
                <input
                  {...registerEditPermission('resource', { required: 'La ressource est requise' })}
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errorsEditPermission.resource && (
                  <p className="mt-1 text-xs text-red-600">{errorsEditPermission.resource.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Action *
                </label>
                <select
                  {...registerEditPermission('action', { required: 'L\'action est requise' })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="create">Créer</option>
                  <option value="read">Lire</option>
                  <option value="update">Modifier</option>
                  <option value="delete">Supprimer</option>
                  <option value="manage">Gérer</option>
                  <option value="export">Exporter</option>
                  <option value="transfer">Transférer</option>
                  <option value="adjust">Ajuster</option>
                  <option value="receive">Recevoir</option>
                  <option value="deliver">Livrer</option>
                  <option value="cancel">Annuler</option>
                </select>
                {errorsEditPermission.action && (
                  <p className="mt-1 text-xs text-red-600">{errorsEditPermission.action.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...registerEditPermission('description')}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditPermissionModalOpen(false);
                  setEditingPermission(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {actionLoading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Permission Modal */}
        <Modal
          isOpen={isDeletePermissionModalOpen}
          onClose={() => {
            setDeletePermissionModalOpen(false);
            setPermissionToDelete(null);
          }}
          title="Supprimer la permission"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer la permission{' '}
              <span className="font-semibold">{permissionToDelete?.name}</span> ?
            </p>
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Si cette permission est assignée à des rôles, elle sera retirée de ces rôles.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setDeletePermissionModalOpen(false);
                  setPermissionToDelete(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeletePermission}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

// Permissions Management Modal Component
interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  allPermissions: Permission[];
  onUpdate: (permissionIds: string[]) => void;
  loading: boolean;
}

function PermissionsModal({
  isOpen,
  onClose,
  role,
  allPermissions,
  onUpdate,
  loading,
}: PermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && role) {
      const rolePermissionIds = new Set(role.permissions.map((rp) => rp.permission.id));
      setSelectedPermissions(rolePermissionIds);
    }
  }, [isOpen, role]);

  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return allPermissions;
    const term = searchTerm.toLowerCase();
    return allPermissions.filter(
      (perm) =>
        perm.name.toLowerCase().includes(term) ||
        perm.code.toLowerCase().includes(term) ||
        perm.resource.toLowerCase().includes(term) ||
        perm.action.toLowerCase().includes(term),
    );
  }, [allPermissions, searchTerm]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    filteredPermissions.forEach((perm) => {
      if (!groups[perm.resource]) {
        groups[perm.resource] = [];
      }
      groups[perm.resource].push(perm);
    });
    return groups;
  }, [filteredPermissions]);

  const handleTogglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPermissions.size === filteredPermissions.length) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(filteredPermissions.map((p) => p.id)));
    }
  };

  const handleSave = () => {
    onUpdate(Array.from(selectedPermissions));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions - ${role.name}`}>
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Rechercher une permission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <span className="text-sm font-medium text-gray-700">
            {selectedPermissions.size} permission(s) sélectionnée(s)
          </span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary-600 hover:text-primary-700"
            title={
              selectedPermissions.size === filteredPermissions.length
                ? 'Désélectionner toutes les permissions'
                : 'Sélectionner toutes les permissions'
            }
          >
            {selectedPermissions.size === filteredPermissions.length
              ? 'Tout désélectionner'
              : 'Tout sélectionner'}
          </button>
        </div>

        <div className="max-h-96 space-y-4 overflow-y-auto">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 capitalize">{resource}</h4>
              <div className="space-y-1 pl-4">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-2 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                      <div className="text-xs text-gray-500">{perm.code}</div>
                      {perm.description && (
                        <div className="text-xs text-gray-400">{perm.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            title="Annuler les modifications des permissions"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            title="Enregistrer les permissions sélectionnées"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

