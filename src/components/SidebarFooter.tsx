'use client';

import { User } from '@/lib/auth';

interface SidebarFooterProps {
  user: User | null;
  onLogout: () => void;
  isMinimized?: boolean;
}

function getRoleLabel(role: User['role']) {
  if (!role) return '';
  if (typeof role === 'string') {
    return role;
  }
  return role.name || role.code || '';
}

export default function SidebarFooter({ user, onLogout, isMinimized = false }: SidebarFooterProps) {
  const initials = user?.firstName?.[0] && user?.lastName?.[0] 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : 'U';
  const roleLabel = getRoleLabel(user?.role ?? null);
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

  if (isMinimized) {
    return (
      <div className="px-2 py-4 border-t border-gray-100">
        <div className="flex items-center justify-center group relative">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm cursor-pointer">
            <span className="text-white font-semibold text-sm">
              {initials}
            </span>
          </div>
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 shadow-lg">
            <div className="mb-0.5">{fullName || 'User'}</div>
            {roleLabel && (
              <div className="text-gray-300 text-[10px]">{roleLabel}</div>
            )}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">
              {initials}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {fullName || 'User'}
          </p>
          {roleLabel && (
            <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
          )}
        </div>
        <button
          onClick={onLogout}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Options"
          aria-label="Options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
