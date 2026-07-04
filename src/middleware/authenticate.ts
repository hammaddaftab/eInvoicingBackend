import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  user_id: number;
  business_id: number;
  roles: string[];
  type?: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { status: 401, message: 'Authentication required' } });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;
    
    if (decoded.type && decoded.type !== 'access') {
      res.status(401).json({ error: { status: 401, message: 'Invalid token type' } });
      return;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: { status: 401, message: 'Invalid or expired token' } });
  }
};
