import { z } from 'zod';

export const centralStockEntrySchema = z.object({
  product_id: z.string().min(1, 'El ID del producto es obligatorio'),
  quantity: z
    .number({ invalid_type_error: 'La cantidad debe ser un número entero' })
    .int('La cantidad debe ser un entero')
    .positive('La cantidad ingresada al almacén central debe ser mayor a 0'),
  notes: z.string().optional()
});

export const nonCommercialExitSchema = z
  .object({
    product_id: z.string().min(1, 'El ID del producto es obligatorio'),
    source_type: z.enum(['CENTRAL', 'BRANCH'], {
      errorMap: () => ({ message: 'El origen debe ser CENTRAL o BRANCH' })
    }),
    branch_id: z.string().optional().nullable(),
    movement_type: z.enum(
      ['MUESTRA_DOCENTE', 'CORTESIA', 'PROMOCION', 'SORTEO', 'MERMA_DANO', 'AJUSTE'],
      { errorMap: () => ({ message: 'Tipo de salida no comercial inválido' }) }
    ),
    quantity: z
      .number({ invalid_type_error: 'La cantidad debe ser un número' })
      .int('La cantidad debe ser un entero')
      .positive('La cantidad de egreso debe ser mayor a 0'),
    justification: z
      .string({ required_error: 'La justificación es obligatoria (RN-07)' })
      .trim()
      .min(5, 'La justificación es obligatoria y debe contener al menos 5 caracteres (RN-07)')
  })
  .refine(
    (data) => {
      if (data.source_type === 'BRANCH') {
        return !!data.branch_id && data.branch_id.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Debe especificar la sucursal (branch_id) cuando el origen es BRANCH',
      path: ['branch_id']
    }
  );

export type CentralStockEntryInput = z.infer<typeof centralStockEntrySchema>;
export type NonCommercialExitInput = z.infer<typeof nonCommercialExitSchema>;

