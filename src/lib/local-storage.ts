const isBrowser = typeof window !== 'undefined';

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'gestion_stock_access_token',
  REFRESH_TOKEN: 'gestion_stock_refresh_token',
  USER: 'gestion_stock_user',
} as const;

type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS] | string;

class LocalStorageService {
  private runSafely<T>(callback: () => T): T | null {
    if (!isBrowser) {
      return null;
    }

    try {
      return callback();
    } catch (error) {
      console.warn('[localStorageService] operation failed', error);
      return null;
    }
  }

  getItem(key: LocalStorageKey): string | null {
    return this.runSafely(() => window.localStorage.getItem(key));
  }

  setItem(key: LocalStorageKey, value: string): void {
    this.runSafely(() => {
      window.localStorage.setItem(key, value);
    });
  }

  removeItem(key: LocalStorageKey): void {
    this.runSafely(() => {
      window.localStorage.removeItem(key);
    });
  }

  clearKeys(keys: LocalStorageKey[]): void {
    this.runSafely(() => {
      keys.forEach((key) => window.localStorage.removeItem(key));
    });
  }

  setJSON<T>(key: LocalStorageKey, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }

  getJSON<T>(key: LocalStorageKey): T | null {
    const stored = this.getItem(key);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as T;
    } catch (error) {
      console.warn('[localStorageService] failed to parse JSON', error);
      this.removeItem(key);
      return null;
    }
  }
}

export const localStorageService = new LocalStorageService();


