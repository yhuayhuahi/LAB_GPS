/**
 * Fechas de negocio en hora de Lima/Arequipa (UTC-5, sin horario de verano).
 * La base de datos guarda created_at en UTC; el período de una liquidación ("2026-11-01" a "2026-11-15")
 * se interpreta como días completos de Lima, es decir [00:00 Lima, 24:00 Lima).
 */
export const LIMA_UTC_OFFSET_HOURS = 5;

const pad = (n: number): string => n.toString().padStart(2, '0');

export const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export const todayLima = (): string => new Date(Date.now() - LIMA_UTC_OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);

export const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Inicio del día de Lima expresado en UTC con el formato que guarda la BD: 'YYYY-MM-DD HH:MM:SS'. */
export const limaDayStartUtc = (isoDate: string): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCHours(d.getUTCHours() + LIMA_UTC_OFFSET_HOURS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};
