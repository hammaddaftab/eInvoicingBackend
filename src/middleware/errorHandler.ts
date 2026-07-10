import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    // Intentional business error
    res.status(err.status).json({
      error: {
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  } else {
    // Unexpected crash
    console.error('Unexpected Error:', err);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }
};
