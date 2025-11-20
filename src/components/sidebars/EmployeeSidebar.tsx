'use client';

import SidebarHeader from '../SidebarHeader';
import SidebarSearch from '../SidebarSearch';
import SidebarNavigation from '../SidebarNavigation';
import SidebarFooter from '../SidebarFooter';
import { User } from '@/lib/auth';

interface EmployeeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onToggleOpen?: () => void;
}

/**
 * EmployeeSidebar - Sidebar component specifically for Employee/Stock Keeper users
 * This sidebar can have employee-specific navigation items and styling
 */
export default function EmployeeSidebar({ 
  isOpen, 
  onClose, 
  user, 
  onLogout, 
  isMinimized = false,
  onToggleMinimize,
  onToggleOpen
}: EmployeeSidebarProps) {
  const width = isMinimized ? 'w-20' : 'w-64';

  return (
    <aside
      className={`
        fixed top-0 bottom-0 left-0 z-40 ${width} bg-white shadow-xl border-r border-gray-100 transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:relative lg:z-auto lg:h-screen
        ${isMinimized ? 'translate-x-0' : (isOpen ? 'translate-x-0' : '-translate-x-full')}
        flex flex-col h-screen
      `}
      style={{ maxWidth: isMinimized ? '5rem' : '16rem' }}
    >
      <SidebarHeader 
        isMinimized={isMinimized}
      />
      {/* <SidebarSearch isMinimized={isMinimized} /> */}
      <SidebarNavigation 
        onNavigate={onClose}
        isMinimized={isMinimized}
      />
      <SidebarFooter 
        user={user} 
        onLogout={onLogout}
        isMinimized={isMinimized}
      />
    </aside>
  );
}

