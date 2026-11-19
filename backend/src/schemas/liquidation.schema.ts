import { z } from 'zod';
import { hasMaxTwoDecimals } from '../utils/money';
import { isValidIsoDate } from '../utils/lima-date';

const isoDate = (label: string) =>
  z
    .string({ required_error: `${label} es obligatoria` })
    .refine(isValidIsoDate, `${label} debe tener el formato AAAA-MM-DD y ser una fecha válida`);

/**
 * HU-15: la liquidación se calcula SOLO con (distribuidora, período). El cliente no puede enviar precios,
 * comisiones ni importes: RN-06 (comisión fija inmutable). Por eso el esquema es estricto y rechaza
 * cualquier campo adicional con un 400.
 */
export const liquidationPeriodSchema = z
  .object({
    branch_id: z.string({ required_error: 'La distribuidora es obligatoria' }).min(1, 'La distribuidora es obligatoria'),
    period_start: isoDate('La fecha de inicio'),
    period_end: isoDate('La fecha de fin')
  })
  .strict('No se permiten campos adicionales: la comisión y los importes los calcula el sistema (RN-06)')
  .refine((v) => v.period_start <= v.period_end, {
    message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
    path: ['period_start']
  });

export const createLiquidationSchema = z
  .object({
    branch_id: z.string({ required_error: 'La distribuidora es obligatoria' }).min(1, 'La distribuidora es obligatoria'),
    period_start: isoDate('La fecha de inicio'),
    period_end: isoDate('La fecha de fin'),
    notes: z.string().trim().max(500, 'Las notas no pueden exceder 500 caracteres').optional()
  })
  .strict('No se permiten campos adicionales: la comisión y los importes los calcula el sistema (RN-06)')
  .refine((v) => v.period_start <= v.period_end, {
    message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
    path: ['period_start']
  });

/**
 * HU-16: pago > 0, máximo 2 decimales. Los pagos con constancia o transferencia exigen una referencia.
 */
export const createPaymentSchema = z
  .object({
    amount: z
      .number({ required_error: 'El monto es obligatorio', invalid_type_error: 'El monto debe ser un número' })
      .positive('El monto debe ser mayor a 0')
      .max(10000000, 'El monto excede el máximo permitido')
      .refine(hasMaxTwoDecimals, 'El monto admite como máximo 2 decimales'),
    payment_method: z.enum(['CASH', 'VOUCHER', 'TRANSFER'], {
      errorMap: () => ({ message: 'El método de pago debe ser CASH (efectivo), VOUCHER (constancia) o TRANSFER' })
    }),
    payment_date: isoDate('La fecha de pago').optional(),
    evidence: z.string().trim().max(200, 'La referencia no puede exceder 200 caracteres').optional()
  })
  .superRefine((v, ctx) => {
    if (v.payment_method !== 'CASH' && (!v.evidence || v.evidence.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidence'],
        message: 'Los pagos con constancia o transferencia requieren el N° de comprobante o referencia (mín. 3 caracteres)'
      });
    }
  });

export type LiquidationPeriodInput = z.infer<typeof liquidationPeriodSchema>;
export type CreateLiquidationInput = z.infer<typeof createLiquidationSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
