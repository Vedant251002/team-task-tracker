import { Request, Response, NextFunction } from 'express';
import { taskService } from '../../application/services/task.service';

export class TaskController {
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(`
        
        
        
        
        
        `)
      const task = await taskService.createTask(
        req.body,
        req.user!.userId,
        req.user!.organizationId
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.getTasks(
        req.query as any,
        req.user!.userId,
        req.user!.role,
        req.user!.organizationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getTaskById(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        req.user!.organizationId
      );
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateTask(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role,
        req.user!.organizationId
      );
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateTaskStatus(
        req.params.id,
        req.body.status,
        req.user!.userId,
        req.user!.role,
        req.user!.organizationId
      );
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.deleteTask(req.params.id, req.user!.organizationId);
      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
