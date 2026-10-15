import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { LoginInput } from '../schemas/auth.schema';
import { AppError } from '../types/responses';
import { AuthUser } from '../types/domain';

export class AuthService {
  async login(input: LoginInput): Promise<{ token: string; user: AuthUser }> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw AppError.unauthorized('Credenciales incorrectas: correo o contraseña inválidos', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Esta cuenta de usuario ha sido desactivada por la administración', 'ACCOUNT_DISABLED');
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw AppError.unauthorized('Credenciales incorrectas: correo o contraseña inválidos', 'INVALID_CREDENTIALS');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role_name!,
      branch_id: user.branch_id
    };

    // Firmar token JWT HMAC-SHA256
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role_name,
        branchId: user.branch_id
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return { token, user: authUser };
  }
}

export const authService = new AuthService();
