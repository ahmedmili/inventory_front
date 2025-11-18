'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import SidebarOverlay from './SidebarOverlay';
import TopHeader from './TopHeader';
import MainContent from './MainContent';
import LoadingScreen from './LoadingScreen';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

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
      />

      <SidebarOverlay isOpen={sidebarOpen} onClose={handleSidebarClose} />

      <div className="flex-1 flex flex-col lg:ml-0">
        <TopHeader onMenuClick={handleSidebarToggle} user={user} />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

