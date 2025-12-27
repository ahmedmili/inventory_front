'use client';

import { useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

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

/**
 * Hook pour afficher des notifications toast quand des utilisateurs se connectent/déconnectent
 * Utilisé dans le dashboard admin pour informer l'admin des changements de présence
 */
export function usePresenceNotifications() {
  const { subscribe } = useRealtime();
  const toast = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    // Écouter les connexions
    const unsubscribeJoin = subscribe('presence.join', (payload: PresenceJoinPayload) => {
      // Ne pas afficher de notification pour sa propre connexion
      if (currentUser && payload.userId === currentUser.id) {
        return;
      }

      const userName = payload.userName || 'Un utilisateur';
      const role = payload.userRole ? ` (${payload.userRole})` : '';
      toast.info?.(`${userName}${role} est maintenant en ligne`);
    });

    // Écouter les déconnexions
    const unsubscribeLeave = subscribe('presence.leave', (payload: PresenceLeavePayload) => {
      // Ne pas afficher de notification pour sa propre déconnexion
      if (currentUser && payload.userId === currentUser.id) {
        return;
      }

      toast.info?.('Un utilisateur s\'est déconnecté');
    });

    return () => {
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, [subscribe, toast, currentUser]);
}

