/**
 * Convierte las fechas que devuelve la API a Date.
 * SQLite entrega 'YYYY-MM-DD HH:MM:SS' (UTC sin zona) y PostgreSQL entrega ISO 8601 con zona.
 */
export const parseDbDate = (value: string): Date => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);

export const formatDbDateTime = (value?: string | null): string => (value ? parseDbDate(value).toLocaleString('es-PE') : '');
