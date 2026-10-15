import { Router } from 'express';
import { branchController } from '../controllers/branch.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createBranchSchema, updateBranchSchema } from '../schemas/branch.schema';

const router = Router();

// Todas las rutas de distribuidoras requieren autenticación
router.use(authenticate);

// Listar distribuidoras (disponible para todos los roles autenticados)
router.get('/', branchController.list);

// Obtener detalle de una distribuidora específica
router.get('/:id', branchController.getById);

// Alta de nueva distribuidora (Exclusivo Administrador General - HU-02)
router.post(
  '/',
  requireRoles('ADMIN'),
  validateBody(createBranchSchema),
  branchController.create
);

// Actualizar datos de una distribuidora (Exclusivo Administrador General)
router.put(
  '/:id',
  requireRoles('ADMIN'),
  validateBody(updateBranchSchema),
  branchController.update
);

export default router;
