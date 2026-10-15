import { Request, Response, NextFunction } from 'express';
import { branchService } from '../services/branch.service';
import { ApiResponse } from '../types/responses';

export class BranchController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.all !== 'true';
      const branches = await branchService.listBranches(activeOnly);
      const response: ApiResponse<typeof branches> = {
        success: true,
        data: branches,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchService.getBranchById(req.params.id);
      const response: ApiResponse<typeof branch> = {
        success: true,
        data: branch,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await branchService.createBranch(req.body);
      const response: ApiResponse<typeof created> = {
        success: true,
        data: created,
        timestamp: new Date().toISOString()
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await branchService.updateBranch(req.params.id, req.body);
      const response: ApiResponse<typeof updated> = {
        success: true,
        data: updated,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const branchController = new BranchController();
