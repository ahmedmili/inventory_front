'use client';

import { SWRConfig } from 'swr';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SWRConfig
        value={{
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
          shouldRetryOnError: (error) => {
            // Don't retry on 401/403 errors
            return error.response?.status !== 401 && error.response?.status !== 403;
          },
          onError: (error) => {
            // Log errors for monitoring
            if (error.response?.status >= 500) {
              console.error('Server error:', error);
            }
          },
        }}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  );
}

