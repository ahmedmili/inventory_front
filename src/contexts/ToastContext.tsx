'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast, ToastOptions, ToastType, ToastPosition } from '@/types/toast.types';

interface ToastContextType {
  toasts: Toast[];
  showToast: (options: ToastOptions | string) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  success: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  loading: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const defaultOptions: Partial<ToastOptions> = {
  type: 'info',
  duration: 3000,
  position: 'top-right',
  showCloseButton: true,
  showProgressBar: true,
  pauseOnHover: true,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const showToast = useCallback((options: ToastOptions | string): string => {
    const toastOptions: ToastOptions =
      typeof options === 'string'
        ? { message: options }
        : options;

    const id = toastOptions.id || generateId();
    const toast: Toast = {
      ...defaultOptions,
      ...toastOptions,
      id,
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      // Éviter les doublons si un ID est fourni
      if (toastOptions.id) {
        const existingIndex = prev.findIndex((t) => t.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = toast;
          return updated;
        }
      }
      return [...prev, toast];
    });

    return id;
  }, [generateId]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((toast) => {
        if (toast.onClose) {
          toast.onClose();
        }
      });
      return [];
    });
  }, []);

  const updateToast = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, ...options } : toast))
    );
  }, []);

  const createTypeMethod = useCallback(
    (type: ToastType) =>
      (message: string, options?: Omit<ToastOptions, 'type' | 'message'>): string => {
        return showToast({ ...options, type, message });
      },
    [showToast]
  );

  const success = useCallback(createTypeMethod('success'), [createTypeMethod]);
  const error = useCallback(createTypeMethod('error'), [createTypeMethod]);
  const info = useCallback(createTypeMethod('info'), [createTypeMethod]);
  const warning = useCallback(createTypeMethod('warning'), [createTypeMethod]);
  const loading = useCallback(createTypeMethod('loading'), [createTypeMethod]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        removeAllToasts,
        success,
        error,
        info,
        warning,
        loading,
        updateToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
