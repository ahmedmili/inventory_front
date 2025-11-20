'use client';

import Notifications from '../Notifications';
import { User } from '@/lib/auth';

interface AdminTopHeaderProps {
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
 * AdminTopHeader - Top header/navbar component specifically for Admin/Manager users
 * This header can have admin-specific features and styling
 */
export default function AdminTopHeader({ user }: AdminTopHeaderProps) {
  return (
    <header className="bg-white shadow-sm h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-2 sm:space-x-4">
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
  );
}

