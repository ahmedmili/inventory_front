'use client';

import { usePathname } from 'next/navigation';
import { navigationItems } from './navigationConfig';
import NavItem from './NavItem';

interface SidebarNavigationProps {
  onNavigate?: () => void;
}

export default function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

