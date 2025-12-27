'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
  userName?: string;
  userRole?: string;
}

interface PresenceJoinPayload {
  userId: string;
  userName?: string;
  userRole?: string;
  timestamp: Date;
}

interface PresenceLeavePayload {
  userId: string;
  timestamp: Date;
}

interface PresenceUpdatePayload {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

interface PresenceListPayload {
  users: Array<{
    userId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen?: Date;
  }>;
  timestamp: Date;
}

/**
 * Hook pour écouter les événements de présence en temps réel
 * Maintient une map des utilisateurs et leur statut
 */
export function usePresenceRealtime() {
  const { subscribe } = useRealtime();
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());

  const updatePresence = useCallback((userId: string, updates: Partial<UserPresence>) => {
    setPresences((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(userId) || {
        userId,
        status: 'offline' as const,
      };
      newMap.set(userId, { ...existing, ...updates });
      return newMap;
    });
  }, []);

  const removePresence = useCallback((userId: string) => {
    setPresences((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  }, []);

  useEffect(() => {
    console.log('[Presence] 🔧 Setting up presence listeners...');
    
    // Écouter la liste initiale des utilisateurs en ligne
    const unsubscribeList = subscribe('presence.list', (payload: PresenceListPayload) => {
      console.log('[Presence] ✅ Received initial presence list:', payload.users.length, 'users');
      console.debug('[Presence] Payload:', payload);
      // Initialiser la map avec tous les utilisateurs en ligne
      const newMap = new Map<string, UserPresence>();
      payload.users.forEach((user) => {
        newMap.set(user.userId, {
          userId: user.userId,
          status: user.status,
          lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined,
        });
      });
      setPresences(newMap);
      console.debug('[Presence] Updated presences map with', newMap.size, 'users');
    });

    // Écouter les connexions
    const unsubscribeJoin = subscribe('presence.join', (payload: PresenceJoinPayload) => {
      console.log('[Presence] ✅ User joined:', payload.userId, payload.userName || 'Unknown');
      console.debug('[Presence] Join payload:', payload);
      updatePresence(payload.userId, {
        status: 'online',
        userName: payload.userName,
        userRole: payload.userRole,
        lastSeen: new Date(payload.timestamp),
      });
    });

    // Écouter les déconnexions
    const unsubscribeLeave = subscribe('presence.leave', (payload: PresenceLeavePayload) => {
      updatePresence(payload.userId, {
        status: 'offline',
        lastSeen: new Date(payload.timestamp),
      });
    });

    // Écouter les mises à jour de présence
    const unsubscribeUpdate = subscribe('presence.update', (payload: PresenceUpdatePayload) => {
      updatePresence(payload.userId, {
        status: payload.status,
        lastSeen: payload.lastSeen ? new Date(payload.lastSeen) : undefined,
      });
    });

    return () => {
      unsubscribeList();
      unsubscribeJoin();
      unsubscribeLeave();
      unsubscribeUpdate();
    };
  }, [subscribe, updatePresence]);

  // Convertir la Map en tableau pour faciliter l'utilisation
  const presencesArray = Array.from(presences.values());

  return {
    presences: presencesArray,
    presencesMap: presences,
    getPresence: (userId: string) => presences.get(userId),
    isOnline: (userId: string) => presences.get(userId)?.status === 'online',
    isAway: (userId: string) => presences.get(userId)?.status === 'away',
    isOffline: (userId: string) => {
      const presence = presences.get(userId);
      return !presence || presence.status === 'offline';
    },
  };
}

