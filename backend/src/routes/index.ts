import { Router } from 'express';
import { env } from '../config/env';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import consignmentRoutes from './consignment.routes';
import inventoryRoutes from './inventory.routes';
import liquidationRoutes from './liquidation.routes';
import notificationRoutes from './notification.routes';
import productRoutes from './product.routes';
import replenishmentRoutes from './replenishment.routes';
import saleRoutes from './sale.routes';

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

// Rutas funcionales de la API (Sprint 1 + Sprint 2)
router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/products', productRoutes);
router.use('/consignments', consignmentRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', saleRoutes);

// Sprint 4: Reabastecimiento y notificaciones (HU-13 / HU-14)
router.use('/replenishments', replenishmentRoutes);
router.use('/notifications', notificationRoutes);

// Sprint 4 (cont.): Liquidaciones y cobranzas (HU-15 / HU-16)
router.use('/liquidations', liquidationRoutes);

export default router;
