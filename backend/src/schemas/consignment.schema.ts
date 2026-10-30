import { z } from 'zod';

export const createConsignmentItemSchema = z.object({
  product_id: z.string().min(1, 'El ID del producto es obligatorio'),
  quantity: z
    .number({ invalid_type_error: 'La cantidad debe ser un número entero' })
    .int('La cantidad debe ser un entero')
    .positive('La cantidad a despachar debe ser mayor a 0')
});

export const createConsignmentSchema = z.object({
  target_branch_id: z.string().min(1, 'La sucursal de destino es obligatoria'),
  notes: z.string().optional(),
  items: z
    .array(createConsignmentItemSchema)
    .min(1, 'Debe incluir al menos un producto para generar el despacho')
});

export const confirmConsignmentItemSchema = z.object({
  product_id: z.string().min(1, 'El ID del producto es obligatorio'),
  received_quantity: z
    .number({ invalid_type_error: 'La cantidad recibida debe ser un número entero' })
    .int('La cantidad recibida debe ser un entero')
    .nonnegative('La cantidad recibida no puede ser negativa'),
  discrepancy_notes: z.string().optional()
});

export const confirmConsignmentSchema = z.object({
  notes: z.string().optional(),
  items: z.array(confirmConsignmentItemSchema).optional()
});

export type CreateConsignmentInput = z.infer<typeof createConsignmentSchema>;
export type ConfirmConsignmentInput = z.infer<typeof confirmConsignmentSchema>;

