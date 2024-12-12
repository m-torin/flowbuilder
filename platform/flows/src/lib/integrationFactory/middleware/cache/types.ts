// middleware/cache/types.ts
import type { MiddlewareContext } from '../base';

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  keyGenerator?: (context: MiddlewareContext) => string;
  serialize?: (data: unknown) => string;
  deserialize?: (data: string) => unknown;
}

export interface CacheProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface CacheMetadata {
  hit: boolean;
  key: string;
  ttl?: number;
}
