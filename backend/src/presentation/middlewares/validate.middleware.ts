import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body or query based on request method
      const dataToValidate = req.method === 'GET' ? req.query : req.body;
      const validated = schema.parse(dataToValidate);
      
      // Replace request data with validated data
      if (req.method === 'GET') {
        req.query = validated as any;
      } else {
        req.body = validated;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        });
        return;
      }
      next(error);
    }
  };
};
