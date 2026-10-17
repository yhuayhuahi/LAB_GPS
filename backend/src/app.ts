import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './types/responses';

export function createApp(): Express {
  const app = express();

  // Middlewares de seguridad y parsing
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map(s => s.trim()),
      credentials: true
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Enrutamiento versión 1 de la API y compatibilidad con prefijo /api
  app.use('/api/v1', routes);
  app.use('/api', routes);

  // Manejo de rutas inexistentes (404)
  app.use((req: Request, _res: Response) => {
    throw AppError.notFound(`Ruta no encontrada en el servidor: ${req.method} ${req.originalUrl}`);
  });

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}

export const app = createApp();
