'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAccess, AccessRequirements } from '@/lib/permissions';
import LoadingScreen from '../LoadingScreen';

interface RouteGuardProps {
  children: React.ReactNode;
  requirements?: AccessRequirements;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route Guard Component
 * Protects routes based on authentication, roles, and permissions
 */
export default function RouteGuard({
  children,
  requirements = { requireAuth: true },
  fallback,
  redirectTo = '/login',
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasAccess(user, requirements)) {
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [user, loading, requirements, redirectTo, router]);

  // Show loading while checking auth
  if (loading) {
    return fallback || <LoadingScreen />;
  }

  // Check access
  if (!hasAccess(user, requirements)) {
    return fallback || null;
  }

  return <>{children}</>;
}

