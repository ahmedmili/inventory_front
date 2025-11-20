import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAccess, AccessRequirements } from '@/lib/permissions';

/**
 * Hook to protect routes programmatically
 * Returns whether the user has access and handles redirect
 */
export function useRouteGuard(
  requirements?: AccessRequirements,
  redirectTo: string = '/login'
): { hasAccess: boolean; loading: boolean } {
  const { user, loading } = useAuth();
  const router = useRouter();

  const accessRequirements: AccessRequirements = requirements || { requireAuth: true };
  const userHasAccess = hasAccess(user, accessRequirements);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!userHasAccess) {
      router.push(redirectTo);
    }
  }, [userHasAccess, loading, redirectTo, router]);

  return {
    hasAccess: userHasAccess,
    loading,
  };
}

