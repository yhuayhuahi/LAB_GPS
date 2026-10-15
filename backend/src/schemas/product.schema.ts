import { z } from 'zod';

export const createProductSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(30, 'El código no puede exceder 30 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener letras mayúsculas, números y guiones (ej. QSY-BAS-01)'),
  title: z.string().min(3, 'El título del libro debe tener al menos 3 caracteres').max(150),
  education_level: z.string().min(2, 'El nivel educativo es obligatorio').max(50),
  isbn: z.string().max(30).optional(),
  public_price: z.coerce.number().positive('El precio oficial debe ser un monto mayor a cero'),
  fixed_commission: z.coerce.number().min(0, 'La comisión fija no puede ser negativa'),
  observations: z.string().optional()
}).refine(data => data.fixed_commission < data.public_price, {
  message: 'La comisión fija unitaria debe ser menor que el precio oficial de venta al público',
  path: ['fixed_commission']
});

export const updateProductSchema = z.object({
  code: z.string().min(3).max(30).optional(),
  title: z.string().min(3).max(150).optional(),
  education_level: z.string().min(2).max(50).optional(),
  isbn: z.string().max(30).optional(),
  public_price: z.coerce.number().positive().optional(),
  fixed_commission: z.coerce.number().min(0).optional(),
  observations: z.string().optional(),
  is_active: z.boolean().optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
