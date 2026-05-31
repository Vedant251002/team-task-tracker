import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../../utils/errors';

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', error);

  const errorData = errorResponse(error);
  res.status(errorData.status).json(errorData);
};
