'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleCode } from '@/lib/permissions';
import AdminLayout from '@/components/layouts/AdminLayout';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import LoadingScreen from '@/components/LoadingScreen';

/**
 * Shared layout - Determines which layout to use based on user role
 * Shared pages can be accessed by both admin and employee users,
 * but they get their respective sidebar and navbar
 */
export default function SharedLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect will be handled by middleware
  if (!user) {
    return <>{children}</>;
  }

  const roleCode = getUserRoleCode(user);

  // Admin or Manager should use AdminLayout (with admin sidebar/navbar)
  if (roleCode === 'ADMIN' || roleCode === 'MANAGER') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Employee or Stock Keeper should use EmployeeLayout (with employee sidebar/navbar)
  if (roleCode === 'EMPLOYEE' || roleCode === 'STOCK_KEEPER') {
    return <EmployeeLayout>{children}</EmployeeLayout>;
  }

  // Fallback: use EmployeeLayout for unknown roles
  return <EmployeeLayout>{children}</EmployeeLayout>;
}

