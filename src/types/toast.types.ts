import { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message?: string | ReactNode;
  duration?: number; // 0 = ne pas fermer automatiquement
  position?: ToastPosition;
  showCloseButton?: boolean;
  showProgressBar?: boolean;
  pauseOnHover?: boolean;
  actions?: ToastAction[];
  icon?: ReactNode;
  className?: string;
  onClose?: () => void;
  onClick?: () => void;
}

export interface Toast extends ToastOptions {
  id: string;
  createdAt: number;
}

