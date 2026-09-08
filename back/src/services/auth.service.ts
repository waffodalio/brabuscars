import type { LoginDto, RegisterDto } from "../dto/auth.dto";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAuthToken } from "../utils/jwt";
import { toPublicUser, type PublicUser } from "../utils/publicUser";

export interface AuthResult {
  user: PublicUser;
  token: string;
}

/**
 * Registration, login and "who am I" logic. Passwords are hashed with bcrypt;
 * a successful register or login returns a signed JWT alongside the public
 * user representation.
 */
export const authService = {
  async register(dto: RegisterDto): Promise<AuthResult> {
    if (await userRepository.existsByEmail(dto.email)) {
      throw ApiError.conflict("This email address is already registered");
    }

    const user = userRepository.create({
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: "user",
    });
    const saved = await userRepository.save(user);

    return {
      user: toPublicUser(saved),
      token: signAuthToken({ sub: saved.id, role: saved.role }),
    };
  },

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await userRepository.findByEmail(dto.email);
    // Same error whether the email is unknown or the password is wrong.
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    return {
      user: toPublicUser(user),
      token: signAuthToken({ sub: user.id, role: user.role }),
    };
  },

  async getCurrentUser(id: number): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.unauthorized("Account no longer exists");
    }
    return toPublicUser(user);
  },
};
