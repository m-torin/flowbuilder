import { CacheProvider } from './types';

// middleware/cache/index.ts
export type { CacheOptions, CacheProvider, CacheMetadata } from './types';
export { createCacheMiddleware } from './middleware';

// Optional memory cache provider implementation
export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, { value: string; expires: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl = 300): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
