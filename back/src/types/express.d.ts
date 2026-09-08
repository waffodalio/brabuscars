import type { UserRole } from "../entities/User";

/** Authenticated principal attached to the request by `authenticate`. */
export interface AuthUser {
  id: number;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
