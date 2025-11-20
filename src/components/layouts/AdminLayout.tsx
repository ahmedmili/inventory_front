'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '../sidebars/AdminSidebar';
import SidebarOverlay from '../SidebarOverlay';
import AdminTopHeader from '../headers/AdminTopHeader';
import MainContent from '../MainContent';
import LoadingScreen from '../LoadingScreen';
import SidebarToggleButton from '../SidebarToggleButton';
import { localStorageService } from '@/lib/local-storage';
import { getUserRoleCode } from '@/lib/permissions';
import { useMedia } from '@/hooks/useMedia';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_MINIMIZED_KEY = 'sidebar-minimized';

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { isDesktop } = useMedia();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorageService.getItem(SIDEBAR_MINIMIZED_KEY);
    const isDesktopWidth = window.innerWidth >= 1024;
    // On mobile/tablet, start with sidebar closed (not minimized)
    if (saved === null) {
      return isDesktopWidth;
    }
    // On mobile/tablet, don't use minimized state
    if (!isDesktopWidth) {
      return false;
    }
    return saved === 'true';
  });

  // Handle window resize to adjust sidebar state
  useEffect(() => {
    if (!isDesktop) {
      // On mobile/tablet, close sidebar and don't minimize
      setSidebarOpen(false);
      setIsMinimized(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user is admin or manager (admin-level access)
      const roleCode = getUserRoleCode(user);
      if (roleCode !== 'ADMIN' && roleCode !== 'MANAGER') {
        // Redirect non-admin users - they should not access admin routes
        // This should rarely happen since (admin) route group should be protected
        router.push('/login');
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
    if (isDesktop) {
      // On desktop: toggle minimize state
      setIsMinimized((prev) => !prev);
    } else {
      // On mobile/tablet: toggle sidebar open/close
      setSidebarOpen((prev) => !prev);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        user={user}
        onLogout={handleLogout}
        isMinimized={isMinimized}
        onToggleMinimize={handleToggleMinimize}
        onToggleOpen={handleSidebarToggle}
      />

      <SidebarOverlay isOpen={sidebarOpen} onClose={handleSidebarClose} />

      <SidebarToggleButton
        isMinimized={isMinimized}
        isOpen={sidebarOpen}
        onToggleMinimize={handleToggleMinimize}
        onToggleOpen={handleSidebarToggle}
      />

      <div 
        className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300 lg:ml-0"
        style={{
          marginLeft: isDesktop && (isMinimized ? '5rem' : '16rem')
        }}
      >
        <AdminTopHeader user={user} />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

