'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';
import RouteGuard from '@/components/guards/RouteGuard';
import Link from 'next/link';
import Image from 'next/image';
import { SearchIcon, CloseIcon } from '@/components/icons';
import Autocomplete, { AutocompleteOption } from '@/components/ui/Autocomplete';

interface Notification {
  id: string;
  type: string;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Options pour l'autocomplete de type
  const typeOptions: AutocompleteOption[] = [
    { value: 'all', label: 'Tous types' },
    { value: 'LOW_STOCK', label: 'Stock faible' },
    { value: 'OUT_OF_STOCK', label: 'Stock épuisé' },
    { value: 'EXPIRATION', label: 'Expiration' },
    { value: 'PURCHASE_ORDER_RECEIVED', label: 'Commandes d\'achat reçues' },
    { value: 'PURCHASE_ORDER_VALIDATED', label: 'Commandes d\'achat validées' },
    { value: 'SALES_ORDER_DELIVERED', label: 'Commandes de vente livrées' },
    { value: 'SALES_ORDER_CONFIRMED', label: 'Commandes de vente confirmées' },
  ];
  const { data: allNotifications, loading, mutate: mutateNotifications } = useApi<Notification[]>('/notifications');
  const { data: unreadCount } = useApi<{ count: number }>('/notifications/unread/count');
  const { mutate: markAsRead, mutate: markAllAsRead } = useApiMutation();
  const toast = useToast();

  // Écouter les nouvelles notifications en temps réel
  useNotificationsRealtime(() => {
    mutateNotifications();
  });

  // Filtrer les notifications
  const filteredNotifications = allNotifications?.filter((notification) => {
    // Filtre par statut (lu/non lu)
    if (filter === 'unread' && notification.readAt) return false;
    if (filter === 'read' && !notification.readAt) return false;
    
    // Filtre par type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      const message = getNotificationMessage(notification).toLowerCase();
      const type = notification.type.toLowerCase();
      if (!message.includes(searchLower) && !type.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  }) || [];

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(`/notifications/${id}/read`, 'POST', {});
      mutateNotifications();
      toast.success('Notification marquée comme lue');
    } catch (error) {
      toast.error('Échec du marquage de la notification comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead('/notifications/read-all', 'POST', {});
      mutateNotifications();
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      toast.error('Échec du marquage de toutes les notifications comme lues');
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const productName = notification.data?.name || 'Produit';
    const sku = notification.data?.sku ? ` (${notification.data.sku})` : '';
    
    switch (notification.type) {
      case 'LOW_STOCK':
        return `Stock faible: ${productName}${sku}`;
      case 'OUT_OF_STOCK':
        return `Stock épuisé: ${productName}${sku}`;
      case 'EXPIRATION':
      case 'EXPIRY_ALERT':
        return `Produit expirant bientôt: ${productName}${sku}`;
      case 'PURCHASE_ORDER_RECEIVED':
        return `Commande d'achat reçue: ${notification.data?.number || 'N/A'}`;
      case 'PURCHASE_ORDER_VALIDATED':
        return `Commande d'achat validée: ${notification.data?.number || 'N/A'}`;
      case 'SALES_ORDER_DELIVERED':
        return `Commande de vente livrée: ${notification.data?.number || 'N/A'}`;
      case 'SALES_ORDER_CONFIRMED':
        return `Commande de vente confirmée: ${notification.data?.number || 'N/A'}`;
      default:
        return 'Nouvelle notification';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'OUT_OF_STOCK':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'EXPIRATION':
      case 'EXPIRY_ALERT':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'PURCHASE_ORDER_RECEIVED':
      case 'PURCHASE_ORDER_VALIDATED':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'SALES_ORDER_DELIVERED':
      case 'SALES_ORDER_CONFIRMED':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      default:
        return 'text-blue-700 bg-blue-100 border-blue-200';
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.data?.productId) {
      return `/products/${notification.data.productId}`;
    }
    if (notification.data?.purchaseOrderId) {
      return `/purchases/${notification.data.purchaseOrderId}`;
    }
    if (notification.data?.salesOrderId) {
      return `/sales/${notification.data.salesOrderId}`;
    }
    return null;
  };

  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requirePermissions: ['notifications.read'],
      }}
    >
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Centre de Notifications</h2>
              {unreadCount && (
                <p className="mt-1 text-sm text-gray-500">
                  {unreadCount.count} notification{unreadCount.count !== 1 ? 's' : ''} non lue{unreadCount.count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {filteredNotifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher dans les notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filtre par statut */}
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="block w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">Toutes</option>
                <option value="unread">Non lues</option>
                <option value="read">Lues</option>
              </select>
            </div>

            {/* Filtre par type */}
            <div className="w-full sm:w-auto">
              <Autocomplete
                options={typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                placeholder="Tous types"
              />
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const link = getNotificationLink(notification);
                const NotificationContent = (
                  <div
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notification.readAt ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {notification.data?.imageUrl || notification.data?.image ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={notification.data.imageUrl || notification.data.image}
                              alt={notification.data?.name || 'Notification'}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className={`h-3 w-3 rounded-full mt-1 ${
                            !notification.readAt ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border ${getNotificationColor(notification.type)}`}>
                                {notification.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-base font-medium text-gray-900">
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(notification.createdAt), 'dd MMMM yyyy à HH:mm')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.readAt && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Marquer comme lu"
                              >
                                Marquer lu
                              </button>
                            )}
                            {link && (
                              <Link
                                href={link}
                                className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                Voir →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                
                return (
                  <div key={notification.id}>
                    {link ? (
                      <Link href={link} className="block">
                        {NotificationContent}
                      </Link>
                    ) : (
                      NotificationContent
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune notification</h3>
            <p className="mt-2 text-sm text-gray-500">
              {search || filter !== 'all' || typeFilter !== 'all'
                ? 'Aucune notification ne correspond à vos filtres'
                : "Vous n'avez aucune notification pour le moment"}
            </p>
            {(search || filter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                  setTypeFilter('all');
                }}
                className="mt-4 text-sm text-primary-600 hover:text-primary-900"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

