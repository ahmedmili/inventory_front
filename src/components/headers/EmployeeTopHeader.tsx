'use client';

import { useState } from 'react';
import Notifications from '../Notifications';
import { User } from '@/lib/auth';
import { useReservationCart } from '@/hooks/useReservationCart';
import { hasPermission } from '@/lib/permissions';
import ReservationCartModal from '../reservations/ReservationCartModal';

interface EmployeeTopHeaderProps {
  user: User | null;
}

const getRoleLabel = (role: User['role']) => {
  if (!role) return '';
  if (typeof role === 'string') {
    return role;
  }
  return role.name || role.code || '';
};

/**
 * EmployeeTopHeader - Top header/navbar component specifically for Employee/Stock Keeper users
 * This header can have employee-specific features and styling
 */
export default function EmployeeTopHeader({ user }: EmployeeTopHeaderProps) {
  const { cartCount } = useReservationCart();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const canCreateReservation = hasPermission(user, 'reservations.create');

  return (
    <>
      <header className="bg-white shadow-sm h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-20">
        <div className="flex-1"></div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {canCreateReservation && cartCount > 0 && (
            <button
              onClick={() => setIsReservationModalOpen(true)}
              className="relative inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              title="Voir le panier de réservation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Panier</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          )}
          <Notifications />
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
            <span className="text-gray-700 truncate max-w-[120px] sm:max-w-none">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-gray-500 hidden sm:inline">{getRoleLabel(user?.role ?? null)}</span>
          </div>
        </div>
      </header>
      {canCreateReservation && (
        <ReservationCartModal
          isOpen={isReservationModalOpen}
          onClose={() => setIsReservationModalOpen(false)}
        />
      )}
    </>
  );
}

