'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { NavigationItem } from './navigationConfig';
import { useLoading } from '@/contexts/LoadingContext';
import { useNavigationModal } from '@/contexts/NavigationModalContext';

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
  const { showLoader } = useLoading();
  const { openModal } = useNavigationModal();
  const hasChildren = Boolean(item.children?.length);
  const paddingLeft = isMinimized ? undefined : depth * 16;

  const baseClasses = `
    w-full flex items-center text-sm font-medium rounded-lg transition-all duration-200 group relative
    ${isMinimized ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
  `;

  const activeClasses = isActive
    ? 'bg-gray-100 text-gray-900'
    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900';

  const content = (
    <div
      className={`flex items-center w-full ${isMinimized ? 'justify-center' : 'gap-3'}`}
      style={!isMinimized && paddingLeft ? { paddingLeft: `${paddingLeft}px` } : undefined}
    >
      <span className={`flex-shrink-0 flex items-center justify-center ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'} ${depth > 0 && !isMinimized ? 'scale-75' : ''}`}>
        {item.icon}
      </span>
      {!isMinimized && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {hasChildren && (
            <span
              className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </>
      )}
    </div>
  );

  const handleClick = () => {
    if (item.modalType) {
      openModal(item.modalType);
      if (onNavigate) onNavigate();
    } else if (item.href) {
      showLoader('Navigation en cours...');
      if (onNavigate) onNavigate();
    }
  };

  const row = hasChildren || (!item.href && !item.modalType) ? (
    <button
      type="button"
      onClick={onToggle}
      className={`${baseClasses} ${activeClasses}`}
    >
      {content}
      {isMinimized && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-opacity duration-200 shadow-lg">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </button>
  ) : item.modalType ? (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${activeClasses}`}
    >
      {content}
      {isMinimized && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-opacity duration-200 shadow-lg">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </button>
  ) : (
    <Link
      href={item.href!}
      onClick={handleClick}
      className={`${baseClasses} ${activeClasses}`}
    >
      {content}
      {isMinimized && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-opacity duration-200 shadow-lg">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </Link>
  );

  return (
    <div className="relative">
      {row}
      {hasChildren && !isMinimized && (
        <div
          className={`overflow-hidden transition-all duration-200 ${
            isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pl-3 pt-0.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
