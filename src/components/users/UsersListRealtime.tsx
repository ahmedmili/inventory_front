'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';
import { usePresenceRealtime } from '@/hooks/usePresenceRealtime';
import { SkeletonLoader } from '@/components/SkeletonLoader';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface UsersListRealtimeProps {
  endpoint?: string;
  title?: string;
  showRole?: boolean;
}

export default function UsersListRealtime({
  endpoint = '/users',
  title = 'Utilisateurs en ligne',
  showRole = true,
}: UsersListRealtimeProps) {
  const { data: users, loading, mutate } = useApi<User[]>(endpoint);
  const { presences, getPresence, isOnline, isAway } = usePresenceRealtime();
  const [search, setSearch] = useState('');

  // Créer une map des présences pour un accès rapide
  const presenceMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPresence>>();
    presences.forEach((presence) => {
      map.set(presence.userId, presence);
    });
    return map;
  }, [presences]);

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    const searchLower = search.toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }, [users, search]);

  // Trier les utilisateurs : en ligne d'abord, puis par nom
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aOnline = isOnline(a.id);
      const bOnline = isOnline(b.id);
      const aAway = isAway(a.id);
      const bAway = isAway(b.id);

      // En ligne d'abord
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // Puis away
      if (aAway && !bAway) return -1;
      if (!aAway && bAway) return 1;

      // Puis par nom
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
  }, [filteredUsers, isOnline, isAway]);

  const getStatusBadge = (userId: string) => {
    const presence = getPresence(userId);
    
    if (!presence || presence.status === 'offline') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
          Hors ligne
        </span>
      );
    }

    if (presence.status === 'away') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
          Absent
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
        En ligne
      </span>
    );
  };

  const onlineCount = sortedUsers.filter((u) => isOnline(u.id)).length;
  const awayCount = sortedUsers.filter((u) => isAway(u.id)).length;
  const offlineCount = sortedUsers.length - onlineCount - awayCount;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {onlineCount} en ligne • {awayCount} absent{awayCount > 1 ? 's' : ''} • {offlineCount} hors ligne
            </p>
          </div>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          sortedUsers.map((user) => {
            const presence = getPresence(user.id);
            return (
              <div
                key={user.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      {showRole && user.role && (
                        <p className="text-xs text-gray-400 mt-0.5">{user.role.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {getStatusBadge(user.id)}
                  </div>
                </div>
                {presence?.lastSeen && (
                  <div className="mt-2 text-xs text-gray-400">
                    Dernière activité: {new Date(presence.lastSeen).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

