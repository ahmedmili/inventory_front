import { ReactNode } from 'react';
import {
  ChevronRight,
  UsersIcon,
  BoxIcon,
  FolderIcon,
  ArrowsIcon,
  CartIcon,
  SalesIcon,
  BuildingIcon,
  WarehouseIcon,
  ReportIcon,
  DashboardIcon,
  ReservationIcon,
  BellIcon,
  ImportIcon,
} from './icons';

export interface NavigationItem {
  name: string;
  href?: string;
  icon: ReactNode;
  exact?: boolean;
  children?: NavigationItem[];
  modalType?: 'suppliers'; // Type of modal to open instead of navigating
  // Access control
  requireAuth?: boolean; // Default: true
  requireRoles?: string[]; // Role codes (e.g., ['ADMIN', 'MANAGER'])
  requirePermissions?: string[]; // Permission codes (e.g., ['users.read'])
  requireAllPermissions?: boolean; // If true, requires ALL permissions; if false, requires ANY (default: false)
}

export const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    exact: true,
    requireAuth: true,
    requireRoles: ['ADMIN'],

    icon: <DashboardIcon />,
  },
  {
    name: 'Utilisateurs',
    icon: <UsersIcon />,
    href: '/users',
    requirePermissions: ['users.read'],
    children: [
      // {
      //   name: 'Vue globale',
      //   href: '/users',
      //   icon: <ChevronRight />,
      //   requirePermissions: ['users.read'],
      // },
      {
        name: 'Administrateurs',
        href: '/users/admins',
        icon: <ChevronRight />,
        requireRoles: ['ADMIN'],
        requirePermissions: ['users.read'],
      },
      {
        name: 'Employés',
        href: '/users/employees',
        icon: <ChevronRight />,
        requirePermissions: ['users.read'],
      },
    ],
  },
  {
    name: 'Catalogue',
    icon: <FolderIcon />,
    requirePermissions: ['products.read', 'categories.read', 'suppliers.read'],
    requireAllPermissions: false, // Show if user has ANY of these permissions
    children: [
      {
        name: 'Produits',
        href: '/products',
        icon: <BoxIcon />,
        requirePermissions: ['products.read'],
      },
      // {
      //   name: 'Catégories',
      //   href: '/categories',
      //   icon: <ChevronRight />,
      //   requireRoles: ['ADMIN'],
      //   requirePermissions: ['categories.read'],
      // },
      {
        name: 'Fournisseurs',
        href: '/suppliers',
        icon: <BuildingIcon />,
        requireRoles: ['ADMIN'],
        requirePermissions: ['suppliers.read'],
      },
      // {
      //   name: 'Clients',
      //   href: '/customers',
      //   icon: <UsersIcon />,
      //   requireRoles: ['ADMIN'],
      //   requirePermissions: ['customers.read'],
      // },
    ],
  },
  {
    name: 'Opérations',
    icon: <ArrowsIcon />,
    requirePermissions: ['stock.read', 'purchases.read', 'sales.read', 'imports.read'],
    requireAllPermissions: false,
    children: [
      {
        name: 'Mouvements de stock',
        href: '/movements',
        icon: <ArrowsIcon />,
        requirePermissions: ['stock.read'],
      },
      {
        name: 'Importations',
        href: '/imports',
        icon: <ImportIcon />,
        requireRoles: ['ADMIN'],
        requirePermissions: ['imports.read'],
      },
      // {
      //   name: 'Achats',
      //   href: '/purchases',
      //   icon: <CartIcon />,
      //   requireRoles: ['ADMIN'],
      //   requirePermissions: ['purchases.read'],
      // },
      // {
      //   name: 'Ventes',
      //   href: '/sales',
      //   icon: <SalesIcon />,
      //   requireRoles: ['ADMIN'],
      //   requirePermissions: ['sales.read'],
      // },
    ],
  },
  // {
  //   name: 'Logistique',
  //   icon: <WarehouseIcon />,
  //   requireRoles: ['ADMIN'],
  //   requirePermissions: ['warehouses.read', 'customers.read'],
  //   requireAllPermissions: false,
  //   children: [
  //     {
  //       name: 'Entrepôts',
  //       href: '/warehouses',
  //       icon: <WarehouseIcon />,
  //       requirePermissions: ['warehouses.read'],
  //     },
    
  //   ],
  // },
  {
    name: 'Projets',
    href: '/projects',
    icon: <FolderIcon />,
    requirePermissions: ['projects.read'],
  },
  {
    name: 'Réservations',
    href: '/reservations',
    icon: <ReservationIcon />,
    requirePermissions: ['reservations.read', 'reservations.create'],
    requireAllPermissions: false, // Show if user has ANY reservation permission
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: <BellIcon />,
    requirePermissions: ['notifications.read'],
  },
  {
    name: 'Rapports',
    href: '/reports',
    icon: <ReportIcon />,
    requirePermissions: ['reports.read'],
  },
  {
    name: 'Rôles & Permissions',
    href: '/roles',
    icon: <UsersIcon />,
    requireRoles: ['ADMIN'],
    requirePermissions: ['roles.manage'],
  },
];

