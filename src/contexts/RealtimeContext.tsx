'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getRealtimeSocket, subscribeRealtime, disconnectRealtime, reconnectRealtimeWithNewToken } from '@/lib/realtime';
import { LOCAL_STORAGE_KEYS, localStorageService } from '@/lib/local-storage';

interface RealtimeContextValue {
  isConnected: boolean;
  socketId?: string;
  // Hook-level abonnement aux événements
  subscribe: (event: string, handler: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Ne connecter que si on a un token
    const token = localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.warn('[RealtimeContext] No token available, skipping WebSocket connection');
      return;
    }

    console.log('[RealtimeContext] Initializing WebSocket connection with token');
    const socket = getRealtimeSocket();

    const handleConnect = () => {
      console.log('[Realtime] ✅ Connected to server, socket ID:', socket.id);
      setIsConnected(true);
      setSocketId(socket.id);
    };

    const handleDisconnect = () => {
      console.warn('[Realtime] ❌ Disconnected from server');
      setIsConnected(false);
      setSocketId(undefined);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Écouter les changements de token dans le localStorage pour reconnecter automatiquement
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.ACCESS_TOKEN && e.newValue && e.newValue !== e.oldValue) {
        console.log('[RealtimeContext] Token updated, reconnecting WebSocket...');
        reconnectRealtimeWithNewToken();
      }
    };

    // Écouter les événements de storage (pour les changements depuis d'autres onglets)
    window.addEventListener('storage', handleStorageChange);

    // Écouter les événements personnalisés pour les changements dans le même onglet
    const handleTokenRefresh = () => {
      console.log('[RealtimeContext] Token refresh event received, reconnecting WebSocket...');
      reconnectRealtimeWithNewToken();
    };
    window.addEventListener('token-refreshed', handleTokenRefresh);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-refreshed', handleTokenRefresh);
      // On ne déconnecte pas complètement ici pour permettre le partage global
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      isConnected,
      socketId,
      subscribe: (event, handler) => subscribeRealtime(event, handler),
    }),
    [isConnected, socketId],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return ctx;
}


