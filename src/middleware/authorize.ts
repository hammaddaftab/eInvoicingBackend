import { Request, Response, NextFunction } from 'express';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: { status: 401, message: 'Authentication required' } });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: { status: 403, message: 'Forbidden: Insufficient permissions' } });
      return;
    }

    next();
  };
};
