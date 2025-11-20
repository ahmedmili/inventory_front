'use client';

import Notifications from './Notifications';
import { User } from '@/lib/auth';

interface TopHeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

const getRoleLabel = (role: User['role']) => {
  if (!role) return '';
  if (typeof role === 'string') {
    return role;
  }
  return role.name || role.code || '';
};

export default function TopHeader({ onMenuClick, user }: TopHeaderProps) {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 p-2 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 flex items-center justify-end space-x-4">
        <Notifications />
        <div className="hidden sm:flex items-center space-x-3 text-sm">
          <span className="text-gray-700">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">{getRoleLabel(user?.role ?? null)}</span>
        </div>
      </div>
    </header>
  );
}

