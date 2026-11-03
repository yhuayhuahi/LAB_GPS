import { NextFunction, Request, Response } from 'express';
import { saleService } from '../services/sale.service';

export async function createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(201).json({ success: true, data: await saleService.create(req.body, req.user!), timestamp: new Date().toISOString() }); } catch (error) { next(error); }
}
export async function listMySales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ success: true, data: await saleService.listMine(req.user!), timestamp: new Date().toISOString() }); } catch (error) { next(error); }
}
export async function annulSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ success: true, data: await saleService.annul(req.params.id, req.body.justification, req.user!), timestamp: new Date().toISOString() }); } catch (error) { next(error); }
}
export async function downloadTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const ticket = await saleService.ticket(req.params.id, req.user!); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="ticket-${req.params.id}.pdf"`); res.send(ticket); } catch (error) { next(error); }
}
