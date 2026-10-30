import { Request, Response, NextFunction } from 'express';
import { consignmentService } from '../services/consignment.service';
import { ApiResponse } from '../types/responses';

export async function createDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consignment = await consignmentService.createDispatch(req.user!, req.body);
    const response: ApiResponse = {
      success: true,
      data: consignment,
      timestamp: new Date().toISOString()
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listDispatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const consignments = await consignmentService.listDispatches(req.user!, status);
    const response: ApiResponse = {
      success: true,
      data: consignments,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getDispatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consignment = await consignmentService.getDispatchById(req.params.id, req.user!);
    const response: ApiResponse = {
      success: true,
      data: consignment,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function confirmReception(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consignment = await consignmentService.confirmReception(req.params.id, req.user!, req.body);
    const response: ApiResponse = {
      success: true,
      data: consignment,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

