export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorResponse = (error: any) => {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    };
  }

  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      status: 400,
      code: 'DUPLICATE_ERROR',
      message: 'Resource already exists',
      details: error.errors.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      status: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      status: 401,
      code: 'TOKEN_EXPIRED',
      message: 'Token expired',
    };
  }

  // Default error
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  };
};
