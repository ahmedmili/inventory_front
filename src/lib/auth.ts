import Cookies from 'js-cookie';
import { apiClient } from './api';

export interface Permission {
  id: string;
  code: string;
  description?: string | null;
}

export interface RolePermission {
  id: string;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  permissions?: RolePermission[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: Role | string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    const { accessToken, refreshToken, user } = response.data;
    Cookies.set('accessToken', accessToken, { expires: 1 });
    Cookies.set('refreshToken', refreshToken, { expires: 7 });
    return response.data;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<void> {
    await apiClient.post('/auth/register', data);
  },

  async logout(): Promise<void> {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('accessToken');
  },

  getToken(): string | undefined {
    return Cookies.get('accessToken');
  },
};

