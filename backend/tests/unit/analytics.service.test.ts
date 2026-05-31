import { AnalyticsService } from '../../src/application/services/analytics.service';
import { Task } from '../../src/infrastructure/database/models';

jest.mock('../../src/infrastructure/database/models');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks grouped by user', async () => {
      const mockTasks = [
        {
          id: '1',
          assigneeId: 'user1',
          get: jest.fn().mockReturnValue({ name: 'User 1', email: 'user1@test.com' }),
        },
        {
          id: '2',
          assigneeId: 'user1',
          get: jest.fn().mockReturnValue({ name: 'User 1', email: 'user1@test.com' }),
        },
        {
          id: '3',
          assigneeId: 'user2',
          get: jest.fn().mockReturnValue({ name: 'User 2', email: 'user2@test.com' }),
        },
      ];
      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await analyticsService.getOverdueTasks('org123');

      expect(result).toHaveLength(2);
      expect(result[0].overdueCount).toBe(2);
      expect(result[1].overdueCount).toBe(1);
      expect(result[0].userId).toBe('user1');
    });

    it('should return empty array when no overdue tasks', async () => {
      (Task.findAll as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getOverdueTasks('org123');

      expect(result).toEqual([]);
    });
  });

  describe('getAverageCompletionTime', () => {
    it('should calculate average completion time', async () => {
      const mockTasks = [
        { completionDays: '5' },
        { completionDays: '3' },
        { completionDays: '7' },
      ];
      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await analyticsService.getAverageCompletionTime('org123');

      expect(result.totalCompletedTasks).toBe(3);
      expect(result.averageCompletionDays).toBe(5);
    });

    it('should return zero when no completed tasks', async () => {
      (Task.findAll as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getAverageCompletionTime('org123');

      expect(result.totalCompletedTasks).toBe(0);
      expect(result.averageCompletionDays).toBe(0);
    });
  });
});
