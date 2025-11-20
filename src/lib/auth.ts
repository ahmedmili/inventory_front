import { apiClient } from './api';
import { localStorageService, LOCAL_STORAGE_KEYS } from './local-storage';

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

const persistSession = ({ accessToken, refreshToken, user }: AuthResponse) => {
  localStorageService.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorageService.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorageService.setJSON(LOCAL_STORAGE_KEYS.USER, user);

  // Set a cookie for middleware to check (7 days expiry to match refresh token)
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    document.cookie = `isAuthenticated=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
};

const clearSession = () => {
  localStorageService.clearKeys([
    LOCAL_STORAGE_KEYS.ACCESS_TOKEN,
    LOCAL_STORAGE_KEYS.REFRESH_TOKEN,
    LOCAL_STORAGE_KEYS.USER,
  ]);

  // Clear auth cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
};

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    persistSession(response.data);
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
    clearSession();
  },

  async getCurrentUser(options?: { forceRemote?: boolean }): Promise<User | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const { forceRemote = false } = options ?? {};
    const cachedUser = localStorageService.getJSON<User>(LOCAL_STORAGE_KEYS.USER);

    if (cachedUser && !forceRemote) {
      return cachedUser;
    }

    const token = localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<User>('/auth/me');
      localStorageService.setJSON(LOCAL_STORAGE_KEYS.USER, response.data);
      return response.data;
    } catch {
      clearSession();
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  },

  getToken(): string | undefined {
    return localStorageService.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) || undefined;
  },

  getStoredUser(): User | null {
    return localStorageService.getJSON<User>(LOCAL_STORAGE_KEYS.USER);
  },
};

