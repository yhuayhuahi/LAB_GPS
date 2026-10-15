import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('El correo electrónico ingresado no tiene un formato válido'),
  password: z.string().min(6, 'La contraseña debe contener al menos 6 caracteres')
});

export type LoginInput = z.infer<typeof loginSchema>;
