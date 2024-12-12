// middleware/cache/middleware.ts
import { createHash } from 'crypto';
import {
  Middleware,
  MiddlewareContext,
  createMiddleware,
  MiddlewareOptions,
} from '../base';
import type { CacheOptions, CacheProvider, CacheMetadata } from './types';

const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 300, // 5 minutes
  keyPrefix: 'sdk:cache:',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  keyGenerator: (context) => {
    const data = `${context.operation}:${JSON.stringify(context.metadata)}`;
    return createHash('sha256').update(data).digest('hex');
  },
};

export const createCacheMiddleware = (
  provider: CacheProvider,
  options: CacheOptions & MiddlewareOptions = {},
): Middleware => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const getCacheKey = (context: MiddlewareContext): string => {
    const key = opts.keyGenerator!(context);
    return `${opts.keyPrefix}${key}`;
  };

  return createMiddleware(async (context, next) => {
    const cacheKey = getCacheKey(context);
    const startTime = Date.now();

    try {
      // Check cache
      const cached = await provider.get(cacheKey);
      if (cached) {
        return {
          data: opts.deserialize!(cached),
          duration: Date.now() - startTime,
          metadata: {
            cache: {
              hit: true,
              key: cacheKey,
              ttl: opts.ttl,
            } as CacheMetadata,
          },
        };
      }

      // Execute operation
      const result = await next();

      // Cache successful results
      if (!result.error && result.data) {
        await provider.set(cacheKey, opts.serialize!(result.data), opts.ttl);
      }

      return {
        ...result,
        metadata: {
          ...result.metadata,
          cache: {
            hit: false,
            key: cacheKey,
            ttl: opts.ttl,
          } as CacheMetadata,
        },
      };
    } catch (error) {
      // Don't fail operation if cache fails
      return next();
    }
  }, options);
};
