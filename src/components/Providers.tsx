'use client';

import { SWRConfig } from 'swr';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/toast/ToastContainer';
import { ModalProvider } from '@/contexts/ModalContext';
import ModalContainer from '@/components/modal/ModalContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import GlobalLoader from '@/components/GlobalLoader';

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
            <ModalProvider>
              <LoadingProvider>
                <RealtimeProvider>
                  {children}
                  <ToastContainer />
                  <ModalContainer />
                  <GlobalLoader />
                </RealtimeProvider>
              </LoadingProvider>
            </ModalProvider>
          </ToastProvider>
        </AuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  );
}

