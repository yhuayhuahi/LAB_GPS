import { z } from 'zod';

export const createBranchSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener letras mayúsculas, números, guiones y subguiones (ej. SEDE-TRILCE)'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  address: z.string().min(5, 'La dirección física debe ser específica').max(200),
  phone: z.string().max(30).optional(),
  manager_name: z.string().max(100).optional(),
  observations: z.string().optional()
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  is_active: z.boolean().optional()
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
