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
      await client.execute(`INSERT INTO sales (id, client_sale_uuid, branch_id, seller_user_id, customer_dni, customer_name, payment_method, total_amount, total_commission, status, is_offline_sync, created_at, synced_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'CONFIRMED',$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, [id, input.client_sale_uuid, user.branch_id, user.id, input.customer_dni ?? 'SIN-DNI', input.customer_name, input.payment_method, total, commission, input.is_offline_sync]);
      for (let index = 0; index < input.items.length; index++) {
        const item = input.items[index]; const product = prepared[index].product; const qty = item.quantity;
        await client.execute('UPDATE branch_stock SET available_quantity = available_quantity - $1, sold_quantity = sold_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE branch_id = $2 AND product_id = $3', [qty, user.branch_id, item.product_id]);
        await client.execute('INSERT INTO sale_items (id,sale_id,product_id,quantity,unit_price,unit_commission,subtotal,subtotal_commission) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(), id, item.product_id, qty, product.public_price, product.fixed_commission, Number(product.public_price) * qty, Number(product.fixed_commission) * qty]);
      }
      return mapSale(client, id);
    });
  }
}
export const saleService = new SaleService();
