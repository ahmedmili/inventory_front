/**
 * Helper hook to integrate toast notifications with form submissions
 * 
 * Usage:
 * ```tsx
 * const { handleSubmitWithToast } = useToastForm();
 * 
 * const onSubmit = handleSubmitWithToast(
 *   async (data) => {
 *     await apiClient.post('/endpoint', data);
 *     return 'Success message';
 *   },
 *   {
 *     successMessage: 'Item created successfully!',
 *     errorMessage: 'Failed to create item',
 *     onSuccess: () => router.push('/items'),
 *   }
 * );
 * ```
 */

import { useToast } from '@/contexts/ToastContext';
import { useCallback } from 'react';

interface ToastFormOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useToastForm() {
  const toast = useToast();

  const handleSubmitWithToast = useCallback(
    <T extends any[]>(
      fn: (...args: T) => Promise<string | void>,
      options: ToastFormOptions = {},
    ) => {
      return async (...args: T) => {
        try {
          const result = await fn(...args);
          const message = result || options.successMessage || 'Operation completed successfully!';
          toast.success(message);
          options.onSuccess?.();
        } catch (error: any) {
          const message =
            error.response?.data?.message ||
            error.message ||
            options.errorMessage ||
            'An error occurred';
          toast.error(message);
          options.onError?.(error);
          throw error; // Re-throw to allow form to handle it
        }
      };
    },
    [toast],
  );

  return { handleSubmitWithToast, toast };
}

