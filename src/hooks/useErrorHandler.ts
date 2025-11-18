import { useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { AxiosError } from 'axios';

/**
 * Hook to handle errors consistently across the application
 */
export function useErrorHandler() {
  const toast = useToast();

  const handleError = useCallback(
    (error: unknown, defaultMessage = 'An error occurred') => {
      if (error instanceof AxiosError) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          defaultMessage;

        // Show toast notification
        toast.error(message);

        // Log error for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', {
            message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          });
        }

        return message;
      }

      if (error instanceof Error) {
        toast.error(error.message || defaultMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('Error:', error);
        }
        return error.message || defaultMessage;
      }

      toast.error(defaultMessage);
      return defaultMessage;
    },
    [toast],
  );

  const handleAsyncError = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      errorMessage?: string,
    ): Promise<[T | null, string | null]> => {
      try {
        const result = await asyncFn();
        return [result, null];
      } catch (error) {
        const message = handleError(error, errorMessage);
        return [null, message];
      }
    },
    [handleError],
  );

  return { handleError, handleAsyncError };
}

