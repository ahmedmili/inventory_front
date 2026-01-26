'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Autocomplete from '../ui/Autocomplete';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Project {
  id: string;
  name: string;
}

interface ReservationItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
}

interface ReservationGroup {
  groupId: string;
  project?: {
    id: string;
    name: string;
  } | null;
  expiresAt?: string | null;
  notes?: string | null;
  items: ReservationItem[];
}

interface UpdateGroupReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ReservationGroup | null;
  onSuccess?: () => void;
}

export default function UpdateGroupReservationModal({
  isOpen,
  onClose,
  group,
  onSuccess,
}: UpdateGroupReservationModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    expiresAt: '',
    notes: '',
    items: [] as Array<{ reservationId: string; quantity: number }>,
  });

  // Load group data when modal opens
  useEffect(() => {
    if (isOpen && group) {
      console.log('Loading group data:', group);
      
      // Format the expiration date correctly for datetime-local input
      let formattedExpiresAt = '';
      if (group.expiresAt) {
        try {
          const date = new Date(group.expiresAt);
          // Check if date is valid
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            formattedExpiresAt = `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        } catch (error) {
          console.error('Error formatting expiration date:', error);
        }
      }

      const initialFormData = {
        projectId: group.project?.id || '',
        expiresAt: formattedExpiresAt,
        notes: group.notes || '',
        items: group.items?.map(item => ({
          reservationId: item.id,
          quantity: item.quantity,
        })) || [],
      };

      console.log('Setting form data:', initialFormData);
      console.log('Group data:', {
        project: group.project,
        expiresAt: group.expiresAt,
        notes: group.notes,
        itemsCount: group.items?.length,
      });
      setFormData(initialFormData);
      
      // Load options after setting form data to ensure projects are available
      loadOptions();
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        projectId: '',
        expiresAt: '',
        notes: '',
        items: [],
      });
    }
  }, [isOpen, group]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const projectsRes = await apiClient.get('/projects?status=ACTIVE');
      const projectsData = projectsRes.data?.data || projectsRes.data || [];
      setProjects(projectsData);
      console.log('Projects loaded:', projectsData.length);
      
      // If we have a projectId but projects just loaded, ensure the form data is set correctly
      if (group && group.project?.id && projectsData.length > 0) {
        const projectExists = projectsData.some(p => p.id === group.project?.id);
        if (!projectExists) {
          // Project might not be active, try to load it anyway
          try {
            const projectRes = await apiClient.get(`/projects/${group.project.id}`);
            if (projectRes.data) {
              setProjects([...projectsData, projectRes.data]);
            }
          } catch (error) {
            console.warn('Could not load project:', error);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleQuantityChange = (reservationId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.reservationId === reservationId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!group) {
      return;
    }

    try {
      setLoading(true);

      const payload: any = {};

      // Vérifier les changements communs
      if (formData.projectId !== (group.project?.id || '')) {
        payload.projectId = formData.projectId || null;
      }

      if (formData.expiresAt !== (group.expiresAt ? new Date(group.expiresAt).toISOString().slice(0, 16) : '')) {
        payload.expiresAt = formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null;
      }

      if (formData.notes !== (group.notes || '')) {
        payload.notes = formData.notes || null;
      }

      // Vérifier les changements de quantités
      const quantityChanges = formData.items
        .filter(item => {
          const originalItem = group.items.find(i => i.id === item.reservationId);
          return originalItem && originalItem.quantity !== item.quantity;
        })
        .map(item => ({
          reservationId: item.reservationId,
          quantity: item.quantity,
        }));

      if (quantityChanges.length > 0) {
        payload.items = quantityChanges;
      }

      // Only send request if there are changes
      if (Object.keys(payload).length === 0) {
        toast.info('Aucune modification détectée');
        onClose();
        return;
      }

      await apiClient.post(`/reservations/group/${group.groupId}/update`, payload);

      toast.success('Groupe de réservations mis à jour avec succès');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to update reservation group:', error);
      const errorMessage =
        error.response?.data?.message || 'Erreur lors de la mise à jour du groupe de réservations';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!group) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier le groupe de réservations"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Projet
          </label>
          <Autocomplete
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={formData.projectId}
            onChange={(value) => setFormData({ ...formData, projectId: value || '' })}
            placeholder="Sélectionner un projet (optionnel)"
            loading={loadingOptions}
          />
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'expiration
          </label>
          <input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            maxLength={250}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes sur le groupe de réservations (optionnel)"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.notes.length}/250 caractères
          </p>
        </div>

        {/* Products Quantities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quantités des produits
          </label>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {group.items.map((item) => {
              const formItem = formData.items.find(i => i.reservationId === item.id);
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product.name}
                      {item.product.sku && (
                        <span className="text-xs text-gray-500 ml-2">({item.product.sku})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Quantité actuelle: {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={formItem?.quantity || item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le groupe'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
