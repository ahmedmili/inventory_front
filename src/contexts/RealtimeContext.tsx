'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getRealtimeSocket, subscribeRealtime, disconnectRealtime } from '@/lib/realtime';
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

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
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


