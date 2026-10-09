/**
 * CampusOne - Safe LocalStorage Utilities
 * Wraps all localStorage reads and writes in try/catch blocks
 * to gracefully handle quota limits, privacy mode restrictions, and corrupt data.
 */

const memoryFallback = new Map<string, string>();

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // In restricted iframe or private mode, fallback to memory
  }
  return null;
}

export function safeGetItem(key: string): string | null {
  try {
    const storage = getStorage();
    if (storage) {
      return storage.getItem(key);
    }
    return memoryFallback.get(key) || null;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read key "${key}" from localStorage:`, err);
    return memoryFallback.get(key) || null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
    memoryFallback.set(key, value);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to write key "${key}" to localStorage:`, err);
    memoryFallback.set(key, value);
    return true; // Still persisted in resilient memory fallback
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(key);
    }
    memoryFallback.delete(key);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to remove key "${key}" from localStorage:`, err);
    memoryFallback.delete(key);
    return true;
  }
}

export function safeGetJson<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to parse JSON for key "${key}":`, err);
    return fallback;
  }
}

export function safeSetJson<T>(key: string, value: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[SafeStorage] Failed to serialize JSON for key "${key}":`, err);
    return false;
  }
}
