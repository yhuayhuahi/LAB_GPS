import { Router } from 'express';
import { env } from '../config/env';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import productRoutes from './product.routes';

const router = Router();

// Endpoint de chequeo de salud del servicio
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    databaseEngine: env.DB_CLIENT
  });
});

// Endpoint de verificación de compatibilidad de la app móvil (Capacitor APK)
router.get('/app-version', (_req, res) => {
  res.status(200).json({
    latestVersion: env.APP_VERSION,
    minSupportedVersion: '1.0.0',
    mandatoryUpdate: false,
    downloadUrl: '/downloads/qsy-ventas.apk'
  });
});

// Rutas funcionales de la API
router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/products', productRoutes);

export default router;
