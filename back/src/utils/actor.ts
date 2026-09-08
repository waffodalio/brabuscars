import type { Request } from "express";
import type { UserRole } from "../entities/User";
import { ApiError } from "./ApiError";

/** The authenticated principal a service acts on behalf of. */
export interface Actor {
  id: number;
  role: UserRole;
}

/** Reads the principal set by the `authenticate` middleware, or 401s. */
export function actorOf(req: Request): Actor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return { id: req.user.id, role: req.user.role };
}
