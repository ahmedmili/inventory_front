'use client';

import { useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';

interface NotificationEventPayload {
  id: string;
  userId: string;
  type: string;
  data: any;
  createdAt: string;
}

/**
 * Hook pour écouter les nouvelles notifications en temps réel
 * Rafraîchit automatiquement la liste des notifications et le compteur
 */
export function useNotificationsRealtime(
  onNotificationCreated?: (payload: NotificationEventPayload) => void,
) {
  const { subscribe } = useRealtime();
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = subscribe('notification.created', (payload: NotificationEventPayload) => {
      // Afficher une notification toast selon le type
      const getMessage = () => {
        switch (payload.type) {
          case 'LOW_STOCK':
            return `Stock faible: ${payload.data?.name || 'Produit'}`;
          case 'OUT_OF_STOCK':
            return `Stock épuisé: ${payload.data?.name || 'Produit'}`;
          case 'EXPIRY_ALERT':
            return `Produit expirant bientôt: ${payload.data?.name || 'Produit'}`;
          default:
            return 'Nouvelle notification';
        }
      };

      const getToastType = () => {
        switch (payload.type) {
          case 'LOW_STOCK':
            return 'warning';
          case 'OUT_OF_STOCK':
            return 'error';
          case 'EXPIRY_ALERT':
            return 'warning';
          default:
            return 'info';
        }
      };

      const message = getMessage();
      const type = getToastType();

      if (type === 'error') {
        toast.error?.(message);
      } else if (type === 'warning') {
        toast.warning?.(message);
      } else {
        toast.info?.(message);
      }

      // Callback personnalisé pour rafraîchir les données
      if (onNotificationCreated) {
        onNotificationCreated(payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast, onNotificationCreated]);
}

