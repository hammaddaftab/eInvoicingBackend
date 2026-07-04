import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: {
            status: 400,
            message: 'Validation failed',
            details: error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      } else {
        next(error);
      }
    }
  };
};
