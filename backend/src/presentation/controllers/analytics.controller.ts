import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../../application/services/analytics.service';

export class AnalyticsController {
  async getOverdueTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getOverdueTasks(req.user!.organizationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAverageCompletionTime(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getAverageCompletionTime(req.user!.organizationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
