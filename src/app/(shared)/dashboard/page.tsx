'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleCode } from '@/lib/permissions';
import LoadingScreen from '@/components/LoadingScreen';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import EmployeeDashboard from '@/components/dashboards/EmployeeDashboard';

/**
 * Shared dashboard route that displays the appropriate dashboard
 * based on user role. The layout (AdminLayout or EmployeeLayout) is
 * determined by the (shared)/layout.tsx based on user role.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const roleCode = getUserRoleCode(user);
  
  // Render the appropriate dashboard based on role
  // The layout is already determined by (shared)/layout.tsx
  if (roleCode === 'ADMIN' || roleCode === 'MANAGER') {
    return <AdminDashboard />;
  }
  
  if (roleCode === 'EMPLOYEE' || roleCode === 'STOCK_KEEPER') {
    return <EmployeeDashboard />;
  }

  // Fallback: use employee dashboard
  return <EmployeeDashboard />;
}

