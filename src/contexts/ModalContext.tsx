'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Modal, ModalOptions, ModalType } from '@/types/modal.types';

interface ModalContextType {
  modals: Modal[];
  showModal: (options: ModalOptions | string) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  confirm: (options: Omit<ModalOptions, 'type'>) => Promise<boolean>;
  info: (options: Omit<ModalOptions, 'type'>) => string;
  success: (options: Omit<ModalOptions, 'type'>) => string;
  error: (options: Omit<ModalOptions, 'type'>) => string;
  warning: (options: Omit<ModalOptions, 'type'>) => string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const defaultOptions: Partial<ModalOptions> = {
  type: 'info',
  size: 'md',
  animation: 'scale',
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);

  const generateId = useCallback(() => {
    return `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const showModal = useCallback((options: ModalOptions | string): string => {
    const modalOptions: ModalOptions =
      typeof options === 'string'
        ? { content: options }
        : options;

    const id = modalOptions.id || generateId();
    const modal: Modal = {
      ...defaultOptions,
      ...modalOptions,
      id,
      createdAt: Date.now(),
    };

    setModals((prev) => {
      // Éviter les doublons si un ID est fourni
      if (modalOptions.id) {
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

  const confirm = useCallback(async (options: Omit<ModalOptions, 'type'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = showModal({
        ...options,
        type: 'confirm',
        onConfirm: async () => {
          if (options.onConfirm) {
            await options.onConfirm();
          }
          closeModal(id);
          resolve(true);
        },
        onClose: () => {
          if (options.onClose) {
            options.onClose();
          }
          closeModal(id);
          resolve(false);
        },
      });
    });
  }, [showModal, closeModal]);

  const createTypeMethod = useCallback(
    (type: ModalType) =>
      (options: Omit<ModalOptions, 'type'>): string => {
        return showModal({ ...options, type });
      },
    [showModal]
  );

  const info = useCallback(createTypeMethod('info'), [createTypeMethod]);
  const success = useCallback(createTypeMethod('success'), [createTypeMethod]);
  const error = useCallback(createTypeMethod('error'), [createTypeMethod]);
  const warning = useCallback(createTypeMethod('warning'), [createTypeMethod]);

  return (
    <ModalContext.Provider
      value={{
        modals,
        showModal,
        closeModal,
        closeAllModals,
        confirm,
        info,
        success,
        error,
        warning,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

