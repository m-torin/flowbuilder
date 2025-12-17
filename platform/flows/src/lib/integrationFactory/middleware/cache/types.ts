// cache/types.ts
export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export interface CacheProvider {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface CacheOptions {
  enabled?: boolean;
  keyPrefix?: string;
  ttl?: number;
  serialize?: (value: unknown) => string;
  deserialize?: (value: string) => unknown;
}

