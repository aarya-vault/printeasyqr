// Client-side storage utilities with type safety
interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

class SafeStorage {
  private isAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getStorage(type: 'localStorage' | 'sessionStorage'): Storage | null {
    return this.isAvailable(type) ? window[type] : null;
  }

  set<T>(key: string, value: T, expiryMs?: number, useSession = false): boolean {
    try {
      const storage = this.getStorage(useSession ? 'sessionStorage' : 'localStorage');
      if (!storage) return false;

      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiryMs ? Date.now() + expiryMs : undefined
      };

      storage.setItem(key, JSON.stringify(item));
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, useSession = false): T | null {
    try {
      const storage = this.getStorage(useSession ? 'sessionStorage' : 'localStorage');
      if (!storage) return null;

      const stored = storage.getItem(key);
      if (!stored) return null;

      const item: StorageItem<T> = JSON.parse(stored);
      
      // Check expiry
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key, useSession);
        return null;
      }

      return item.value;
    } catch {
      return null;
    }
  }

  remove(key: string, useSession = false): boolean {
    try {
      const storage = this.getStorage(useSession ? 'sessionStorage' : 'localStorage');
      if (!storage) return false;

      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(useSession = false): boolean {
    try {
      const storage = this.getStorage(useSession ? 'sessionStorage' : 'localStorage');
      if (!storage) return false;

      storage.clear();
      return true;
    } catch {
      return false;
    }
  }

  // Get all keys with a prefix
  getKeysWithPrefix(prefix: string, useSession = false): string[] {
    try {
      const storage = this.getStorage(useSession ? 'sessionStorage' : 'localStorage');
      if (!storage) return [];

      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }

  // Clean expired items
  cleanExpired(useSession = false): number {
    let cleaned = 0;
    try {
      const storage = this.getStorage(useSession ? 'sessionStorage' : 'localStorage');
      if (!storage) return 0;

      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;

        try {
          const stored = storage.getItem(key);
          if (!stored) continue;

          const item: StorageItem<any> = JSON.parse(stored);
          if (item.expiry && Date.now() > item.expiry) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        storage.removeItem(key);
        cleaned++;
      });
    } catch {
      // Ignore errors
    }

    return cleaned;
  }
}

export const storage = new SafeStorage();

// Specific storage keys for the application
export const STORAGE_KEYS = {
  USER_SESSION: 'printeasy_user_session',
  THEME_PREFERENCE: 'printeasy_theme',
  SHOP_FILTERS: 'printeasy_shop_filters',
  ORDER_DRAFTS: 'printeasy_order_drafts',
  NOTIFICATION_PREFERENCES: 'printeasy_notifications',
  RECENT_SEARCHES: 'printeasy_recent_searches'
} as const;