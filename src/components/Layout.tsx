'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import SidebarOverlay from './SidebarOverlay';
import TopHeader from './TopHeader';
import MainContent from './MainContent';
import LoadingScreen from './LoadingScreen';
import { localStorageService } from '@/lib/local-storage';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_MINIMIZED_KEY = 'sidebar-minimized';

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorageService.getItem(SIDEBAR_MINIMIZED_KEY);
    // Default to minimized on desktop, expanded on mobile
    if (saved === null) {
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    }
    return saved === 'true';
  });

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
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
    setIsMinimized((prev) => !prev);
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        user={user}
        onLogout={handleLogout}
        isMinimized={isMinimized}
        onToggleMinimize={handleToggleMinimize}
      />

      <SidebarOverlay isOpen={sidebarOpen && !isMinimized} onClose={handleSidebarClose} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onMenuClick={handleSidebarToggle} user={user} />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

