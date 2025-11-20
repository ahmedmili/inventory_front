# Route Guards & Permission System

This directory contains components and utilities for protecting routes based on authentication, roles, and permissions.

## Components

### RouteGuard

A component that wraps pages to protect them based on access requirements.

**Usage:**

```tsx
import RouteGuard from '@/components/guards/RouteGuard';

export default function ProductsPage() {
  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requirePermissions: ['products.read'],
      }}
    >
      <Layout>
        {/* Your page content */}
      </Layout>
    </RouteGuard>
  );
}
```

**Props:**

- `requirements`: Access requirements object
  - `requireAuth?: boolean` - Require authentication (default: true)
  - `requireRoles?: string[]` - Required role codes (e.g., ['ADMIN', 'MANAGER'])
  - `requirePermissions?: string[]` - Required permission codes (e.g., ['products.read'])
  - `requireAllPermissions?: boolean` - If true, requires ALL permissions; if false, requires ANY (default: false)
- `fallback?: ReactNode` - Custom component to show when access is denied (default: null)
- `redirectTo?: string` - Redirect URL when access is denied (default: '/login')

## Hooks

### useRouteGuard

A hook for programmatic route protection.

**Usage:**

```tsx
import { useRouteGuard } from '@/hooks/useRouteGuard';

export default function ProductsPage() {
  const { hasAccess, loading } = useRouteGuard({
    requirePermissions: ['products.read'],
  });

  if (loading) return <LoadingScreen />;
  if (!hasAccess) return null;

  return <Layout>{/* Your content */}</Layout>;
}
```

## Permission Utilities

### hasPermission

Check if user has a specific permission.

```tsx
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  if (hasPermission(user, 'products.create')) {
    return <button>Create Product</button>;
  }
  return null;
}
```

### hasRole

Check if user has a specific role.

```tsx
import { hasRole } from '@/lib/permissions';

if (hasRole(user, 'ADMIN')) {
  // Admin-only content
}
```

### hasAccess

Check access based on requirements object.

```tsx
import { hasAccess } from '@/lib/permissions';

const canAccess = hasAccess(user, {
  requireAuth: true,
  requireRoles: ['ADMIN'],
  requirePermissions: ['users.read'],
});
```

## Navigation Filtering

The sidebar automatically filters navigation items based on user permissions. Configure requirements in `navigationConfig.tsx`:

```tsx
{
  name: 'Products',
  href: '/products',
  requirePermissions: ['products.read'],
}
```

## Middleware

The `middleware.ts` file handles basic authentication checks at the edge. It redirects unauthenticated users to login but doesn't check permissions (that's handled by RouteGuard components).

## Example: Protected Page

```tsx
'use client';

import RouteGuard from '@/components/guards/RouteGuard';
import Layout from '@/components/Layout';

export default function UsersPage() {
  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requirePermissions: ['users.read'],
      }}
    >
      <Layout>
        <div>Users content</div>
      </Layout>
    </RouteGuard>
  );
}
```

## Example: Admin-Only Page

```tsx
'use client';

import RouteGuard from '@/components/guards/RouteGuard';
import Layout from '@/components/Layout';

export default function AdminPage() {
  return (
    <RouteGuard
      requirements={{
        requireAuth: true,
        requireRoles: ['ADMIN'],
        requirePermissions: ['users.read'],
      }}
      redirectTo="/dashboard"
    >
      <Layout>
        <div>Admin content</div>
      </Layout>
    </RouteGuard>
  );
}
```

