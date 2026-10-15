import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

// Iniciar sesión con correo y contraseña
router.post('/login', validateBody(loginSchema), authController.login);

// Consultar datos del usuario activo a partir del token Bearer
router.get('/me', authenticate, authController.me);

export default router;
