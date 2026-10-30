import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { ApiResponse } from '../types/responses';

export async function addCentralStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stock = await inventoryService.addCentralStock(req.body);
    const response: ApiResponse = {
      success: true,
      data: stock,
      timestamp: new Date().toISOString()
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listCentralStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stock = await inventoryService.listCentralStock();
    const response: ApiResponse = {
      success: true,
      data: stock,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getInventoryBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const balance = await inventoryService.getInventoryBalance(req.user!);
    const response: ApiResponse = {
      success: true,
      data: balance,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function registerNonCommercialExit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exitRecord = await inventoryService.registerNonCommercialExit(req.body, req.user!);
    const response: ApiResponse = {
      success: true,
      data: exitRecord,
      timestamp: new Date().toISOString()
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listNonCommercialExits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exits = await inventoryService.listNonCommercialExits(req.user!);
    const response: ApiResponse = {
      success: true,
      data: exits,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCriticalAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alerts = await inventoryService.getCriticalAlerts(req.user!);
    const response: ApiResponse = {
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

