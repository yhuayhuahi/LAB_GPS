import { z } from 'zod';

/**
 * HU-13 / T03: La cantidad solicitada debe ser un número entero mayor que cero.
 * - 1, 10 -> válido | 0, -5, 2.5, "3", null -> inválido
 * Se valida en backend aunque el frontend ya lo haga, para bloquear peticiones externas.
 */
const requestedQuantity = z
  .number({
    required_error: 'La cantidad es obligatoria',
    invalid_type_error: 'La cantidad debe ser un número entero'
  })
  .int('La cantidad debe ser un número entero (sin decimales)')
  .positive('La cantidad solicitada debe ser mayor a 0')
  .max(100000, 'La cantidad solicitada excede el máximo permitido (100000)');

export const createReplenishmentItemSchema = z.object({
  product_id: z.string({ required_error: 'El ID del libro es obligatorio' }).min(1, 'El ID del libro es obligatorio'),
  quantity: requestedQuantity
});

// Nota: la sede NO se acepta desde el cliente. Se toma del usuario autenticado (RN-05).
export const createReplenishmentSchema = z.object({
  notes: z.string().trim().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  items: z
    .array(createReplenishmentItemSchema, { required_error: 'Debe incluir al menos un libro' })
    .min(1, 'Debe incluir al menos un libro en la solicitud')
    .max(50, 'Una solicitud admite como máximo 50 títulos')
});

/**
 * HU-14 / T07: cantidades realmente entregadas. 0 está permitido (entrega parcial de otros títulos),
 * pero nunca negativos, decimales o no numéricos.
 */
export const deliverReplenishmentItemSchema = z.object({
  product_id: z.string({ required_error: 'El ID del libro es obligatorio' }).min(1, 'El ID del libro es obligatorio'),
  delivered_quantity: z
    .number({
      required_error: 'La cantidad entregada es obligatoria',
      invalid_type_error: 'La cantidad entregada debe ser un número entero'
    })
    .int('La cantidad entregada debe ser un número entero')
    .nonnegative('La cantidad entregada no puede ser negativa')
});

export const deliverReplenishmentSchema = z.object({
  notes: z.string().trim().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  items: z
    .array(deliverReplenishmentItemSchema, { required_error: 'Debe indicar las cantidades entregadas' })
    .min(1, 'Debe indicar las cantidades entregadas')
});

export type CreateReplenishmentInput = z.infer<typeof createReplenishmentSchema>;
export type DeliverReplenishmentInput = z.infer<typeof deliverReplenishmentSchema>;
