import { JwtPayload } from '../authentication';

declare global {
  namespace Express {
    export interface Request {
      user: JwtPayload;
    }
  }
}
