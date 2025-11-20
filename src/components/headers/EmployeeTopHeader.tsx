'use client';

import Notifications from '../Notifications';
import { User } from '@/lib/auth';

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
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-end px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center space-x-4">
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

