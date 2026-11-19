import { randomUUID } from 'crypto';
import { db, IDatabase } from '../config/database';
import { CreateSaleInput } from '../schemas/inventory.schema';
import { AuthUser, Sale, SaleItem } from '../types/domain';
import { AppError } from '../types/responses';

const mapSale = async (client: IDatabase, saleId: string): Promise<Sale> => {
  const sale = await client.queryOne<any>('SELECT * FROM sales WHERE id = $1', [saleId]);
  const rows = await client.query<any>(`SELECT si.*, p.title AS product_title FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = $1`, [saleId]);
  return { ...sale, total_amount: Number(sale.total_amount), is_offline_sync: Boolean(sale.is_offline_sync), items: rows.map((row): SaleItem => ({ ...row, quantity: Number(row.quantity), unit_price: Number(row.unit_price), subtotal: Number(row.subtotal) })) };
};

export class SaleService {
  async create(input: CreateSaleInput, user: AuthUser): Promise<Sale> {
    if (user.role !== 'DISTRIBUTOR' || !user.branch_id) throw AppError.forbidden('Solo un vendedor con sede puede registrar ventas', 'SALE_BRANCH_REQUIRED');
    return db.transaction(async (client) => {
      const existing = await client.queryOne<any>('SELECT id FROM sales WHERE client_sale_uuid = $1', [input.client_sale_uuid]);
      if (existing) return mapSale(client, existing.id);
      let total = 0;
      let commission = 0;
      const prepared: Array<{ product: any; quantity: number }> = [];
      for (const item of input.items) {
        const stock = await client.queryOne<any>(`SELECT bs.available_quantity, p.public_price, p.fixed_commission FROM branch_stock bs JOIN products p ON p.id = bs.product_id WHERE bs.branch_id = $1 AND bs.product_id = $2 AND (p.is_active = 1 OR p.is_active = true)`, [user.branch_id, item.product_id]);
        if (!stock || Number(stock.available_quantity) < item.quantity) throw AppError.badRequest('Sin stock disponible en este local', 'INSUFFICIENT_STOCK');
        prepared.push({ product: stock, quantity: item.quantity });
        total += Number(stock.public_price) * item.quantity;
        commission += Number(stock.fixed_commission) * item.quantity;
      }
      const id = randomUUID();
      await client.execute(`INSERT INTO sales (id, client_sale_uuid, branch_id, seller_user_id, customer_dni, customer_name, payment_method, total_amount, total_commission, status, is_offline_sync, created_at, synced_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'CONFIRMED',$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, [id, input.client_sale_uuid, user.branch_id, user.id, input.customer_dni, input.customer_name, input.payment_method, total, commission, input.is_offline_sync]);
      for (let index = 0; index < input.items.length; index++) {
        const item = input.items[index]; const product = prepared[index].product; const qty = item.quantity;
        await client.execute('UPDATE branch_stock SET available_quantity = available_quantity - $1, sold_quantity = sold_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE branch_id = $2 AND product_id = $3', [qty, user.branch_id, item.product_id]);
        await client.execute('INSERT INTO sale_items (id,sale_id,product_id,quantity,unit_price,unit_commission,subtotal,subtotal_commission) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(), id, item.product_id, qty, product.public_price, product.fixed_commission, Number(product.public_price) * qty, Number(product.fixed_commission) * qty]);
      }
      return mapSale(client, id);
    });
  }

  async listMine(user: AuthUser): Promise<Sale[]> {
    if (!user.branch_id) throw AppError.forbidden('El vendedor no tiene sede asignada', 'SALE_BRANCH_REQUIRED');
    const rows = await db.query<any>(`SELECT id FROM sales WHERE branch_id = $1 ORDER BY created_at DESC LIMIT 50`, [user.branch_id]);
    return Promise.all(rows.map((row) => mapSale(db, row.id)));
  }

  async annul(saleId: string, justification: string, user: AuthUser): Promise<Sale> {
    if (!user.branch_id) throw AppError.forbidden('El vendedor no tiene sede asignada', 'SALE_BRANCH_REQUIRED');
    return db.transaction(async (client) => {
      const sale = await client.queryOne<any>('SELECT * FROM sales WHERE id = $1 AND branch_id = $2', [saleId, user.branch_id]);
      if (!sale) throw AppError.notFound('La venta no pertenece a su sede', 'SALE_NOT_FOUND');
      if (sale.status === 'ANNULLED') throw AppError.conflict('Esta venta ya fue anulada', 'SALE_ALREADY_ANNULLED');
      // HU-15: una venta incluida en una liquidación ya no puede anularse (alteraría importes cobrados)
      const liquidated = await client.queryOne<any>('SELECT liquidation_id FROM liquidation_sales WHERE sale_id = $1', [saleId]);
      if (liquidated) throw AppError.conflict('La venta ya fue incluida en una liquidación y no puede anularse', 'SALE_ALREADY_LIQUIDATED');
      const items = await client.query<any>('SELECT product_id, quantity FROM sale_items WHERE sale_id = $1', [saleId]);
      for (const item of items) await client.execute('UPDATE branch_stock SET available_quantity = available_quantity + $1, sold_quantity = sold_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE branch_id = $2 AND product_id = $3', [Number(item.quantity), user.branch_id, item.product_id]);
      await client.execute(`UPDATE sales SET status = 'ANNULLED', observations = $1 WHERE id = $2`, [`ANULADA: ${justification.trim()}`, saleId]);
      return mapSale(client, saleId);
    });
  }

  async ticket(saleId: string, user: AuthUser): Promise<Buffer> {
    if (!user.branch_id) throw AppError.forbidden('El vendedor no tiene sede asignada', 'SALE_BRANCH_REQUIRED');
    const sale = await db.queryOne<any>(`SELECT s.*, b.name AS branch_name FROM sales s JOIN branches b ON b.id = s.branch_id WHERE s.id = $1 AND s.branch_id = $2`, [saleId, user.branch_id]);
    if (!sale) throw AppError.notFound('Venta no encontrada', 'SALE_NOT_FOUND');
    const items = await db.query<any>(`SELECT p.title, si.quantity, si.unit_price, si.subtotal FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = $1`, [saleId]);
    const safe = (text: unknown) => String(text).replace(/[()\\]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?');
    const lines = ['QSY - COMPROBANTE INTERNO', `Operacion: ${sale.id}`, `Fecha: ${sale.created_at}`, `Sede: ${sale.branch_name}`, `Cliente: ${sale.customer_name}`, `DNI: ${sale.customer_dni}`, `Pago: ${sale.payment_method}`, '--- Detalle ---', ...items.map((item) => `${item.quantity} x ${item.title}  S/ ${Number(item.subtotal).toFixed(2)}`), `TOTAL: S/ ${Number(sale.total_amount).toFixed(2)}`, 'Gracias por su compra.'];
    const stream = `BT /F1 11 Tf 50 790 Td ${lines.map((line, index) => `${index ? '0 -18 Td ' : ''}(${safe(line)}) Tj`).join(' ')} ET`;
    const objects = [`<< /Type /Catalog /Pages 2 0 R >>`, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 360 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`, `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
    let pdf = '%PDF-1.4\n'; const offsets = [0];
    objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }
}
export const saleService = new SaleService();
