import { TaskService } from '../../src/application/services/task.service';
import { Task, User } from '../../src/infrastructure/database/models';
import { TaskStatus, Priority } from '../../src/domain/enums';
import { AppError } from '../../src/utils/errors';
import { cacheService } from '../../src/infrastructure/cache/cache.service';

jest.mock('../../src/infrastructure/database/models');
jest.mock('../../src/infrastructure/cache/cache.service');

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create task and invalidate cache', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: Priority.HIGH,
      };

      const mockTask = { id: '1', ...taskData, organizationId: 'org123', creatorId: 'user123' };
      (Task.create as jest.Mock).mockResolvedValue(mockTask);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await taskService.createTask(taskData, 'user123', 'org123');

      expect(result).toEqual(mockTask);
      expect(Task.create).toHaveBeenCalled();
      expect(cacheService.invalidateAllTaskCaches).toHaveBeenCalledWith('org123');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update status with valid transition', async () => {
      const mockTask = {
        id: '1',
        status: TaskStatus.TODO,
        organizationId: 'org123',
        assigneeId: 'user123',
        update: jest.fn().mockResolvedValue(true),
      };
      (Task.findOne as jest.Mock).mockResolvedValue(mockTask);

      await taskService.updateTaskStatus('1', TaskStatus.IN_PROGRESS, 'user123', 'MEMBER' as any, 'org123');

      expect(mockTask.update).toHaveBeenCalled();
      expect(cacheService.invalidateTaskListCache).toHaveBeenCalled();
    });

    it('should throw error for invalid transition', async () => {
      const mockTask = {
        id: '1',
        status: TaskStatus.TODO,
        organizationId: 'org123',
        assigneeId: 'user123',
      };
      (Task.findOne as jest.Mock).mockResolvedValue(mockTask);

      await expect(
        taskService.updateTaskStatus('1', TaskStatus.DONE, 'user123', 'MEMBER' as any, 'org123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error when task not found', async () => {
      (Task.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        taskService.updateTaskStatus('999', TaskStatus.IN_PROGRESS, 'user123', 'MEMBER' as any, 'org123')
      ).rejects.toThrow('Task not found');
    });
  });
});
