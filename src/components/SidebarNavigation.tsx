'use client';

import { usePathname } from 'next/navigation';
import { navigationItems } from './navigationConfig';
import NavItem from './NavItem';
import { isRouteActive } from './utils/routeMatcher';

interface SidebarNavigationProps {
  onNavigate?: () => void;
  isMinimized?: boolean;
}

export default function SidebarNavigation({ onNavigate, isMinimized = false }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={`flex-1 py-6 space-y-1 overflow-y-auto ${isMinimized ? 'px-2' : 'px-4'}`}>
      {navigationItems.map((item) => {
        const isActive = isRouteActive(pathname, item);
        return (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive}
            onNavigate={onNavigate}
            isMinimized={isMinimized}
          />
        );
      })}
    </nav>
  );
}

