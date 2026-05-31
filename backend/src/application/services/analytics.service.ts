import { Task, User } from '../../infrastructure/database/models';
import { TaskStatus } from '../../domain/enums';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';

export interface OverdueTasksAnalytics {
  userId: string;
  userName: string;
  userEmail: string;
  overdueCount: number;
}

export interface CompletionTimeAnalytics {
  averageCompletionDays: number;
  totalCompletedTasks: number;
}

export class AnalyticsService {
  async getOverdueTasks(organizationId: string): Promise<OverdueTasksAnalytics[]> {
    const overdueTasks = await Task.findAll({
      where: {
        organizationId,
        status: {
          [Op.notIn]: [TaskStatus.DONE],
        },
        dueDate: {
          [Op.lt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Group by user
    const userMap = new Map<string, OverdueTasksAnalytics>();

    overdueTasks.forEach((task) => {
      if (task.assigneeId) {
        const assignee = task.get('assignee') as any;
        if (!userMap.has(task.assigneeId)) {
          userMap.set(task.assigneeId, {
            userId: task.assigneeId,
            userName: assignee?.name || 'Unknown',
            userEmail: assignee?.email || 'Unknown',
            overdueCount: 0,
          });
        }
        const userData = userMap.get(task.assigneeId)!;
        userData.overdueCount++;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.overdueCount - a.overdueCount);
  }

  async getAverageCompletionTime(organizationId: string): Promise<CompletionTimeAnalytics> {
    const completedTasks = await Task.findAll({
      where: {
        organizationId,
        status: TaskStatus.DONE,
        completedAt: {
          [Op.not]: null as any,
        },
      },
      attributes: [
        'createdAt',
        'completedAt',
        [
          sequelize.literal(
            'EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400'
          ),
          'completionDays',
        ],
      ],
      raw: true,
    });

    if (completedTasks.length === 0) {
      return {
        averageCompletionDays: 0,
        totalCompletedTasks: 0,
      };
    }

    const totalDays = completedTasks.reduce((sum, task: any) => {
      return sum + parseFloat(task.completionDays || 0);
    }, 0);

    return {
      averageCompletionDays: parseFloat((totalDays / completedTasks.length).toFixed(2)),
      totalCompletedTasks: completedTasks.length,
    };
  }
}

export const analyticsService = new AnalyticsService();
