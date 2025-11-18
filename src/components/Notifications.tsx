'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, loading, mutate: mutateNotifications } = useApi<Notification[]>('/notifications?unread=true');
  const { data: unreadCount, mutate: mutateCount } = useApi<{ count: number }>('/notifications/unread/count');
  const { mutate: markAsRead } = useApiMutation();
  const toast = useToast();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(`/notifications/${id}/read`, 'PUT', {});
      mutateNotifications(); // Refresh notifications
      mutateCount(); // Refresh unread count
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAsRead('/notifications/read-all', 'PUT', {});
      mutateNotifications(); // Refresh notifications
      mutateCount(); // Refresh unread count
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'LOW_STOCK':
        return `Low stock alert: ${notification.data?.name || 'Product'}`;
      case 'OUT_OF_STOCK':
        return `Out of stock: ${notification.data?.name || 'Product'}`;
      case 'EXPIRATION':
        return `Product expiring soon: ${notification.data?.name || 'Product'}`;
      default:
        return 'New notification';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'text-yellow-600 bg-yellow-50';
      case 'OUT_OF_STOCK':
        return 'text-red-600 bg-red-50';
      case 'EXPIRATION':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
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

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              {notifications && notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-900"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications && notifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !notification.readAt ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => !notification.readAt && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              !notification.readAt ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

