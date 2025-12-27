'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { Toast } from '@/types/toast.types';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from './icons';

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
  onRemove: () => void;
}

const icons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  loading: ArrowPathIcon,
};

const colors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-500 dark:text-green-400',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-800',
    icon: 'text-red-500 dark:text-red-400',
    progress: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500 dark:text-blue-400',
    progress: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-500 dark:text-yellow-400',
    progress: 'bg-yellow-500',
  },
  loading: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-800 dark:text-gray-200',
    icon: 'text-gray-500 dark:text-gray-400',
    progress: 'bg-gray-500',
  },
};

export default function ToastItem({ toast, onClose, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration || 0);

  const colorScheme = colors[toast.type || 'info'];
  const Icon = toast.icon ? () => <>{toast.icon}</> : icons[toast.type || 'info'];

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10);

    // Gestion de la durée et de la barre de progression
    if (toast.duration && toast.duration > 0) {
      remainingTimeRef.current = toast.duration;
      startTimeRef.current = Date.now();

      const updateProgress = () => {
        if (isPaused || !toast.showProgressBar) return;

        const elapsed = Date.now() - startTimeRef.current;
        const remaining = remainingTimeRef.current - elapsed;
        const percentage = Math.max(0, (remaining / toast.duration!) * 100);

        setProgress(percentage);

        if (remaining <= 0) {
          handleClose();
        }
      };

      progressRef.current = setInterval(updateProgress, 50);

      timerRef.current = setTimeout(() => {
        if (!isPaused) {
          handleClose();
        }
      }, toast.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = remainingTimeRef.current - elapsed;
        clearTimeout(timerRef.current);
      }
    } else if (toast.duration && toast.duration > 0 && remainingTimeRef.current > 0) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        handleClose();
      }, remainingTimeRef.current);
    }
  }, [isPaused]);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onClose();
      onRemove();
    }, 300); // Durée de l'animation de sortie
  };

  const handleMouseEnter = () => {
    if (toast.pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (toast.pauseOnHover) {
      setIsPaused(false);
    }
  };

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
    }
  };

  return (
    <div
      className={`
        relative min-w-[300px] max-w-md rounded-lg shadow-lg border transition-all duration-300 ease-in-out
        ${colorScheme.bg} ${colorScheme.border}
        ${isVisible && !isRemoving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${toast.onClick ? 'cursor-pointer' : ''}
        ${toast.className || ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icône */}
          <div className={`flex-shrink-0 ${colorScheme.icon}`}>
            {toast.type === 'loading' ? (
              <ArrowPathIcon className="h-6 w-6 animate-spin" />
            ) : (
              <Icon className="h-6 w-6" />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className={`text-sm font-semibold mb-1 ${colorScheme.text}`}>
                {toast.title}
              </h4>
            )}
            <div className={`text-sm ${colorScheme.text}`}>
              {typeof toast.message === 'string' ? (
                <p>{toast.message}</p>
              ) : (
                toast.message
              )}
            </div>

            {/* Actions */}
            {toast.actions && toast.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {toast.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                      ${
                        action.style === 'primary'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : action.style === 'danger'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton de fermeture */}
          {toast.showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className={`
                flex-shrink-0 p-1 rounded-md transition-colors
                ${colorScheme.text} hover:bg-black/5 dark:hover:bg-white/10
              `}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {toast.showProgressBar && toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-black/5 dark:bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${colorScheme.progress} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

