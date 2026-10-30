import { Router } from 'express';
import {
  confirmReception,
  createDispatch,
  getDispatchById,
  listDispatches
} from '../controllers/consignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  confirmConsignmentSchema,
  createConsignmentSchema
} from '../schemas/consignment.schema';

const router = Router();

// Todas las rutas de despachos requieren token de sesión válido
router.use(authenticate);

// HU-04: Registrar nuevo despacho en consignación (Exclusivo Logística y Administrador)
router.post(
  '/',
  requireRoles('ADMIN', 'LOGISTICS'),
  validateBody(createConsignmentSchema),
  createDispatch
);

// HU-05: Listar despachos (Distribuidores ven solo su sede; Logística/Admin ven todo)
router.get('/', listDispatches);

// HU-05: Ver detalle de despacho
router.get('/:id', getDispatchById);

// HU-05: Confirmación digital de recepción por el distribuidor (o Admin)
router.put(
  '/:id/confirm',
  requireRoles('ADMIN', 'DISTRIBUTOR'),
  validateBody(confirmConsignmentSchema),
  confirmReception
);

export default router;
