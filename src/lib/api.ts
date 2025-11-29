import axios, { AxiosInstance, AxiosError } from 'axios';
import { localStorageService, LOCAL_STORAGE_KEYS } from './local-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle CORS errors (no response means network/CORS error)
        if (!error.response) {
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Network Error') ||
                             error.code === 'ERR_NETWORK';
          
          if (isCorsError && typeof window !== 'undefined') {
            console.error('CORS Error:', {
              message: error.message,
              url: originalRequest?.url,
              method: originalRequest?.method,
              baseURL: API_URL,
            });
          }
          
          // Don't retry CORS errors
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized - Try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorageService.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await axios.post(
                `${API_URL}/auth/refresh`,
                { refreshToken },
                { withCredentials: true },
              );
              const { accessToken, refreshToken: newRefreshToken } = response.data;
              localStorageService.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
              if (newRefreshToken) {
                localStorageService.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
              }
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorageService.clearKeys([
              LOCAL_STORAGE_KEYS.ACCESS_TOKEN,
              LOCAL_STORAGE_KEYS.REFRESH_TOKEN,
              LOCAL_STORAGE_KEYS.USER,
            ]);
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          const data = error.response?.data as { message?: string } | undefined;
          const message = data?.message || 'You do not have permission to perform this action';
          if (typeof window !== 'undefined') {
            // Could show a toast here, but we'll let the component handle it
            console.warn('Forbidden:', message);
          }
        }

        // Handle 404 Not Found
        if (error.response?.status === 404) {
          const data = error.response?.data as { message?: string } | undefined;
          const message = data?.message || 'Resource not found';
          console.warn('Not Found:', message);
        }

        // Handle 500 Server Error
        if (error.response?.status && error.response.status >= 500) {
          const data = error.response?.data as { message?: string } | undefined;
          console.error('Server Error:', {
            status: error.response.status,
            message: data?.message,
            url: originalRequest?.url,
          });
        }

        return Promise.reject(error);
      },
    );
  }

  get instance() {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;

