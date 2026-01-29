'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ModalTemplate, { ModalVariant, ModalSize, AnimationType } from './modal/ModalTemplate';

export type { ModalVariant, ModalSize, AnimationType };

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  animation?: AnimationType;
  icon?: React.ReactNode;
  variant?: ModalVariant;
  headerClassName?: string;
  contentClassName?: string;
  className?: string;
  closeOnBackdrop?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  showCloseButton = true,
  animation = 'scale',
  icon,
  variant = 'default',
  headerClassName = '',
  contentClassName = '',
  className = '',
  closeOnBackdrop = true,
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const animationDuration = animation === 'none' ? 0 : 200;

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

  // Wrap ModalTemplate with animation wrapper
  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with enhanced blur and gradient */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-xl transition-opacity ${animation === 'none' ? '' : 'duration-200'} ${isAnimating ? 'opacity-50' : 'opacity-0'}`}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={`relative bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full ${sizeClasses[size]} transform transition-all ${animation === 'none' ? '' : 'duration-200'} border border-gray-200/40 ring-1 ring-black/5 backdrop-blur-sm ${className} ${
            animation === 'none' 
              ? (isAnimating ? 'opacity-100' : 'opacity-0')
              : animation === 'scale'
              ? (isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4')
              : animation === 'fade'
              ? (isAnimating ? 'opacity-100' : 'opacity-0')
              : animation === 'slide'
              ? (isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full')
              : animation === 'slide-up'
              ? (isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')
              : animation === 'slide-down'
              ? (isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8')
              : animation === 'zoom'
              ? (isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
              : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalTemplate
            isOpen={true}
            onClose={onClose}
            title={title}
            variant={variant}
            size={size}
            animation={animation}
            showCloseButton={showCloseButton}
            icon={icon}
            headerClassName={headerClassName}
            contentClassName={contentClassName}
            className=""
            closeOnBackdrop={false}
            renderWrapper={false}
          >
            {children}
          </ModalTemplate>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

