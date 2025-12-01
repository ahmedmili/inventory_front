'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal';
import Table, { Column, SortDirection } from '@/components/Table';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  id: string;
  name: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
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
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: rolesData, loading: rolesLoading, mutate: refreshRoles } = useApi<Role[]>('/roles');
  const { data: allPermissions } = useApi<Permission[]>('/roles/permissions/all');
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

  const sortedRoles = useMemo(() => {
    const data = [...roles];
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
  }, [roles, sortKey, sortDirection]);

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

  const handleOpenDeleteModal = (role: Role) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
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
    try {
      await sendAction(`/roles/${roleToDelete.id}`, 'DELETE');
      toast.success('Rôle supprimé avec succès');
      setDeleteModalOpen(false);
      setRoleToDelete(null);
      refreshRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du rôle');
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

  const columns: Column<Role>[] = [
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
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            role.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {role.isActive ? 'Actif' : 'Inactif'}
        </span>
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
  ];

  if (!canManage) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">Vous n'avez pas la permission d'accéder à cette page.</p>
        </div>
      </div>
    );
  }

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
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table
            data={sortedRoles}
            columns={columns}
            loading={rolesLoading}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyMessage="Aucun rôle trouvé"
          />
        </div>
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
                disabled={
                  actionLoading ||
                  (roleToDelete?._count?.users ?? 0) > 0
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  (roleToDelete?._count?.users ?? 0) > 0
                    ? 'Impossible de supprimer : des utilisateurs sont assignés'
                    : 'Supprimer définitivement ce rôle'
                }
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

