import { useState } from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import { AxiosError } from 'axios';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response.data;
};

// Hook for GET requests with SWR
export function useApi<T>(url: string | null, options?: { revalidateOnFocus?: boolean }) {
  const { data, error, isLoading, mutate } = useSWR<T, AxiosError>(
    url,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnReconnect: true,
      shouldRetryOnError: (error) => {
        // Don't retry on 401/403 errors
        return error.response?.status !== 401 && error.response?.status !== 403;
      },
    }
  );

  return {
    data,
    error,
    loading: isLoading,
    mutate, // For manual revalidation
  };
}

// Hook for POST/PUT/DELETE operations
export function useApiMutation<TData = any, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const mutate = async (
    url: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: TVariables
  ): Promise<TData | null> => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (method) {
        case 'POST':
          response = await apiClient.post<TData>(url, data || {});
          break;
        case 'PUT':
          // For PUT requests, always send data (even if empty object)
          // Some servers/CORS configs require a body for PUT requests
          response = await apiClient.put<TData>(url, data !== undefined ? data : {});
          break;
        case 'PATCH':
          // For PATCH requests, always send data (even if empty object)
          // Some servers/CORS configs require a body for PATCH requests
          response = await apiClient.patch<TData>(url, data !== undefined ? data : {});
          break;
        case 'DELETE':
          response = await apiClient.delete<TData>(url);
          break;
      }
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError);
      
      // Log CORS errors for debugging
      if (!axiosError.response && typeof window !== 'undefined') {
        console.error('Network/CORS Error:', {
          url,
          method,
          error: axiosError.message,
          code: axiosError.code,
        });
      }
      
      throw axiosError;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

