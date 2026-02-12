'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Autocomplete from '../ui/Autocomplete';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useModal } from '@/contexts/ModalContext';

interface Project {
  id: string;
  name: string;
}

interface ReservationItem {
  id: string;
  quantity: number;
  status?: string;
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
  const modal = useModal();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku?: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [addingProduct, setAddingProduct] = useState(false);
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
      const [projectsRes, productsRes] = await Promise.all([
        apiClient.get('/projects?status=ACTIVE'),
        apiClient.get('/products?limit=500&sortBy=name&sortOrder=asc'),
      ]);
      const projectsData = projectsRes.data?.data || projectsRes.data || [];
      setProjects(projectsData);
      const productsData = productsRes.data?.data || productsRes.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
      console.log('Projects loaded:', projectsData.length);
      
      // If we have a projectId but projects just loaded, ensure the form data is set correctly
      if (group && group.project?.id && projectsData.length > 0) {
        const projectExists = projectsData.some((p: Project) => p.id === group.project?.id);
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

  const handleRemoveItem = (item: ReservationItem) => {
    if (item.status && item.status !== 'RESERVED') {
      toast.info('Seules les lignes en attente peuvent être retirées');
      return;
    }
    modal.confirm({
      title: 'Retirer le produit',
      content: `Retirer « ${item.product.name} » de la réservation ? La quantité sera remise en stock.`,
      confirmText: 'Retirer',
      cancelText: 'Annuler',
      onConfirm: async () => {
        try {
          await apiClient.patch(`/reservations/${item.id}/release`, {
            notes: 'Retiré du groupe par l\'utilisateur',
          });
          toast.success('Produit retiré de la réservation');
          onSuccess?.();
          onClose();
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Erreur lors du retrait');
        }
      },
    });
  };

  const handleAddProduct = async () => {
    if (!group || !addProductId || addQuantity < 1) {
      toast.info('Sélectionnez un produit et une quantité');
      return;
    }
    try {
      setAddingProduct(true);
      await apiClient.post(`/reservations/group/${group.groupId}/add`, {
        productId: addProductId,
        quantity: addQuantity,
      });
      toast.success('Produit ajouté à la réservation');
      setAddProductId('');
      setAddQuantity(1);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du produit');
    } finally {
      setAddingProduct(false);
    }
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

      toast.success('Réservation mise à jour avec succès');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to update reservation group:', error);
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

  if (!group) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier la réservation"
      variant="form"
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
            placeholder="Notes (optionnel)"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.notes.length}/250 caractères
          </p>
        </div>

        {/* Add product */}
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ajouter un produit
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px]">
              <Autocomplete
                options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.name} (${p.sku})` : p.name }))}
                value={addProductId}
                onChange={(v) => setAddProductId(v || '')}
                placeholder="Choisir un produit"
              />
            </div>
            <div className="w-24">
              <input
                type="number"
                min={1}
                value={addQuantity}
                onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              disabled={addingProduct || !addProductId}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {addingProduct ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>

        {/* Products Quantities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quantités des produits
          </label>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {group.items.map((item) => {
                const formItem = formData.items.find(i => i.reservationId === item.id);
                const isReserved = item.status === 'RESERVED' || item.status === undefined;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product.name}
                        {item.product.sku && (
                          <span className="text-xs text-gray-500 ml-2">({item.product.sku})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quantité actuelle: {item.quantity}
                        {item.status && !isReserved && (
                          <span className="ml-2 text-gray-400">· {item.status === 'FULFILLED' ? 'Validé' : 'Annulé'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isReserved ? (
                        <>
                          <input
                            type="number"
                            min="1"
                            value={formItem?.quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            className="px-2 py-1 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                            title="Retirer ce produit de la réservation"
                          >
                            Retirer
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
