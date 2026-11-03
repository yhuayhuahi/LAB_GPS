import { api } from './api';

const DB_NAME = 'qsy-sales-offline';
const STORE = 'pending-sales';
export interface PendingSale {
  id: string;
  created_at: string;
  customer_dni?: string;
  customer_name: string;
  payment_method: 'EFECTIVO' | 'YAPE';
  items: { product_id: string; quantity: number }[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function pendingSales(): Promise<PendingSale[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}
export async function queueSale(sale: PendingSale): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(sale); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
}
export async function syncPendingSales(): Promise<number> {
  const queued = await pendingSales();
  const db = await openDb(); let synced = 0;
  for (const sale of queued) {
    await api.sales.create({ client_sale_uuid: sale.id, customer_dni: sale.customer_dni, customer_name: sale.customer_name, payment_method: sale.payment_method, is_offline_sync: true, items: sale.items });
    await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(sale.id); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
    synced++;
  }
  return synced;
}
