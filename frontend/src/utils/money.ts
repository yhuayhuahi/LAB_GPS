const pen = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });

/** 500 -> "S/ 500.00" */
export const formatPEN = (value: number): string => pen.format(value).replace(/\s/g, ' ');

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' sin pasar por Date (evita desfases de zona horaria). */
export const formatIsoDate = (iso?: string | null): string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

/** Fecha de hoy en hora local del navegador con formato AAAA-MM-DD. */
export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const firstOfMonthIso = (): string => `${todayIso().slice(0, 8)}01`;

/** Convierte "150,50" o "150.50" en número; devuelve NaN si no es un monto válido. */
export const parseAmount = (raw: string): number => Number(raw.trim().replace(',', '.'));

/**
 * HU-16: valida el monto de un cobro. > 0, máximo 2 decimales y sin superar el saldo pendiente.
 */
export const validatePaymentAmount = (raw: string, pending: number): string | null => {
  const v = raw.trim();
  if (v === '') return 'Ingrese el monto recibido';
  if (!/^-?\d+([.,]\d+)?$/.test(v)) return 'Ingrese un monto válido (ej. 150.50)';
  if (/^-/.test(v)) return 'El monto debe ser mayor a 0';
  if (/[.,]\d{3,}/.test(v)) return 'Máximo 2 decimales';
  const n = parseAmount(v);
  if (!(n > 0)) return 'El monto debe ser mayor a 0';
  if (Math.round(n * 100) > Math.round(pending * 100)) return `No puede superar el saldo pendiente (${formatPEN(pending)})`;
  return null;
};
