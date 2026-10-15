import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { ApiResponse } from '../types/responses';

export class ProductController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.all !== 'true';
      const products = await productService.listProducts(activeOnly);
      const response: ApiResponse<typeof products> = {
        success: true,
        data: products,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      const response: ApiResponse<typeof product> = {
        success: true,
        data: product,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await productService.createProduct(req.body);
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
      const updated = await productService.updateProduct(req.params.id, req.body);
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

export const productController = new ProductController();
