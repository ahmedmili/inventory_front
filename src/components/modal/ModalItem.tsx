'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Modal, ModalAnimation, ModalSize } from '@/types/modal.types';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '../toast/icons';

interface ModalItemProps {
  modal: Modal;
  onClose: () => void;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

const typeIcons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  confirm: ExclamationCircleIcon,
  custom: null,
};

const typeColors = {
  success: {
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
    button: 'bg-green-600 hover:bg-green-700',
  },
  error: {
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    button: 'bg-red-600 hover:bg-red-700',
  },
  info: {
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  warning: {
    icon: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  confirm: {
    icon: 'text-orange-600',
    iconBg: 'bg-orange-100',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  custom: {
    icon: 'text-gray-600',
    iconBg: 'bg-gray-100',
    button: 'bg-gray-600 hover:bg-gray-700',
  },
};

export default function ModalItem({ modal, onClose }: ModalItemProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const animation = modal.animation || 'scale';
  const animationDuration = animation === 'none' ? 0 : 200;
  const durationClass = animation === 'none' ? '' : 'duration-200';

  useEffect(() => {
    setShouldRender(true);
    if (animation !== 'none') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(true);
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [animation]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.closeOnEscape !== false) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [shouldRender, modal.closeOnEscape]);

  const handleClose = () => {
    setIsAnimating(false);
    if (animation !== 'none') {
      setTimeout(() => {
        setShouldRender(false);
        onClose();
      }, animationDuration);
    } else {
      setShouldRender(false);
      onClose();
    }
    document.body.style.overflow = 'unset';
  };

  const handleBackdropClick = () => {
    if (modal.closeOnBackdrop !== false && !isDragging) {
      handleClose();
    }
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!modal.draggable) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.closest('[data-modal-container]')?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !modal.draggable) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Limiter le déplacement dans la fenêtre
    const maxX = window.innerWidth - 300; // Largeur minimale de la modal
    const maxY = window.innerHeight - 200; // Hauteur minimale de la modal

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging && modal.draggable) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = 'none'; // Empêcher la sélection de texte pendant le drag

      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, modal.draggable, dragOffset]);

  const handleActionClick = async (action: NonNullable<typeof modal.actions>[0], index: number) => {
    setActionLoading((prev) => ({ ...prev, [index]: true }));
    try {
      await action.onClick();
    } finally {
      setActionLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  if (!shouldRender) return null;

  const modalType = modal.type || 'info';
  const Icon = modal.icon ? null : typeIcons[modalType];
  const colors = typeColors[modalType];
  const size = modal.size || 'md';

  const getBackdropClasses = () => {
    if (animation === 'none') return isAnimating ? 'opacity-50' : 'opacity-0';
    return `transition-opacity ${durationClass} ${isAnimating ? 'opacity-50' : 'opacity-0'}`;
  };

  const getModalClasses = () => {
    const baseClasses = `relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full ${sizeClasses[size]} transform transition-all ${durationClass} border border-gray-200/40 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm ${modal.className || ''}`;

    if (animation === 'none') {
      return `${baseClasses} ${isAnimating ? 'opacity-100' : 'opacity-0'}`;
    }

    const animationClasses: Record<Exclude<ModalAnimation, 'none'>, { enter: string; exit: string }> = {
      fade: {
        enter: 'opacity-100',
        exit: 'opacity-0',
      },
      slide: {
        enter: 'opacity-100 translate-x-0',
        exit: 'opacity-0 translate-x-full',
      },
      scale: {
        enter: 'opacity-100 scale-100 translate-y-0',
        exit: 'opacity-0 scale-95 translate-y-4',
      },
      'slide-up': {
        enter: 'opacity-100 translate-y-0',
        exit: 'opacity-0 translate-y-8',
      },
      'slide-down': {
        enter: 'opacity-100 translate-y-0',
        exit: 'opacity-0 -translate-y-8',
      },
      zoom: {
        enter: 'opacity-100 scale-100',
        exit: 'opacity-0 scale-75',
      },
    };

    const anim = animationClasses[animation];
    return `${baseClasses} ${isAnimating ? anim.enter : anim.exit}`;
  };

  const renderContent = (): ReactNode => {
    if (modal.content) {
      return typeof modal.content === 'string' ? (
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{modal.content}</p>
      ) : (
        modal.content
      );
    }
    return null;
  };

  const renderFooter = (): ReactNode => {
    if (modal.footer) {
      return modal.footer;
    }

    if (modal.type === 'confirm' && modal.onConfirm) {
      return (
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-200/60 dark:border-gray-700/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={modal.loading}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white dark:hover:from-gray-700 dark:hover:to-gray-800 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {modal.cancelText || 'Annuler'}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (modal.onConfirm) {
                setActionLoading({ confirm: true });
                try {
                  await modal.onConfirm();
                  handleClose();
                } finally {
                  setActionLoading({ confirm: false });
                }
              }
            }}
            disabled={modal.loading || actionLoading.confirm}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${colors.button}`}
          >
            {modal.loading || actionLoading.confirm ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {modal.confirmText || 'Confirmation...'}
              </span>
            ) : (
              modal.confirmText || 'Confirmer'
            )}
          </button>
        </div>
      );
    }

    if (modal.actions && modal.actions.length > 0) {
      return (
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-200/60 dark:border-gray-700/50">
          {modal.actions.map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleActionClick(action, index)}
              disabled={action.loading || actionLoading[index]}
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
                ${
                  action.style === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : action.style === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              {action.loading || actionLoading[index] ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {action.label}
                </span>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop with enhanced blur and gradient */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-xl ${getBackdropClasses()}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={getModalClasses()}
          onClick={(e) => e.stopPropagation()}
          data-modal-container
          style={
            modal.draggable && (position.x !== 0 || position.y !== 0)
              ? {
                  position: 'absolute',
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'none',
                  margin: 0,
                }
              : undefined
          }
        >
          {/* Header */}
          {(modal.title || modal.showCloseButton !== false) && (
            <div
              className={`relative flex items-center justify-between px-6 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50/80 dark:from-gray-800 dark:via-gray-900/80 dark:to-gray-800 border-b border-gray-200/80 dark:border-gray-700/50 rounded-t-2xl overflow-hidden ${
                modal.draggable ? 'cursor-move select-none' : ''
              }`}
              onMouseDown={modal.draggable ? handleDragStart : undefined}
            >
              {/* Decorative accent line with shimmer effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] [background-size:20px_20px]"></div>
              
              <div className="relative flex items-center gap-3 flex-1">
                {Icon && (
                  <div className={`flex-shrink-0 h-10 w-10 ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ${colors.icon.replace('text-', 'ring-')}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                )}
                {modal.icon && <div className="flex-shrink-0">{modal.icon}</div>}
                {modal.title && (
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                    {modal.title}
                  </h3>
                )}
              </div>
              {modal.showCloseButton !== false && (
                <button
                  onClick={handleClose}
                  className="group relative flex-shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 active:bg-white dark:active:bg-gray-700 rounded-xl p-2.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 shadow-sm hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  aria-label="Close modal"
                  title="Fermer"
                >
                  <XMarkIcon className="w-5 h-5 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`px-6 py-6 max-h-[calc(100vh-220px)] overflow-y-auto bg-gradient-to-b from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-900/30 rounded-b-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${modal.contentClassName || ''}`}>
            {renderContent()}
            {renderFooter()}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

