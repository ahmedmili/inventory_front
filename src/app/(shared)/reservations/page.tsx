'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useToast } from '@/contexts/ToastContext';

interface ReservationItem {
  id: string;
  quantity: number;
  status: string;
  expiresAt?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
}

interface ReservationGroup {
  groupId: string;
  createdAt: string;
  status: string;
  expiresAt?: string;
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
  items: ReservationItem[];
  totalItems: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ReservationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [reservations, setReservations] = useState<ReservationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const canCreate = hasPermission(user, 'reservations.create');
  const canCancel = hasPermission(user, 'reservations.cancel');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadReservations();
    }
  }, [user, authLoading, statusFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await apiClient.get('/reservations/my', {
        params: { 
          ...(status ? { status } : {}),
          grouped: 'true',
        },
      });
      setReservations(response.data || []);
    } catch (error: any) {
      console.error('Failed to load reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir libérer cette réservation ?')) {
      return;
    }

    try {
      await apiClient.patch(`/reservations/${id}/release`, {
        notes: 'Libéré par l\'utilisateur',
      });
      toast.success('Réservation libérée avec succès');
      loadReservations();
    } catch (error: any) {
      console.error('Failed to release reservation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la libération');
    }
  };

  const handleDownloadGroupPDF = async (groupId: string) => {
    try {
      const response = await apiClient.get(`/reservations/group/${groupId}/pdf`, {
        responseType: 'blob',
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reservation-group-${groupId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement du PDF');
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RESERVED: 'bg-blue-100 text-blue-800',
      FULFILLED: 'bg-green-100 text-green-800',
      RELEASED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      RESERVED: 'Réservé',
      FULFILLED: 'Rempli',
      RELEASED: 'Libéré',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <SkeletonLoader className="h-8 w-48 mb-2" />
          <SkeletonLoader className="h-4 w-96" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <SkeletonLoader className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Réservations
          </h1>
          <p className="text-gray-600">
            Gérez vos réservations de produits
          </p>
        </div>
        {canCreate && (
          <Link
            href="/reservations/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            title="Créer une nouvelle réservation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle Réservation
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Statut:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="RESERVED">Réservé</option>
            <option value="FULFILLED">Rempli</option>
            <option value="RELEASED">Libéré</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune réservation</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canCreate
                ? 'Commencez par créer une nouvelle réservation.'
                : 'Vous n\'avez aucune réservation pour le moment.'}
            </p>
            {canCreate && (
              <div className="mt-6">
                <Link
                  href="/reservations/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Nouvelle Réservation
                </Link>
              </div>
            )}
          </div>
        ) : (
          reservations.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);
            const hasMultipleItems = group.totalItems > 1;
            const allReserved = group.items.every(item => item.status === 'RESERVED');

            return (
              <div key={group.groupId} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Group Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Réservation #{group.groupId.slice(-8)}
                            </h3>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                group.status
                              )}`}
                            >
                              {getStatusLabel(group.status)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                            <span>{group.totalItems} produit{group.totalItems > 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>Créé le {formatDate(group.createdAt)}</span>
                            {group.project && (
                              <>
                                <span>•</span>
                                <span>Projet: {group.project.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDownloadGroupPDF(group.groupId)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                        title="Télécharger le PDF du groupe"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </button>
                      {hasMultipleItems && (
                        <button
                          onClick={() => toggleGroup(group.groupId)}
                          className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          title={isExpanded ? 'Masquer les détails' : 'Voir les détails des produits'}
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Masquer
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Voir les produits
                            </>
                          )}
                        </button>
                      )}
                      {canCancel && allReserved && (
                        <button
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir libérer toutes les réservations de ce groupe ?')) {
                              Promise.all(
                                group.items.map(item => 
                                  apiClient.patch(`/reservations/${item.id}/release`, {
                                    notes: 'Libéré par l\'utilisateur',
                                  })
                                )
                              ).then(() => {
                                toast.success('Toutes les réservations libérées avec succès');
                                loadReservations();
                              }).catch((error: any) => {
                                toast.error('Erreur lors de la libération');
                                console.error(error);
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-900 px-3 py-2 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                          title="Libérer toutes les réservations de ce groupe"
                        >
                          Libérer tout
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group Items */}
                {isExpanded && hasMultipleItems && (
                  <div className="px-6 py-4 bg-white">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Produits dans cette réservation:</h4>
                      {group.items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product.name}
                                </div>
                                {item.product.sku && (
                                  <span className="text-xs text-gray-500">SKU: {item.product.sku}</span>
                                )}
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                                    item.status
                                  )}`}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span>Quantité: {item.quantity}</span>
                                <span>•</span>
                                <span>Entrepôt: {item.warehouse.name}</span>
                              </div>
                            </div>
                            {canCancel && item.status === 'RESERVED' && (
                              <button
                                onClick={() => handleRelease(item.id)}
                                className="text-red-600 hover:text-red-900 text-sm px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                                title="Libérer cette réservation"
                              >
                                Libérer
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Item Display (when not expanded or only one item) */}
                {(!hasMultipleItems || !isExpanded) && (
                  <div className="px-6 py-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product.name}
                            {item.product.sku && (
                              <span className="text-xs text-gray-500 ml-2">({item.product.sku})</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                            <span>Quantité: {item.quantity}</span>
                            <span>•</span>
                            <span>Entrepôt: {item.warehouse.name}</span>
                            {item.expiresAt && (
                              <>
                                <span>•</span>
                                <span>Expire: {formatDate(item.expiresAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {canCancel && item.status === 'RESERVED' && (
                          <button
                            onClick={() => handleRelease(item.id)}
                            className="text-red-600 hover:text-red-900 text-sm px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                            title="Libérer cette réservation"
                          >
                            Libérer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {group.notes && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {group.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
