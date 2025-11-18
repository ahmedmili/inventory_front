'use client';

import Link from 'next/link';
import { NavigationItem } from './navigationConfig';

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
}

export default function NavItem({ item, isActive, onNavigate }: NavItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`
        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <span className={`mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
        {item.icon}
      </span>
      {item.name}
    </Link>
  );
}

