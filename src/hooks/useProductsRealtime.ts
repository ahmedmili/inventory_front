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
      // Optionnel: afficher une notification discrète avec le nouveau système
      // Décommentez pour activer les notifications de mise à jour de stock
      /*
      const quantityChange = payload.quantity - payload.previousQuantity;
      const changeLabel = quantityChange > 0 
        ? `+${quantityChange}` 
        : `${quantityChange}`;
      
      toast.showToast({
        type: 'info',
        title: 'Stock Mis à Jour',
        message: `${payload.productName}${payload.warehouseName ? ` (${payload.warehouseName})` : ''} - Stock: ${changeLabel}`,
        duration: 3000,
        position: 'bottom-right',
        showProgressBar: false,
        pauseOnHover: false,
        actions: [
          {
            label: 'Voir le produit',
            onClick: () => {
              window.location.href = `/products/${payload.productId}`;
            },
            style: 'secondary',
          },
        ],
      });
      */
      
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

