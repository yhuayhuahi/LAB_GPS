import { Router } from 'express';
import {
  addCentralStock,
  getCriticalAlerts,
  getInventoryBalance,
  listCentralStock,
  listNonCommercialExits,
  registerNonCommercialExit
} from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  centralStockEntrySchema,
  nonCommercialExitSchema
} from '../schemas/inventory.schema';

const router = Router();

// Todas las rutas de inventario requieren token activo
router.use(authenticate);

// HU-06: Consulta de stock central y en consignación por sede
router.get('/balance', getInventoryBalance);

// HU-04: Cargar existencias en Almacén Central desde imprenta
router.post(
  '/central/entry',
  requireRoles('ADMIN', 'LOGISTICS'),
  validateBody(centralStockEntrySchema),
  addCentralStock
);

// Listar existencias actuales en Almacén Central
router.get('/central', requireRoles('ADMIN', 'LOGISTICS'), listCentralStock);

// HU-07: Registro de salidas no comerciales y mermas justificadas (RN-07)
router.post(
  '/non-commercial-exits',
  requireRoles('ADMIN', 'LOGISTICS'),
  validateBody(nonCommercialExitSchema),
  registerNonCommercialExit
);

// HU-07: Listar kardex de salidas no comerciales
router.get('/non-commercial-exits', listNonCommercialExits);

// HU-08: Alertas automáticas de stock crítico por distribuidora (<= 3 unidades)
router.get('/critical-alerts', getCriticalAlerts);

export default router;
