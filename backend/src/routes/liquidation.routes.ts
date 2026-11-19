import { Router } from 'express';
import {
  addLiquidationPayment,
  createLiquidation,
  getDebts,
  getLiquidation,
  listLiquidations,
  previewLiquidation
} from '../controllers/liquidation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createLiquidationSchema, createPaymentSchema } from '../schemas/liquidation.schema';

const router = Router();

router.use(authenticate);

// HU-15: cálculo previo y generación (solo Logística / Admin)
router.get('/preview', requireRoles('ADMIN', 'LOGISTICS'), previewLiquidation);
router.post('/', requireRoles('ADMIN', 'LOGISTICS'), validateBody(createLiquidationSchema), createLiquidation);

// HU-16: panel de deudas (Distribuidor: solo su sede, RN-05). Debe ir antes de '/:id'.
router.get('/debts', getDebts);

// Consulta (Distribuidor: solo su sede, RN-05)
router.get('/', listLiquidations);
router.get('/:id', getLiquidation);

// HU-16: registrar cobro (solo Logística / Admin)
router.post('/:id/payments', requireRoles('ADMIN', 'LOGISTICS'), validateBody(createPaymentSchema), addLiquidationPayment);

export default router;
