import { Request, Response, NextFunction } from 'express';
import { liquidationService } from '../services/liquidation.service';
import { ApiResponse } from '../types/responses';

const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data, timestamp: new Date().toISOString() });
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);

export async function previewLiquidation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(ok(await liquidationService.preview(req.query)));
  } catch (err) {
    next(err);
  }
}

export async function createLiquidation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(ok(await liquidationService.create(req.user!, req.body)));
  } catch (err) {
    next(err);
  }
}

export async function listLiquidations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query;
    res.status(200).json(
      ok(await liquidationService.list(req.user!, { branch_id: str(q.branch_id), status: str(q.status), from: str(q.from), to: str(q.to), overdue: str(q.overdue) }))
    );
  } catch (err) {
    next(err);
  }
}

export async function getDebts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(ok(await liquidationService.debts(req.user!)));
  } catch (err) {
    next(err);
  }
}

export async function getLiquidation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(ok(await liquidationService.getById(req.params.id, req.user!)));
  } catch (err) {
    next(err);
  }
}

export async function addLiquidationPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(ok(await liquidationService.addPayment(req.params.id, req.user!, req.body)));
  } catch (err) {
    next(err);
  }
}
