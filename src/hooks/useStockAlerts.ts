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
 * 
 * @param onAlert - Callback optionnel appelé quand une alerte est reçue
 */
export function useStockAlerts(onAlert?: (payload: StockAlertPayload) => void) {
  const { subscribe } = useRealtime();
  const toast = useToast();

  useEffect(() => {
    // Nom de l'événement aligné avec RealtimeEvent.STOCK_ALERT côté backend
    const unsubscribe = subscribe('stock.alert', (payload: StockAlertPayload) => {
      const label = payload.sku ? `${payload.name} (${payload.sku})` : payload.name;
      
      // Afficher le toast selon le type d'alerte
      if (payload.type === 'OUT_OF_STOCK') {
        toast.error?.(`Stock épuisé: ${label}`);
      } else {
        toast.warning?.(`Alerte stock: ${label}`);
      }

      // Callback personnalisé
      if (onAlert) {
        onAlert(payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast, onAlert]);
}


