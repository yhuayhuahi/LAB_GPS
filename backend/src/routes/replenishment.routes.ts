import { Router } from 'express';
import {
  createReplenishment,
  deliverReplenishment,
  getReplenishment,
  listReplenishments
} from '../controllers/replenishment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createReplenishmentSchema, deliverReplenishmentSchema } from '../schemas/replenishment.schema';

const router = Router();

router.use(authenticate);

// HU-13: Solicitar reposición (exclusivo Distribuidor; la sede sale del token, RN-05)
router.post('/', requireRoles('DISTRIBUTOR'), validateBody(createReplenishmentSchema), createReplenishment);

// HU-13/HU-14: Listado (Distribuidor: su sede; Logística/Admin: todas)
router.get('/', listReplenishments);

// HU-14: Detalle (entregado anterior, ventas, saldo) con aislamiento por sede
router.get('/:id', getReplenishment);

// HU-14: Registrar entrega física y completar la solicitud (Logística / Admin)
router.put('/:id/deliver', requireRoles('ADMIN', 'LOGISTICS'), validateBody(deliverReplenishmentSchema), deliverReplenishment);

export default router;
