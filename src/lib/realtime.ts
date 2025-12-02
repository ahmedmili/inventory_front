'use client';

import { io, Socket } from 'socket.io-client';
import { localStorageService, LOCAL_STORAGE_KEYS } from './local-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export type RealtimeEventHandler = (payload: any) => void;

interface Subscription {
  event: string;
  handler: RealtimeEventHandler;
}

const subscriptions = new Map<string, Set<RealtimeEventHandler>>();

export function getRealtimeSocket(): Socket {
  if (socket) {
    return socket;
  }

  const token = localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: token
      ? {
          token: `Bearer ${token}`,
        }
      : undefined,
  });

  socket.on('connect', () => {
    console.debug('[Realtime] Connected', socket?.id);
  });

  socket.on('disconnect', (reason: string) => {
    console.debug('[Realtime] Disconnected', reason);
  });

  // Réabonner automatiquement tous les handlers enregistrés
  socket.onAny((event: string, payload: unknown) => {
    const handlers = subscriptions.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  });

  return socket;
}

export function subscribeRealtime(event: string, handler: RealtimeEventHandler) {
  const socket = getRealtimeSocket();

  if (!subscriptions.has(event)) {
    subscriptions.set(event, new Set());
  }
  subscriptions.get(event)!.add(handler);

  // Pas besoin d'appeler socket.on ici, on passe par onAny + dispatch centralisé

  return () => {
    const handlers = subscriptions.get(event);
    if (!handlers) return;
    handlers.delete(handler);
  };
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
    subscriptions.clear();
  }
}


