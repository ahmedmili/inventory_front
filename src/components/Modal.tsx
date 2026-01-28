'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type AnimationType = 'fade' | 'slide' | 'scale' | 'slide-up' | 'slide-down' | 'zoom' | 'none';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  animation?: AnimationType;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  showCloseButton = true,
  animation = 'scale',
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const animationDuration = animation === 'none' ? 0 : 200;
  const durationClass = animation === 'none' ? '' : 'duration-200';

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (animation !== 'none') {
        // Trigger animation after render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimating(true);
          });
        });
      } else {
        setIsAnimating(true);
      }
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      if (animation !== 'none') {
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, animationDuration);
        document.body.style.overflow = 'unset';
        return () => clearTimeout(timer);
      } else {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, animation, animationDuration]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  // Animation classes based on animation type
  const getBackdropClasses = () => {
    if (animation === 'none') return isAnimating ? 'opacity-50' : 'opacity-0';
    return `transition-opacity ${durationClass} ${isAnimating ? 'opacity-50' : 'opacity-0'}`;
  };

  const getModalClasses = () => {
    const baseClasses = `relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all ${durationClass} border border-gray-200/50 ring-1 ring-black/5`;
    
    if (animation === 'none') {
      return `${baseClasses} ${isAnimating ? 'opacity-100' : 'opacity-0'}`;
    }

    const animationClasses: Record<Exclude<AnimationType, 'none'>, { enter: string; exit: string }> = {
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

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md ${getBackdropClasses()}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={getModalClasses()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with enhanced styling */}
          <div className="relative flex items-center justify-between px-6 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200/80 rounded-t-xl shadow-sm">
            {/* Decorative accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl"></div>
            
            <h3 className="text-xl font-bold text-gray-900 tracking-tight ml-1">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="group relative text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Close modal"
                title="Fermer"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90"
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

          {/* Content with enhanced styling */}
          <div className="px-6 py-6 max-h-[calc(100vh-220px)] overflow-y-auto bg-white rounded-b-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            {children}
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

