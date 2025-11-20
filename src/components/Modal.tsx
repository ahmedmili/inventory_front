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
    const baseClasses = `relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all ${durationClass}`;
    
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
        className={`fixed inset-0 bg-black ${getBackdropClasses()}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={getModalClasses()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
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

