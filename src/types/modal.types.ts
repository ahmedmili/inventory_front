import { ReactNode } from 'react';

export type ModalType = 'info' | 'success' | 'error' | 'warning' | 'confirm' | 'custom';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalAnimation = 'fade' | 'slide' | 'scale' | 'slide-up' | 'slide-down' | 'zoom' | 'none';

export interface ModalAction {
  label: string;
  onClick: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export interface ModalOptions {
  id?: string;
  type?: ModalType;
  title?: string | ReactNode;
  content?: string | ReactNode;
  size?: ModalSize;
  animation?: ModalAnimation;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  actions?: ModalAction[];
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  onClose?: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
  loading?: boolean;
  draggable?: boolean;
}

export interface Modal extends ModalOptions {
  id: string;
  createdAt: number;
}

