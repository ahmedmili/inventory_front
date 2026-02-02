'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApi } from '@/hooks/useApi';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';
import Link from 'next/link';
import Image from 'next/image';
import Autocomplete, { AutocompleteOption } from '@/components/ui/Autocomplete';

interface Notification {
  id: string;
  type: string;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
  const { data: unreadCount, mutate: mutateCount } = useApi<{ count: number }>('/notifications/unread/count');
  const { mutate: markAsRead } = useApiMutation();
  const toast = useToast();

  // Écouter les nouvelles notifications en temps réel
  useNotificationsRealtime(() => {
    // Rafraîchir la liste et le compteur quand une nouvelle notification arrive
    mutateNotifications();
    mutateCount();
  });

  // Filtrer les notifications
  const filteredNotifications = allNotifications?.filter((notification) => {
    // Filtre par statut (lu/non lu)
    if (filter === 'unread' && notification.readAt) return false;
    if (filter === 'read' && !notification.readAt) return false;
    
    // Filtre par type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  }) || [];

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(`/notifications/${id}/read`, 'POST', {});
      mutateNotifications(); // Refresh notifications
      mutateCount(); // Refresh unread count
    } catch (error) {
      toast.error('Échec du marquage de la notification comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAsRead('/notifications/read-all', 'POST', {});
      mutateNotifications(); // Refresh notifications
      mutateCount(); // Refresh unread count
      toast.success('Toutes les notifications ont été marquées comme lues', {
        duration: 3000,
      });
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'text-yellow-600 bg-yellow-50';
      case 'OUT_OF_STOCK':
        return 'text-red-600 bg-red-50';
      case 'EXPIRATION':
      case 'EXPIRY_ALERT':
        return 'text-orange-600 bg-orange-50';
      case 'PURCHASE_ORDER_RECEIVED':
      case 'PURCHASE_ORDER_VALIDATED':
        return 'text-green-600 bg-green-50';
      case 'SALES_ORDER_DELIVERED':
      case 'SALES_ORDER_CONFIRMED':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        title="Voir les notifications"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount && unreadCount.count > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
        {unreadCount && unreadCount.count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount.count > 9 ? '9+' : unreadCount.count}
          </span>
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />,
        document.body
      )}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {filteredNotifications.length > 0 && filter === 'unread' && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                    title="Marquer toutes les notifications comme lues"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              
              {/* Filtres */}
              <div className="flex gap-2 mb-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Toutes</option>
                  <option value="unread">Non lues</option>
                  <option value="read">Lues</option>
                </select>
                <div className="flex-1">
                  <Autocomplete
                    options={typeOptions}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    placeholder="Tous types"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
            
            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Chargement...</div>
              ) : filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => {
                    const link = getNotificationLink(notification);
                    const NotificationContent = (
                      <div
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.readAt ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => !notification.readAt && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {notification.data?.imageUrl || notification.data?.image ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={notification.data.imageUrl || notification.data.image}
                                  alt={notification.data?.name || 'Notification'}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            ) : (
                              <div className={`h-2.5 w-2.5 rounded-full mt-1 ${
                                !notification.readAt ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getNotificationColor(notification.type)}`}>
                              {notification.type.replace('_', ' ')}
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm')}
                            </p>
                            {!notification.readAt && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="mt-2 text-xs text-primary-600 hover:text-primary-900"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    
                    return link ? (
                      <Link key={notification.id} href={link} onClick={() => setIsOpen(false)}>
                        {NotificationContent}
                      </Link>
                    ) : (
                      <div key={notification.id}>{NotificationContent}</div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="mt-2 text-sm">Aucune notification</p>
                </div>
              )}
            </div>
            
            {/* Footer avec lien vers toutes les notifications */}
            {allNotifications && allNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </div>
      )}
    </div>
  );
}

