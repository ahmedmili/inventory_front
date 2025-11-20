'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeSidebar from '../sidebars/EmployeeSidebar';
import SidebarOverlay from '../SidebarOverlay';
import EmployeeTopHeader from '../headers/EmployeeTopHeader';
import MainContent from '../MainContent';
import LoadingScreen from '../LoadingScreen';
import SidebarToggleButton from '../SidebarToggleButton';
import { localStorageService } from '@/lib/local-storage';
import { getUserRoleCode } from '@/lib/permissions';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_MINIMIZED_KEY = 'sidebar-minimized';

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorageService.getItem(SIDEBAR_MINIMIZED_KEY);
    if (saved === null) {
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    }
    return saved === 'true';
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user is employee or stock keeper (employee-level access)
      const roleCode = getUserRoleCode(user);
      if (roleCode === 'ADMIN' || roleCode === 'MANAGER') {
        // Redirect admin users to their appropriate layout
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    localStorageService.setItem(SIDEBAR_MINIMIZED_KEY, String(isMinimized));
  }, [isMinimized]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => {
      const newMinimized = !prev;
      if (typeof window !== 'undefined' && window.innerWidth < 1024 && !newMinimized) {
        setSidebarOpen(true);
      }
      return newMinimized;
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <EmployeeSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        user={user}
        onLogout={handleLogout}
        isMinimized={isMinimized}
        onToggleMinimize={handleToggleMinimize}
        onToggleOpen={handleSidebarToggle}
      />

      <SidebarOverlay isOpen={sidebarOpen && !isMinimized} onClose={handleSidebarClose} />

      <SidebarToggleButton
        isMinimized={isMinimized}
        isOpen={sidebarOpen}
        onToggleMinimize={handleToggleMinimize}
        onToggleOpen={handleSidebarToggle}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <EmployeeTopHeader user={user} />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

