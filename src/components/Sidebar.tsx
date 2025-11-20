'use client';

import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SidebarFooter from './SidebarFooter';

interface User {
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  user, 
  onLogout, 
  isMinimized = false,
  onToggleMinimize 
}: SidebarProps) {
  const width = isMinimized ? 'w-20' : 'w-64';

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 ${width} bg-white shadow-lg transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <SidebarHeader 
        onClose={onClose} 
        showCloseButton={true}
        isMinimized={isMinimized}
        onToggleMinimize={onToggleMinimize}
      />
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

