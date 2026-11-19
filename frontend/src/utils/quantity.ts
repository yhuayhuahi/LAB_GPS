export const MAX_REQUEST_QTY = 100000;

/** HU-13 / T03: la cantidad debe ser un entero mayor que cero (se rechaza 0, negativos, decimales y texto). */
export const validateRequestedQty = (raw: string): string | null => {
  const v = raw.trim();
  if (v === '') return 'Ingrese una cantidad';
  if (!/^-?\d+([.,]\d+)?$/.test(v)) return 'Ingrese solo números';
  if (/[.,]/.test(v)) return 'Debe ser un número entero (sin decimales)';
  if (Number(v) <= 0) return 'Debe ser mayor a 0';
  if (Number(v) > MAX_REQUEST_QTY) return `Máximo ${MAX_REQUEST_QTY} ejemplares`;
  return null;
};

/** HU-14 / T06-T07: entregado entero >= 0, <= solicitado y <= stock del almacén (RN-01). */
export const validateDeliveredQty = (raw: string, requested: number, central: number): string | null => {
  const v = raw.trim();
  if (v === '') return 'Ingrese una cantidad (0 si no se entrega)';
  if (!/^\d+$/.test(v)) return 'Solo enteros mayores o iguales a 0';
  const n = Number(v);
  if (n > requested) return `No puede superar lo solicitado (${requested})`;
  if (n > central) return `RN-01: el almacén solo tiene ${central}`;
  return null;
};
