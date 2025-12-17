// cache/middleware.ts
import {
  Middleware,
  MiddlewareContext,
  MiddlewareResult,
  createMiddleware,
} from '../base';
import { CacheProvider, CacheOptions, CacheEntry } from './types';

export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const generateCacheKey = (
  prefix: string,
  operation: string,
  context: MiddlewareContext,
): string => {
  const parts = [prefix, operation];
  if (context.metadata && Object.keys(context.metadata).length > 0) {
    const metadataHash = JSON.stringify(context.metadata);
    parts.push(metadataHash);
  }
  return parts.join(':');
};

export const createCacheMiddleware = (
  provider: CacheProvider = new MemoryCacheProvider(),
  options: CacheOptions = {},
): Middleware => {
  const {
    enabled = true,
    keyPrefix = 'cache',
    ttl = 300000, // 5 minutes default
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  return createMiddleware(
    async (context: MiddlewareContext, next) => {
      if (!enabled) {
        return next();
      }

      const cacheKey = generateCacheKey(keyPrefix, context.operation, context);

      // Try to get from cache
      const cached = await provider.get(cacheKey);
      if (cached) {
        return {
          data: cached.value,
          metadata: {
            ...context.metadata,
            cacheHit: true,
            cacheKey,
          },
          duration: Date.now() - context.startTime,
        };
      }

      // Cache miss - execute operation
      const result = await next();

      // Store result in cache if successful
      if (result.data && !result.error) {
        try {
          await provider.set(cacheKey, result.data, ttl);
        } catch (error) {
          // Cache write failures shouldn't fail the operation
          console.warn('Failed to write to cache:', error);
        }
      }

      return {
        ...result,
        metadata: {
          ...result.metadata,
          cacheHit: false,
          cacheKey,
        },
      };
    },
    { enabled },
  );
};

