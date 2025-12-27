'use client';

import { io, Socket } from 'socket.io-client';
import { localStorageService, LOCAL_STORAGE_KEYS } from './local-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;
let isConnecting = false; // Flag pour éviter les connexions multiples simultanées

export type RealtimeEventHandler = (payload: any) => void;

interface Subscription {
  event: string;
  handler: RealtimeEventHandler;
}

const subscriptions = new Map<string, Set<RealtimeEventHandler>>();

export function getRealtimeSocket(): Socket {
  // Réutiliser le socket existant même s'il n'est pas encore connecté
  // pour éviter les connexions multiples
  if (socket) {
    return socket;
  }

  // Éviter les tentatives de connexion multiples simultanées
  if (isConnecting) {
    // Si une connexion est déjà en cours, attendre un peu et réessayer
    // Dans la plupart des cas, le socket sera créé très rapidement
    console.warn('[Realtime] Connection already in progress, will reuse when ready');
    // Retourner un socket temporaire qui ne se connecte pas
    // Le vrai socket sera retourné au prochain appel
    const tempSocket = io(API_URL, { autoConnect: false });
    // Nettoyer après un court délai
    setTimeout(() => {
      if (socket && tempSocket !== socket) {
        tempSocket.close();
      }
    }, 1000);
    return tempSocket;
  }

  const token = localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    console.warn('[Realtime] No access token found, WebSocket connection will fail');
    // Créer quand même un socket mais il sera rejeté par le serveur
  }

  console.log('[Realtime] Creating new WebSocket connection');
  isConnecting = true;
  
  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    // Éviter les reconnexions multiples rapides
    forceNew: false, // Réutiliser la connexion existante si possible
    auth: token
      ? {
          token: token, // Le backend attend juste le token, pas "Bearer"
        }
      : undefined,
    // Ajouter aussi dans les headers au cas où
    extraHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  socket.on('connect', () => {
    console.log('[Realtime] ✅ Socket connected, ID:', socket?.id);
  });

  socket.on('disconnect', (reason: string) => {
    console.warn('[Realtime] ❌ Socket disconnected, reason:', reason);
  });

  socket.on('connect_error', (error: Error) => {
    console.error('[Realtime] ❌ Connection error:', error);
  });

  // Écouter l'événement connection.ack pour confirmer la connexion
  socket.on('connection.ack', (payload: any) => {
    console.log('[Realtime] ✅ Connection acknowledged by server:', payload);
  });

  // Réabonner automatiquement tous les handlers enregistrés
  // Utiliser onAny une seule fois (Socket.io gère déjà la déduplication)
  socket.onAny((event: string, payload: unknown) => {
    console.log('[Realtime] 📨 Event received:', event, payload);
    const handlers = subscriptions.get(event);
    if (handlers) {
      console.debug(`[Realtime] Dispatching to ${handlers.size} handler(s) for event: ${event}`);
      handlers.forEach((handler) => handler(payload));
    } else {
      console.debug(`[Realtime] No handlers registered for event: ${event}`);
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
  
  console.debug(`[Realtime] Subscribed to event: ${event} (total handlers: ${subscriptions.get(event)!.size})`);

  // Pas besoin d'appeler socket.on ici, on passe par onAny + dispatch centralisé

  return () => {
    const handlers = subscriptions.get(event);
    if (!handlers) return;
    handlers.delete(handler);
    console.debug(`[Realtime] Unsubscribed from event: ${event} (remaining handlers: ${handlers.size})`);
  };
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
    subscriptions.clear();
  }
}


