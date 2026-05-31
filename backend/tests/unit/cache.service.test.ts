import { CacheService } from '../../src/infrastructure/cache/cache.service';
import { redisClient } from '../../src/config/redis';

jest.mock('../../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    jest.clearAllMocks();
  });

  describe('generateTaskListKey', () => {
    it('should generate correct cache key with all parameters', () => {
      const key = cacheService.generateTaskListKey('org123', 'user456', 1, { status: 'TODO' });
      
      expect(key).toContain('tasks:org:org123');
      expect(key).toContain('assignee:user456');
      expect(key).toContain('page:1');
    });

    it('should generate key with default values when optional params missing', () => {
      const key = cacheService.generateTaskListKey('org123');
      
      expect(key).toContain('assignee:all');
      expect(key).toContain('page:1');
      expect(key).toContain('filters:none');
    });
  });

  describe('get', () => {
    it('should return parsed data when cache hit', async () => {
      const mockData = { id: '1', title: 'Test Task' };
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await cacheService.get('test-key');

      expect(result).toEqual(mockData);
      expect(redisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when cache miss', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set data with default TTL', async () => {
      const data = { id: '1', title: 'Test Task' };
      await cacheService.set('test-key', data);

      expect(redisClient.setEx).toHaveBeenCalledWith('test-key', 300, JSON.stringify(data));
    });

    it('should set data with custom TTL', async () => {
      const data = { id: '1', title: 'Test Task' };
      await cacheService.set('test-key', data, 600);

      expect(redisClient.setEx).toHaveBeenCalledWith('test-key', 600, JSON.stringify(data));
    });
  });

  describe('delete', () => {
    it('should delete key', async () => {
      await cacheService.delete('test-key');

      expect(redisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('deletePattern', () => {
    it('should delete all matching keys', async () => {
      (redisClient.keys as jest.Mock).mockResolvedValue(['key1', 'key2', 'key3']);

      await cacheService.deletePattern('test:*');

      expect(redisClient.keys).toHaveBeenCalledWith('test:*');
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should not call del when no keys found', async () => {
      (redisClient.keys as jest.Mock).mockResolvedValue([]);

      await cacheService.deletePattern('test:*');

      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidateTaskListCache', () => {
    it('should invalidate specific assignee and all caches', async () => {
      const deletePatternSpy = jest.spyOn(cacheService, 'deletePattern');

      await cacheService.invalidateTaskListCache('org123', 'user456');

      expect(deletePatternSpy).toHaveBeenCalledWith('tasks:org:org123:assignee:user456:*');
      expect(deletePatternSpy).toHaveBeenCalledWith('tasks:org:org123:assignee:all:*');
    });

    it('should only invalidate all cache when no assigneeId', async () => {
      const deletePatternSpy = jest.spyOn(cacheService, 'deletePattern');

      await cacheService.invalidateTaskListCache('org123');

      expect(deletePatternSpy).toHaveBeenCalledTimes(1);
      expect(deletePatternSpy).toHaveBeenCalledWith('tasks:org:org123:assignee:all:*');
    });
  });
});
