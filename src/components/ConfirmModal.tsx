'use client';

import Modal from './Modal';
import { TrashIcon } from './icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      iconBg: 'bg-red-100',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      iconBg: 'bg-yellow-100',
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = typeStyles[type];
  const defaultTitle = 
    type === 'danger' ? 'Confirmer la suppression définitive' :
    type === 'warning' ? 'Confirmer la suppression' :
    'Confirmer l\'action';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || defaultTitle} size="md" animation="scale">
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 ${styles.iconBg} rounded-xl p-3.5 shadow-sm`}>
            {type === 'danger' ? (
              <TrashIcon className={`w-6 h-6 ${styles.icon}`} />
            ) : type === 'warning' ? (
              <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm leading-6 text-gray-700 whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button} ${
              type === 'danger' ? 'focus:ring-red-500' :
              type === 'warning' ? 'focus:ring-yellow-500' :
              'focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Suppression...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

