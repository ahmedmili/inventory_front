'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Modal, ModalOptions, ModalType } from '@/types/modal.types';

interface ModalContextType {
  modals: Modal[];
  showModal: (options: ModalOptions) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  info: (options: Omit<ModalOptions, 'type'>) => string;
  success: (options: Omit<ModalOptions, 'type'>) => string;
  error: (options: Omit<ModalOptions, 'type'>) => string;
  warning: (options: Omit<ModalOptions, 'type'>) => string;
  confirm: (options: Omit<ModalOptions, 'type'> & { onConfirm: () => void | Promise<void> }) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const defaultOptions: Partial<ModalOptions> = {
  type: 'info',
  size: 'md',
  animation: 'scale',
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);

  const generateId = useCallback(() => {
    return `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const showModal = useCallback((options: ModalOptions): string => {
    const id = options.id || generateId();
    const modal: Modal = {
      ...defaultOptions,
      ...options,
      id,
      createdAt: Date.now(),
    };

    setModals((prev) => {
      // Éviter les doublons si un ID est fourni
      if (options.id) {
        const existingIndex = prev.findIndex((m) => m.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = modal;
          return updated;
        }
      }
      return [...prev, modal];
    });

    return id;
  }, [generateId]);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals((prev) => {
      prev.forEach((modal) => {
        if (modal.onClose) {
          modal.onClose();
        }
      });
      return [];
    });
  }, []);

  const createTypeMethod = useCallback(
    (type: ModalType) =>
      (options: Omit<ModalOptions, 'type'>): string => {
        return showModal({ ...options, type });
      },
    [showModal]
  );

  const confirm = useCallback(
    async (options: Omit<ModalOptions, 'type'> & { onConfirm: () => void | Promise<void> }): Promise<boolean> => {
      return new Promise((resolve) => {
        const id = showModal({
          ...options,
          type: 'confirm',
          onConfirm: async () => {
            await options.onConfirm();
            closeModal(id);
            resolve(true);
          },
          onClose: () => {
            closeModal(id);
            resolve(false);
          },
        });
      });
    },
    [showModal, closeModal]
  );

  const value: ModalContextType = {
    modals,
    showModal,
    closeModal,
    closeAllModals,
    info: createTypeMethod('info'),
    success: createTypeMethod('success'),
    error: createTypeMethod('error'),
    warning: createTypeMethod('warning'),
    confirm,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
