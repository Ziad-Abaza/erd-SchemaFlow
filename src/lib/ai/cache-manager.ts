/**
 * Cache Manager - Intelligent caching for AI responses
 * Reduces redundant API calls and improves response times
 */

import { CachedResponse } from './types';
import { contextManager } from './context-manager';

export class CacheManager {
  private memoryCache: Map<string, CachedResponse> = new Map();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
  private readonly MAX_CACHE_SIZE = 100; // Maximum cached items
  private readonly CACHE_KEY_PREFIX = 'ai_cache_';

  /**
   * Get cached response if available and valid
   */
  get(key: string): any | null {
    const cacheKey = this.createCacheKey(key);
    const cached = this.memoryCache.get(cacheKey);

    if (!cached) {
      // Try localStorage as fallback
      return this.getFromStorage(cacheKey);
    }

    // Check if expired
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.memoryCache.delete(cacheKey);
      this.removeFromStorage(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache with TTL
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const cacheKey = this.createCacheKey(key);
    const contextHash = contextManager.createContextHash(data);
    
    const cached: CachedResponse = {
      data,
      timestamp: Date.now(),
      ttl,
      hash: contextHash
    };

    // Manage cache size
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.memoryCache.set(cacheKey, cached);
    
    // Also store in localStorage for persistence (only in browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cached));
      } catch (e) {
        // localStorage might be full or unavailable
        console.warn('Failed to cache in localStorage:', e);
      }
    }
  }

  /**
   * Create cache key from request context
   */
  createCacheKey(context: any): string {
    if (typeof context === 'string') {
      return `${this.CACHE_KEY_PREFIX}${context}`;
    }
    
    const hash = contextManager.createContextHash(context);
    return `${this.CACHE_KEY_PREFIX}${hash}`;
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    const cacheKey = this.createCacheKey(key);
    const cached = this.memoryCache.get(cacheKey);
    
    if (cached && Date.now() <= cached.timestamp + cached.ttl) {
      return true;
    }

    // Check localStorage
    return this.hasInStorage(cacheKey);
  }

  /**
   * Clear cache
   */
  clear(pattern?: string): void {
    if (pattern) {
      // Clear matching keys
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
          this.removeFromStorage(key);
        }
      }
    } else {
      // Clear all
      this.memoryCache.clear();
      this.clearStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const cached of this.memoryCache.values()) {
      if (now <= cached.timestamp + cached.ttl) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.memoryCache.size,
      valid,
      expired,
      hitRate: 0 // Would need to track hits/misses
    };
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.removeFromStorage(oldestKey);
    }
  }

  /**
   * Get from localStorage
   */
  private getFromStorage(key: string): any | null {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const cached: CachedResponse = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > cached.timestamp + cached.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      // Restore to memory cache
      this.memoryCache.set(key, cached);
      return cached.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if exists in localStorage
   */
  private hasInStorage(key: string): boolean {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return false;

      const cached: CachedResponse = JSON.parse(item);
      return Date.now() <= cached.timestamp + cached.ttl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Remove from localStorage
   */
  private removeFromStorage(key: string): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Clear localStorage cache
   */
  private clearStorage(): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // Ignore
    }
  }
}

export const cacheManager = new CacheManager();

