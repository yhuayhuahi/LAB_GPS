/**
 * Utilidades monetarias. Todos los cálculos de liquidación se hacen en CÉNTIMOS ENTEROS
 * para evitar errores de redondeo de punto flotante (0.1 + 0.2 !== 0.3).
 */
export const toCents = (value: number | string): number => Math.round(Number(value) * 100);

export const fromCents = (cents: number): number => Math.round(cents) / 100;

/** true si el número tiene como máximo 2 decimales (ej. 10.5 y 10.55 sí; 10.555 no). */
export const hasMaxTwoDecimals = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7;
