'use client';

import { useToast } from '@/contexts/ToastContext';
import ToastItem from './ToastItem';
import { ToastPosition } from '@/types/toast.types';

const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  // Grouper les toasts par position
  const toastsByPosition = toasts.reduce(
    (acc, toast) => {
      const position = toast.position || 'top-right';
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(toast);
      return acc;
    },
    {} as Record<ToastPosition, typeof toasts>
  );

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-[9999] flex flex-col gap-2 ${positionClasses[position as ToastPosition]}`}
          style={{ maxWidth: '420px' }}
        >
          {positionToasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
              onRemove={() => {}}
            />
          ))}
        </div>
      ))}
    </>
  );
}

