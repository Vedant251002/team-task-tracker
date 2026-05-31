import { Task, User } from '../../infrastructure/database/models';
import { Priority, TaskStatus, STATUS_TRANSITIONS, Role } from '../../domain/enums';
import { AppError } from '../../utils/errors';
import { cacheService } from '../../infrastructure/cache/cache.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

export class TaskService {
  async createTask(
    dto: CreateTaskDto,
    creatorId: string,
    organizationId: string
  ): Promise<Task> {
    // Validate assignee if provided
    if (dto.assigneeId) {
      const assignee = await User.findOne({
        where: { id: dto.assigneeId, organizationId },
      });
      if (!assignee) {
        throw new AppError('Assignee not found in organization', 404, 'ASSIGNEE_NOT_FOUND');
      }
    }

    // Validate due date
    if (dto.dueDate && new Date(dto.dueDate) < new Date()) {
      throw new AppError('Due date must be in the future', 400, 'INVALID_DUE_DATE');
    }

    const task = await Task.create({
      ...dto,
      creatorId,
      organizationId,
      status: TaskStatus.TODO,
    });

    // Invalidate cache
    await cacheService.invalidateAllTaskCaches(organizationId);

    return task;
  }

  async getTasks(
    filters: TaskFilters,
    userId: string,
    userRole: Role,
    organizationId: string
  ): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };

    // Members can only see their assigned tasks
    if (userRole === Role.MEMBER) {
      where.assigneeId = userId;
    } else if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    // Try to get from cache
    const cacheKey = cacheService.generateTaskListKey(
      organizationId,
      userRole === Role.MEMBER ? userId : filters.assigneeId,
      page,
      { status: filters.status, priority: filters.priority }
    );

    const cached = await cacheService.get<{ tasks: Task[]; total: number }>(cacheKey);
    if (cached) {
      return {
        tasks: cached.tasks,
        total: cached.total,
        page,
        totalPages: Math.ceil(cached.total / limit),
      };
    }

    // Query database
    const { count, rows } = await Task.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Cache the result
    await cacheService.set(cacheKey, { tasks: rows, total: count });

    return {
      tasks: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async getTaskById(taskId: string, userId: string, userRole: Role, organizationId: string): Promise<Task> {
    const task = await Task.findOne({
      where: { id: taskId, organizationId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Members can only view their assigned tasks
    if (userRole === Role.MEMBER && task.assigneeId !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    return task;
  }

  async updateTask(
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
    userRole: Role,
    organizationId: string
  ): Promise<Task> {
    const task = await Task.findOne({ where: { id: taskId, organizationId } });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Members can only update their assigned tasks
    if (userRole === Role.MEMBER && task.assigneeId !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    // Validate assignee if provided
    if (dto.assigneeId) {
      const assignee = await User.findOne({
        where: { id: dto.assigneeId, organizationId },
      });
      if (!assignee) {
        throw new AppError('Assignee not found in organization', 404, 'ASSIGNEE_NOT_FOUND');
      }
    }

    // Validate due date
    if (dto.dueDate && new Date(dto.dueDate) < new Date()) {
      throw new AppError('Due date must be in the future', 400, 'INVALID_DUE_DATE');
    }

    const oldAssigneeId = task.assigneeId;
    await task.update(dto);

    // Invalidate cache for both old and new assignees
    await cacheService.invalidateTaskListCache(organizationId, oldAssigneeId || undefined);
    if (dto.assigneeId && dto.assigneeId !== oldAssigneeId) {
      await cacheService.invalidateTaskListCache(organizationId, dto.assigneeId);
    }

    return task;
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
    userRole: Role,
    organizationId: string
  ): Promise<Task> {
    const task = await Task.findOne({ where: { id: taskId, organizationId } });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Only assignee or MANAGER+ can update status
    if (userRole === Role.MEMBER && task.assigneeId !== userId) {
      throw new AppError('Only the assignee can update task status', 403, 'ACCESS_DENIED');
    }

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[task.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${task.status} to ${newStatus}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Update status
    await task.update({
      status: newStatus,
      completedAt: newStatus === TaskStatus.DONE ? new Date() : (null as any),
    });

    // Invalidate cache
    await cacheService.invalidateTaskListCache(organizationId, task.assigneeId || undefined);

    return task;
  }

  async deleteTask(taskId: string, organizationId: string): Promise<void> {
    const task = await Task.findOne({ where: { id: taskId, organizationId } });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    await task.destroy();

    // Invalidate cache
    await cacheService.invalidateAllTaskCaches(organizationId);
  }
}

export const taskService = new TaskService();
