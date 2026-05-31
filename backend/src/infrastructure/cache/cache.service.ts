import { redisClient } from '../../config/redis';
import crypto from 'crypto';

export class CacheService {
  private readonly defaultTTL = 300; // 5 minutes

  /**
   * Generate cache key for task list
   */
  generateTaskListKey(
    organizationId: string,
    assigneeId?: string,
    page?: number,
    filters?: Record<string, any>
  ): string {
    const filterHash = filters ? crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex') : 'none';
    return `tasks:org:${organizationId}:assignee:${assigneeId || 'all'}:page:${page || 1}:filters:${filterHash}`;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Invalidate task list caches for organization
   */
  async invalidateTaskListCache(organizationId: string, assigneeId?: string): Promise<void> {
    try {
      if (assigneeId) {
        // Invalidate specific assignee's cache
        await this.deletePattern(`tasks:org:${organizationId}:assignee:${assigneeId}:*`);
      }
      // Always invalidate 'all' cache
      await this.deletePattern(`tasks:org:${organizationId}:assignee:all:*`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate all task caches for organization
   */
  async invalidateAllTaskCaches(organizationId: string): Promise<void> {
    try {
      await this.deletePattern(`tasks:org:${organizationId}:*`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

export const cacheService = new CacheService();
