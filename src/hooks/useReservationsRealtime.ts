'use client';

import { useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';

interface ReservationEventPayload {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  userId: string;
  userName?: string;
  userRole?: string;
  status: string;
  createdAt: string;
}

/**
 * Hook pour écouter les événements temps réel des réservations
 * Rafraîchit automatiquement les données et affiche des notifications
 */
export function useReservationsRealtime(
  onReservationCreated?: (payload: ReservationEventPayload) => void,
  onReservationUpdated?: (payload: ReservationEventPayload) => void,
) {
  const { subscribe } = useRealtime();
  const toast = useToast();

  useEffect(() => {
    // Écouter les nouvelles réservations
    const unsubscribeCreated = subscribe('reservation.created', (payload: ReservationEventPayload) => {
      toast.showToast({
        type: 'success',
        title: 'Nouvelle Réservation',
        message: `${payload.productName} - Quantité: ${payload.quantity}${payload.warehouseName ? ` (${payload.warehouseName})` : ''}`,
        duration: 5000,
        position: 'top-right',
        actions: [
          {
            label: 'Voir la réservation',
            onClick: () => {
              window.location.href = '/reservations';
            },
            style: 'primary',
          },
        ],
        onClick: () => {
          window.location.href = '/reservations';
        },
      });
      
      // Callback personnalisé pour rafraîchir les données
      if (onReservationCreated) {
        onReservationCreated(payload);
      }
    });

    // Écouter les mises à jour de réservations
    const unsubscribeUpdated = subscribe('reservation.updated', (payload: ReservationEventPayload) => {
      const statusLabel = payload.status === 'RESERVED' ? 'Réservée' : 
                         payload.status === 'RELEASED' ? 'Libérée' :
                         payload.status === 'CANCELLED' ? 'Annulée' :
                         payload.status === 'FULFILLED' ? 'Remplie' : payload.status;
      
      toast.showToast({
        type: 'info',
        title: 'Réservation Mise à Jour',
        message: `${payload.productName} - Statut: ${statusLabel}`,
        duration: 4000,
        position: 'top-right',
        actions: [
          {
            label: 'Voir les réservations',
            onClick: () => {
              window.location.href = '/reservations';
            },
            style: 'secondary',
          },
        ],
        onClick: () => {
          window.location.href = '/reservations';
        },
      });
      
      // Callback personnalisé pour rafraîchir les données
      if (onReservationUpdated) {
        onReservationUpdated(payload);
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe, toast, onReservationCreated, onReservationUpdated]);
}

