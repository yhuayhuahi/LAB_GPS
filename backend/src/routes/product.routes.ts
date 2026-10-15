import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

// Todas las rutas de productos requieren autenticación
router.use(authenticate);

// Listar catálogo de libros (disponible para todos los roles)
router.get('/', productController.list);

// Obtener detalle de un libro
router.get('/:id', productController.getById);

// Alta de libro y fijación de comisiones fijas (Exclusivo Administrador General - HU-03)
router.post(
  '/',
  requireRoles('ADMIN'),
  validateBody(createProductSchema),
  productController.create
);

// Modificar datos o precios (Exclusivo Administrador General)
router.put(
  '/:id',
  requireRoles('ADMIN'),
  validateBody(updateProductSchema),
  productController.update
);

export default router;
