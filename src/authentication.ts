import * as express from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './utils/AppError';

export interface JwtPayload {
  user_id: number;
  business_id: number;
  roles: string[];
  type?: 'access' | 'refresh';
}

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<JwtPayload> {
  if (securityName === 'jwt') {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.reject(new AppError(401, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];

    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', function (err: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) {
        if (err) {
          reject(new AppError(401, 'Invalid or expired token'));
        } else {
          const jwtDecoded = decoded as JwtPayload;
          
          if (jwtDecoded.type && jwtDecoded.type !== 'access') {
            reject(new AppError(401, 'Invalid token type'));
          }

          // Check if scopes are required (roles)
          if (scopes && scopes.length > 0) {
            const hasRole = jwtDecoded.roles.some((role) => scopes.includes(role));
            if (!hasRole) {
              reject(new AppError(403, 'Forbidden: Insufficient permissions'));
            }
          }

          resolve(jwtDecoded);
        }
      });
    });
  }
  
  return Promise.reject(new AppError(401, 'Authentication required'));
}
