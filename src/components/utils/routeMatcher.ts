import { NavigationItem } from '../navigationConfig';

export function isRouteActive(pathname: string, item: NavigationItem): boolean {
  if (!item.href) {
    return false;
  }

  if (item.exact) {
    return pathname === item.href;
  }

  // Exact match
  if (pathname === item.href) {
    return true;
  }

  return false;
}

export function isItemActive(pathname: string, item: NavigationItem, depth: number = 0): boolean {
  // First check if this exact item matches
  const isExactMatch = isRouteActive(pathname, item);
  
  // If item has children, check if any child is active
  if (item.children?.length) {
    const hasActiveChild = item.children.some((child) => isItemActive(pathname, child, depth + 1));
    
    // If a child is active, parent should also be marked as active
    // This ensures both parent and child are highlighted when a child route is selected
    if (hasActiveChild) {
      return true;
    }
    
    // If no child is active, check if parent itself is an exact match
    return isExactMatch;
  }

  // For items without children, only mark as active if exact match
  return isExactMatch;
}

/**
 * Check if any child (or descendant) of an item is active
 * This is used to determine if an accordion should be expanded
 */
export function hasActiveChild(pathname: string, item: NavigationItem): boolean {
  if (!item.children?.length) {
    return false;
  }

  // Check if any child or descendant is active
  return item.children.some((child) => {
    // Check if child itself is active
    if (isRouteActive(pathname, child)) {
      return true;
    }
    // Recursively check children
    return hasActiveChild(pathname, child);
  });
}

