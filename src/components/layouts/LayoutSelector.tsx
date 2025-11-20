'use client';

import { usePathname } from 'next/navigation';
import LoadingScreen from '../LoadingScreen';

interface LayoutSelectorProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication or role-based layout
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * LayoutSelector - Just passes through children
 * Each route group ((admin), (employee), (shared)) has its own layout
 * that handles the sidebar and navbar for that specific role
 */
export default function LayoutSelector({ children }: LayoutSelectorProps) {
  const pathname = usePathname();

  // If it's a public route, render without layout
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  // For all other routes, just pass through
  // The route group layouts will handle the actual layout (sidebar, navbar, etc.)
  return <>{children}</>;
}

