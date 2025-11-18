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
}

export default function Sidebar({ isOpen, onClose, user, onLogout }: SidebarProps) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <SidebarHeader onClose={onClose} showCloseButton={true} />
      <SidebarNavigation onNavigate={onClose} />
      <SidebarFooter user={user} onLogout={onLogout} />
    </aside>
  );
}

