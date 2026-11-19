import { Request, Response, NextFunction } from 'express';
import { replenishmentService } from '../services/replenishment.service';
import { ApiResponse } from '../types/responses';

const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data, timestamp: new Date().toISOString() });

// HU-13: registrar solicitud de reposición
export async function createReplenishment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const created = await replenishmentService.create(req.user!, req.body);
    res.status(201).json(ok(created));
  } catch (err) {
    next(err);
  }
}

// HU-13/HU-14: listar solicitudes (aislamiento por sede)
export async function listReplenishments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.status(200).json(ok(await replenishmentService.list(req.user!, status)));
  } catch (err) {
    next(err);
  }
}

// HU-14: detalle con entregas previas, ventas y saldo
export async function getReplenishment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(ok(await replenishmentService.getById(req.params.id, req.user!)));
  } catch (err) {
    next(err);
  }
}

// HU-14: registrar entrega física
export async function deliverReplenishment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(ok(await replenishmentService.deliver(req.params.id, req.user!, req.body)));
  } catch (err) {
    next(err);
  }
}
