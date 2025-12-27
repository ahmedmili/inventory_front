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
      // Configuration du toast selon le type de notification
      const getToastConfig = () => {
        const productName = payload.data?.name || 'Produit';
        const sku = payload.data?.sku ? ` (${payload.data.sku})` : '';

        switch (payload.type) {
          case 'LOW_STOCK':
            return {
              type: 'warning' as const,
              title: 'Alerte Stock Faible',
              message: `Le stock de ${productName}${sku} est faible`,
              duration: 5000,
              position: 'top-right' as const,
              actions: [
                {
                  label: 'Voir le produit',
                  onClick: () => {
                    if (payload.data?.productId) {
                      window.location.href = `/products/${payload.data.productId}`;
                    }
                  },
                  style: 'primary' as const,
                },
              ],
            };
          case 'OUT_OF_STOCK':
            return {
              type: 'error' as const,
              title: 'Stock Épuisé',
              message: `Le stock de ${productName}${sku} est épuisé`,
              duration: 7000,
              position: 'top-right' as const,
              actions: [
                {
                  label: 'Voir le produit',
                  onClick: () => {
                    if (payload.data?.productId) {
                      window.location.href = `/products/${payload.data.productId}`;
                    }
                  },
                  style: 'primary' as const,
                },
              ],
            };
          case 'EXPIRY_ALERT':
            return {
              type: 'warning' as const,
              title: 'Alerte Expiration',
              message: `Le produit ${productName}${sku} expire bientôt`,
              duration: 6000,
              position: 'top-right' as const,
              actions: [
                {
                  label: 'Voir le produit',
                  onClick: () => {
                    if (payload.data?.productId) {
                      window.location.href = `/products/${payload.data.productId}`;
                    }
                  },
                  style: 'primary' as const,
                },
              ],
            };
          case 'SYSTEM':
            return {
              type: 'info' as const,
              title: 'Notification Système',
              message: payload.data?.message || 'Nouvelle notification système',
              duration: 4000,
              position: 'top-right' as const,
            };
          default:
            return {
              type: 'info' as const,
              title: 'Nouvelle Notification',
              message: 'Vous avez reçu une nouvelle notification',
              duration: 4000,
              position: 'top-right' as const,
            };
        }
      };

      const config = getToastConfig();
      toast.showToast({
        ...config,
        onClick: () => {
          // Rediriger vers la page des notifications
          window.location.href = '/notifications';
        },
      });

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

