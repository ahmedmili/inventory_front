'use client';

import { useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';

interface StockUpdatePayload {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  previousQuantity: number;
  movementType: string;
}

/**
 * Hook pour écouter les mises à jour de stock en temps réel
 * Rafraîchit automatiquement les données des produits
 */
export function useProductsRealtime(
  onStockUpdated?: (payload: StockUpdatePayload) => void,
) {
  const { subscribe } = useRealtime();
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = subscribe('stock.updated', (payload: StockUpdatePayload) => {
      // Optionnel: afficher une notification discrète
      // toast.info?.(`Stock mis à jour: ${payload.productName}`);
      
      // Callback personnalisé pour rafraîchir les données
      if (onStockUpdated) {
        onStockUpdated(payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast, onStockUpdated]);
}

