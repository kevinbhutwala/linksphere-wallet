/**
 * High-Performance Synchronous Storage Layer (MMKV Interface)
 * 
 * Provides zero-latency synchronous reads and writes to disk,
 * preventing UI thread stutter, frame drops, and async race conditions.
 */

type ListenerCallback = (key: string) => void;

class SynchronousStorage {
  private memoryCache: Map<string, string> = new Map();
  private listeners: Set<ListenerCallback> = new Set();
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    this.loadInitialStorage();
  }

  private loadInitialStorage(): void {
    if (this.isBrowser) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('mmkv:')) {
            const rawKey = key.replace('mmkv:', '');
            const val = window.localStorage.getItem(key);
            if (val !== null) {
              this.memoryCache.set(rawKey, val);
            }
          }
        }
      } catch (e) {
        console.warn('Storage initialization fallback to memory:', e);
      }
    }
  }

  private notifyListeners(key: string): void {
    this.listeners.forEach((callback) => {
      try {
        callback(key);
      } catch (err) {
        console.error('Error in storage listener', err);
      }
    });
  }

  public setString(key: string, value: string): void {
    this.memoryCache.set(key, value);
    if (this.isBrowser) {
      try {
        window.localStorage.setItem(`mmkv:${key}`, value);
      } catch (e) {
        console.warn('Sync write error to disk', e);
      }
    }
    this.notifyListeners(key);
  }

  public getString(key: string): string | undefined {
    return this.memoryCache.get(key);
  }

  public setNumber(key: string, value: number): void {
    this.setString(key, String(value));
  }

  public getNumber(key: string): number | undefined {
    const raw = this.getString(key);
    if (raw === undefined) return undefined;
    const num = Number(raw);
    return isNaN(num) ? undefined : num;
  }

  public setBoolean(key: string, value: boolean): void {
    this.setString(key, value ? 'true' : 'false');
  }

  public getBoolean(key: string): boolean | undefined {
    const raw = this.getString(key);
    if (raw === undefined) return undefined;
    return raw === 'true';
  }

  public delete(key: string): void {
    this.memoryCache.delete(key);
    if (this.isBrowser) {
      try {
        window.localStorage.removeItem(`mmkv:${key}`);
      } catch (e) {
        console.warn('Sync delete error', e);
      }
    }
    this.notifyListeners(key);
  }

  public getAllKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  public clearAll(): void {
    const keys = Array.from(this.memoryCache.keys());
    this.memoryCache.clear();
    if (this.isBrowser) {
      keys.forEach((key) => {
        try {
          window.localStorage.removeItem(`mmkv:${key}`);
        } catch (_) {}
      });
    }
    keys.forEach((key) => this.notifyListeners(key));
  }

  public addOnValueChangedListener(listener: ListenerCallback): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Helper to dump all current entries for diagnostics inspector
   */
  public dumpState(): Record<string, string> {
    const output: Record<string, string> = {};
    this.memoryCache.forEach((value, key) => {
      output[key] = value;
    });
    return output;
  }
}

export const storage = new SynchronousStorage();
