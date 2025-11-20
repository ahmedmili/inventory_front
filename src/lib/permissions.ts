import { User, Role, Permission } from './auth';

/**
 * Get user's role code
 */
export function getUserRoleCode(user: User | null): string | null {
  if (!user || !user.role) {
    return null;
  }

  if (typeof user.role === 'string') {
    return user.role;
  }

  return user.role.code || null;
}

/**
 * Get user's permissions as array of permission codes
 */
export function getUserPermissions(user: User | null): string[] {
  if (!user || !user.role) {
    return [];
  }

  // If role is just a string, we don't have permissions
  if (typeof user.role === 'string') {
    return [];
  }

  if (!user.role.permissions || !Array.isArray(user.role.permissions)) {
    return [];
  }

  return user.role.permissions
    .map((rp) => rp.permission?.code)
    .filter((code): code is string => Boolean(code));
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) {
    return false;
  }

  const permissions = getUserPermissions(user);
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }

  const userPermissions = getUserPermissions(user);
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }

  const userPermissions = getUserPermissions(user);
  return permissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, roleCode: string): boolean {
  const userRoleCode = getUserRoleCode(user);
  return userRoleCode === roleCode;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roleCodes: string[]): boolean {
  if (!user || roleCodes.length === 0) {
    return false;
  }

  const userRoleCode = getUserRoleCode(user);
  return userRoleCode ? roleCodes.includes(userRoleCode) : false;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null;
}

/**
 * Check access based on requirements
 */
export interface AccessRequirements {
  requireAuth?: boolean;
  requireRoles?: string[];
  requirePermissions?: string[];
  requireAllPermissions?: boolean; // If true, requires ALL permissions; if false, requires ANY
}

export function hasAccess(user: User | null, requirements: AccessRequirements): boolean {
  // Check authentication requirement
  if (requirements.requireAuth !== false) {
    if (!isAuthenticated(user)) {
      return false;
    }
  }

  // Check role requirements
  if (requirements.requireRoles && requirements.requireRoles.length > 0) {
    if (!hasAnyRole(user, requirements.requireRoles)) {
      return false;
    }
  }

  // Check permission requirements
  if (requirements.requirePermissions && requirements.requirePermissions.length > 0) {
    const requireAll = requirements.requireAllPermissions ?? false;
    if (requireAll) {
      if (!hasAllPermissions(user, requirements.requirePermissions)) {
        return false;
      }
    } else {
      if (!hasAnyPermission(user, requirements.requirePermissions)) {
        return false;
      }
    }
  }

  return true;
}

