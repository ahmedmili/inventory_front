'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Autocomplete from '../ui/Autocomplete';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingMemberIds?: string[];
  onSuccess: () => void;
}

export default function AddProjectMemberModal({
  isOpen,
  onClose,
  projectId,
  existingMemberIds = [],
  onSuccess,
}: AddProjectMemberModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    role: 'MEMBER',
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset form when modal opens
      setFormData({
        userId: '',
        role: 'MEMBER',
      });
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiClient.get('/users?limit=1000');
      const usersData = response.data?.data || response.data || [];
      // Filter out users who are already members
      const availableUsers = usersData.filter(
        (user: User) => !existingMemberIds.includes(user.id)
      );
      setUsers(availableUsers);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/projects/${projectId}/members`, {
        userId: formData.userId,
        role: formData.role || undefined,
      });
      
      toast.success('Membre ajouté au projet avec succès');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to add member to project:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du membre au projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un membre" size="md" variant="form">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Selection */}
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
            Utilisateur <span className="text-red-500">*</span>
          </label>
          <Autocomplete
            options={users.map((user) => ({
              value: user.id,
              label: `${user.firstName} ${user.lastName} (${user.email})`,
            }))}
            value={formData.userId}
            onChange={(value) => setFormData({ ...formData, userId: value })}
            placeholder="Rechercher un utilisateur..."
            className="w-full"
            disabled={loadingUsers}
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Rôle (optionnel)
          </label>
          <input
            type="text"
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Ex: MEMBER, LEAD, MANAGER..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Laissez vide ou entrez un rôle personnalisé (par défaut: MEMBER)
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || loadingUsers || !formData.userId}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

