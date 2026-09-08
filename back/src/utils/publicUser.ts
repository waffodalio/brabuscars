import type { User } from "../entities/User";

/** User fields safe to send to clients (never the password hash). */
export interface PublicUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: User["role"];
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
}
