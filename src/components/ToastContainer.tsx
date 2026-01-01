'use client';

import { useToast } from '@/contexts/ToastContext';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts
        .filter((toast) => {
          const validTypes = ['success', 'error', 'info', 'warning'] as const;
          return typeof toast.message === 'string' && 
                 toast.type && 
                 validTypes.includes(toast.type as typeof validTypes[number]);
        })
        .map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message as string}
            type={(toast.type || 'info') as 'success' | 'error' | 'info' | 'warning'}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
    </div>
  );
}

