import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ApiErrorResponse } from '../types/responses';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  // 1. Error de Dominio Controlado (AppError)
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      timestamp
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 2. Error de Validación de Esquema (ZodError)
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no cumplen con el formato requerido',
        details: formattedErrors
      },
      timestamp
    };
    res.status(400).json(response);
    return;
  }

  // 3. Excepción Inesperada No Controlada (500)
  console.error('💥 Excepción no controlada:', err);
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno en el servidor'
    },
    timestamp
  };
  res.status(500).json(response);
}
