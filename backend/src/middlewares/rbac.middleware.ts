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

export function enforceBranchScope(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw AppError.unauthorized('Usuario no autenticado');
  }

  // Los Administradores y Logística tienen alcance global
  if (req.user.role === 'ADMIN' || req.user.role === 'LOGISTICS') {
    return next();
  }

  // Para Distribuidores, aislar forzosamente por su sede asignada
  const userBranchId = req.user.branch_id;
  if (!userBranchId) {
    throw AppError.forbidden('El usuario distribuidor no tiene una distribuidora asignada', 'UNASSIGNED_BRANCH');
  }

  // Verificar si la petición intenta acceder a otra sede
  const targetBranchId = req.params.branchId || req.params.id || req.query.branchId || req.query.branch_id || req.body?.branch_id;

  if (targetBranchId && targetBranchId !== userBranchId) {
    throw AppError.forbidden(
      'Acceso denegado: No cuenta con autorización para visualizar o modificar datos de otra distribuidora aliada',
      'BRANCH_ACCESS_DENIED'
    );
  }

  // Inyectar forzosamente el branch_id del distribuidor
  if (req.query) {
    req.query.branch_id = userBranchId;
  }
  if (req.body && typeof req.body === 'object') {
    req.body.branch_id = userBranchId;
  }

  next();
}

