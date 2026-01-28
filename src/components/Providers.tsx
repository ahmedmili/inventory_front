'use client';

import { SWRConfig } from 'swr';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/toast/ToastContainer';
import { ModalProvider } from '@/contexts/ModalContext';
import ModalContainer from '@/components/modal/ModalContainer';
import { NavigationModalProvider } from '@/contexts/NavigationModalContext';
import NavigationModalContainer from '@/components/navigation/NavigationModalContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import GlobalLoader from '@/components/GlobalLoader';
import EnvLogger from '@/components/EnvLogger';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <EnvLogger />
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
              <NavigationModalProvider>
                <LoadingProvider>
                  <RealtimeProvider>
                    {children}
                    <ToastContainer />
                    <ModalContainer />
                    <NavigationModalContainer />
                    <GlobalLoader />
                  </RealtimeProvider>
                </LoadingProvider>
              </NavigationModalProvider>
            </ModalProvider>
          </ToastProvider>
        </AuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  );
}

