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

interface Reservation {
  id: string;
  quantity: number;
  status: string;
  expiresAt?: string | null;
  notes?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  warehouse?: {
    id: string;
    name: string;
  }; // Optional for backward compatibility
}

interface UpdateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onSuccess?: () => void;
}

export default function UpdateReservationModal({
  isOpen,
  onClose,
  reservation,
  onSuccess,
}: UpdateReservationModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    projectId: '',
    expiresAt: '',
    notes: '',
  });

  // Load reservation data when modal opens
  useEffect(() => {
    if (isOpen && reservation) {
      setFormData({
        quantity: reservation.quantity,
        projectId: reservation.project?.id || '',
        expiresAt: reservation.expiresAt
          ? new Date(reservation.expiresAt).toISOString().slice(0, 16)
          : '',
        notes: reservation.notes || '',
      });
      loadOptions();
    }
  }, [isOpen, reservation]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const projectsRes = await apiClient.get('/projects?status=ACTIVE');
      setProjects(projectsRes.data?.data || projectsRes.data || []);
    } catch (error: any) {
      console.error('Failed to load options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservation) {
      return;
    }

    try {
      setLoading(true);

      const payload: any = {};

      if (formData.quantity !== reservation.quantity) {
        payload.quantity = formData.quantity;
      }

      if (formData.projectId !== (reservation.project?.id || '')) {
        payload.projectId = formData.projectId || null;
      }

      if (formData.expiresAt !== (reservation.expiresAt ? new Date(reservation.expiresAt).toISOString().slice(0, 16) : '')) {
        payload.expiresAt = formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null;
      }

      if (formData.notes !== (reservation.notes || '')) {
        payload.notes = formData.notes || null;
      }

      // Only send request if there are changes
      if (Object.keys(payload).length === 0) {
        toast.info('Aucune modification détectée');
        onClose();
        return;
      }

      await apiClient.post(`/reservations/${reservation.id}/update`, payload);

      toast.success('Réservation mise à jour avec succès');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to update reservation:', error);
      const errorMessage =
        error.response?.data?.message || 'Erreur lors de la mise à jour de la réservation';
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

  if (!reservation) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier la réservation"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Info (read-only) */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Produit
          </label>
          <p className="text-sm text-gray-900">
            {reservation.product.name}
            {reservation.product.sku && (
              <span className="text-gray-500 ml-2">({reservation.product.sku})</span>
            )}
          </p>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
            placeholder="Notes sur la réservation (optionnel)"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.notes.length}/250 caractères
          </p>
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
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
