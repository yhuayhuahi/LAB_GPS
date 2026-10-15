import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../types/responses';
import { AuthUser, RoleName } from '../types/domain';

interface JwtPayloadDecoded {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  branchId: string | null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token de autorización ausente o con formato incorrecto');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayloadDecoded;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.fullName,
      role: decoded.role,
      branch_id: decoded.branchId
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('La sesión ha expirado. Por favor inicie sesión nuevamente.', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Token inválido o firma digital no reconocida', 'INVALID_TOKEN');
  }
}
