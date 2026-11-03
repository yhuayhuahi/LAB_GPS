import { NextFunction, Request, Response } from 'express';
import { saleService } from '../services/sale.service';

export async function createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(201).json({ success: true, data: await saleService.create(req.body, req.user!), timestamp: new Date().toISOString() }); } catch (error) { next(error); }
}
