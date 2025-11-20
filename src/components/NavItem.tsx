'use client';

import Link from 'next/link';
import { NavigationItem } from './navigationConfig';

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
  isMinimized?: boolean;
}

export default function NavItem({ item, isActive, onNavigate, isMinimized = false }: NavItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`
        flex items-center text-sm font-medium rounded-lg transition-all duration-200 group relative
        ${isMinimized ? 'px-3 py-3 justify-center' : 'px-4 py-3'}
        ${isActive
          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
      title={isMinimized ? item.name : undefined}
    >
      <span className={`${isMinimized ? '' : 'mr-3'} ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
        {item.icon}
      </span>
      {!isMinimized && (
        <span>{item.name}</span>
      )}
      {isMinimized && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </Link>
  );
}

