'use client';

import { ReactNode } from 'react';

export type ModalVariant = 
  | 'default' 
  | 'form' 
  | 'info' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'confirm'
  | 'custom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type AnimationType = 'fade' | 'slide' | 'scale' | 'slide-up' | 'slide-down' | 'zoom' | 'none';

interface ModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: ModalVariant;
  size?: ModalSize;
  animation?: AnimationType;
  showCloseButton?: boolean;
  icon?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  className?: string;
  closeOnBackdrop?: boolean;
  renderWrapper?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

const variantConfig: Record<ModalVariant, {
  accentGradient: string;
  headerBg: string;
  iconBg: string;
  iconColor: string;
  defaultIcon: ReactNode;
}> = {
  default: {
    accentGradient: 'from-blue-500 via-indigo-500 to-purple-500',
    headerBg: 'from-gray-50 via-white to-gray-50/80',
    iconBg: 'from-blue-500 to-indigo-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  form: {
    accentGradient: 'from-blue-500 via-indigo-500 to-purple-500',
    headerBg: 'from-blue-50/50 via-white to-blue-50/30',
    iconBg: 'from-blue-500 to-indigo-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  info: {
    accentGradient: 'from-blue-400 via-blue-500 to-cyan-500',
    headerBg: 'from-blue-50 via-white to-blue-50/80',
    iconBg: 'from-blue-500 to-cyan-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    accentGradient: 'from-green-400 via-green-500 to-emerald-500',
    headerBg: 'from-green-50 via-white to-green-50/80',
    iconBg: 'from-green-500 to-emerald-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    accentGradient: 'from-red-400 via-red-500 to-rose-500',
    headerBg: 'from-red-50 via-white to-red-50/80',
    iconBg: 'from-red-500 to-rose-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    accentGradient: 'from-yellow-400 via-amber-500 to-orange-500',
    headerBg: 'from-amber-50 via-white to-amber-50/80',
    iconBg: 'from-amber-500 to-orange-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  confirm: {
    accentGradient: 'from-orange-400 via-orange-500 to-red-500',
    headerBg: 'from-orange-50 via-white to-orange-50/80',
    iconBg: 'from-orange-500 to-red-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  custom: {
    accentGradient: 'from-gray-400 via-gray-500 to-gray-600',
    headerBg: 'from-gray-50 via-white to-gray-50/80',
    iconBg: 'from-gray-500 to-gray-600',
    iconColor: 'text-white',
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
};

export default function ModalTemplate({
  isOpen,
  onClose,
  title,
  children,
  variant = 'default',
  size = 'lg',
  animation = 'scale',
  showCloseButton = true,
  icon,
  headerClassName = '',
  contentClassName = '',
  className = '',
  closeOnBackdrop = true,
  renderWrapper = true,
}: ModalTemplateProps) {
  const config = variantConfig[variant];

  if (!isOpen) return null;

  const content = (
    <>
          {/* Header */}
          <div className={`relative flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-br ${config.headerBg} border-b border-gray-200/80 rounded-t-2xl overflow-hidden ${headerClassName}`}>
            {/* Decorative accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accentGradient}`}></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] [background-size:20px_20px]"></div>
            
            <div className="relative flex items-center gap-3 flex-1">
              {/* Icon container */}
              {icon ? (
                <div className="flex-shrink-0">
                  {icon}
                </div>
              ) : (
                <div className={`flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ${config.iconColor}`}>
                  {config.defaultIcon}
                </div>
              )}
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {title}
              </h3>
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="group relative flex-shrink-0 text-gray-400 hover:text-gray-700 hover:bg-white/80 active:bg-white rounded-xl p-2.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 shadow-sm hover:shadow-md border border-transparent hover:border-gray-200"
                aria-label="Close modal"
                title="Fermer"
              >
                <svg
                  className="w-5 h-5 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

      {/* Content */}
      <div className={`px-4 sm:px-6 py-4 sm:py-6 max-h-[min(100vh-12rem,calc(100vh-220px))] overflow-y-auto bg-gradient-to-b from-white to-gray-50/30 rounded-b-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${contentClassName}`}>
        {children}
      </div>
    </>
  );

  if (!renderWrapper) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-xl opacity-50"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={`relative bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full ${sizeClasses[size]} border border-gray-200/40 ring-1 ring-black/5 backdrop-blur-sm ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
