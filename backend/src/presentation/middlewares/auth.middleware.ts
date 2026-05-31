import { Request, Response, NextFunction } from 'express';
import { jwtService, JwtPayload } from '../../infrastructure/security/jwt.service';
import { AppError } from '../../utils/errors';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: error.statusCode,
        code: error.code,
        message: error.message,
      });
      return;
    }

    res.status(401).json({
      status: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
};
