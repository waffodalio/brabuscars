export type UserRole = "user" | "admin" | "super_admin";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

/** Register / login response — the JWT lives in an httpOnly cookie, not here. */
export interface AuthResult {
  user: AuthUser;
  /** Double-submit CSRF token; also set as a readable cookie. */
  csrfToken: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  firstName: string;
  lastName: string;
}
