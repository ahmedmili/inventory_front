'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { NavigationItem } from './navigationConfig';

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
  isMinimized?: boolean;
  depth?: number;
  children?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function NavItem({
  item,
  isActive,
  onNavigate,
  isMinimized = false,
  depth = 0,
  children,
  isExpanded = false,
  onToggle,
}: NavItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const paddingLeft = isMinimized ? undefined : 16 + depth * 12;

  const sharedClasses = `
    w-full text-sm font-medium rounded-lg transition-all duration-200 group relative
    ${isMinimized ? 'justify-center px-3 py-3' : 'py-3 pr-3'}
    ${isActive ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
  `;

  const content = (
    <div
      className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}
      style={!isMinimized ? { paddingLeft } : undefined}
    >
      <span className={`${isActive ? 'text-primary-600' : 'text-gray-400'}`}>{item.icon}</span>
      {!isMinimized && <span className="flex-1">{item.name}</span>}
      {hasChildren && !isMinimized && (
        <span
          className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
      {isMinimized && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  );

  const row = hasChildren || !item.href ? (
    <button
      type="button"
      onClick={onToggle}
      className={sharedClasses}
    >
      {content}
    </button>
  ) : (
    <Link href={item.href} onClick={onNavigate} className={sharedClasses}>
      {content}
    </Link>
  );

  return (
    <div>
      {row}
      {hasChildren && !isMinimized && (
        <div
          className={`ml-4 border-l border-gray-100 pl-3 overflow-hidden transition-all duration-200 ${
            isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

