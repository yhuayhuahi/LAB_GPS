import { Request, Response, NextFunction } from 'express';
import { RoleName } from '../types/domain';
import { AppError } from '../types/responses';

export function requireRoles(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Usuario no autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Acceso restringido. Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}]. Su rol actual es: ${req.user.role}`
      );
    }

    next();
  };
}
