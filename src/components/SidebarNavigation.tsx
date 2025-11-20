'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { navigationItems, NavigationItem } from './navigationConfig';
import NavItem from './NavItem';
import { isItemActive } from './utils/routeMatcher';
import { useAuth } from '@/contexts/AuthContext';
import { hasAccess, AccessRequirements } from '@/lib/permissions';

interface SidebarNavigationProps {
  onNavigate?: () => void;
  isMinimized?: boolean;
}

type ExpandedState = Record<string, boolean>;

const getItemKey = (item: NavigationItem, depth: number) =>
  item.href ?? `${item.name}-${depth}`;

/**
 * Filter navigation items based on user permissions
 */
function filterNavigationItems(
  items: NavigationItem[],
  user: ReturnType<typeof useAuth>['user']
): NavigationItem[] {
  return items
    .map((item) => {
      // Check if user has access to this item
      const requirements: AccessRequirements = {
        requireAuth: item.requireAuth !== false, // Default to true
        requireRoles: item.requireRoles,
        requirePermissions: item.requirePermissions,
        requireAllPermissions: item.requireAllPermissions,
      };

      if (!hasAccess(user, requirements)) {
        return null;
      }

      // Filter children if they exist
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterNavigationItems(item.children, user);
        // Only show parent if it has at least one visible child or has its own href
        if (filteredChildren.length === 0 && !item.href) {
          return null;
        }
        return {
          ...item,
          children: filteredChildren,
        };
      }

      return item;
    })
    .filter((item): item is NavigationItem => item !== null);
}

export default function SidebarNavigation({ onNavigate, isMinimized = false }: SidebarNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Filter navigation items based on permissions
  const filteredItems = filterNavigationItems(navigationItems, user);

  const renderItems = (items: NavigationItem[], depth = 0) =>
    items.map((item) => {
      const key = getItemKey(item, depth);
      const hasChildren = Boolean(item.children?.length);
      const active = isItemActive(pathname, item);
      const shouldBeExpanded = expanded[key];
      const fallbackExpanded = hasChildren && active;
      const isExpanded = hasChildren ? (shouldBeExpanded ?? fallbackExpanded) : false;

      return (
        <NavItem
          key={key}
          item={item}
          depth={depth}
          isActive={active}
          isExpanded={hasChildren ? isExpanded : undefined}
          onToggle={
            hasChildren
              ? () =>
                  setExpanded((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
              : undefined
          }
          onNavigate={onNavigate}
          isMinimized={isMinimized}
        >
          {hasChildren && isExpanded && !isMinimized && (
            <div className="space-y-1">{renderItems(item.children!, depth + 1)}</div>
          )}
        </NavItem>
      );
    });

  return (
    <nav className={`flex-1 py-6 space-y-1 overflow-y-auto ${isMinimized ? 'px-2' : 'px-4'}`}>
      {renderItems(filteredItems)}
    </nav>
  );
}

