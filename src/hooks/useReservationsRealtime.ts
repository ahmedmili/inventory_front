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
      toast.success?.(`Nouvelle réservation: ${payload.productName} (${payload.quantity})`);
      
      // Callback personnalisé pour rafraîchir les données
      if (onReservationCreated) {
        onReservationCreated(payload);
      }
    });

    // Écouter les mises à jour de réservations
    const unsubscribeUpdated = subscribe('reservation.updated', (payload: ReservationEventPayload) => {
      toast.info?.(`Réservation mise à jour: ${payload.productName}`);
      
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

