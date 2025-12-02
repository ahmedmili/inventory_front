'use client';

import { useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';

interface StockAlertPayload {
  productId: string;
  name: string;
  sku: string;
  type: string;
}

/**
 * Hook simple qui écoute les alertes de stock temps réel et affiche un toast.
 * Peut être utilisé dans le layout admin ou sur les pages produits/réservations.
 */
export function useStockAlerts() {
  const { subscribe } = useRealtime();
  const toast = useToast();

  useEffect(() => {
    // Nom de l'événement aligné avec RealtimeEvent.STOCK_ALERT côté backend
    const unsubscribe = subscribe('stock.alert', (payload: StockAlertPayload) => {
      const label = payload.sku ? `${payload.name} (${payload.sku})` : payload.name;
      toast.warning?.(
        `Alerte stock sur ${label}`,
      );
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast]);
}


