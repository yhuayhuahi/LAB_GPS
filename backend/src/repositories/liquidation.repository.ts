import { randomUUID } from 'crypto';
import { db, IDatabase } from '../config/database';
import { env } from '../config/env';
import { Liquidation, LiquidationItem, LiquidationPayment, LiquidationStatus } from '../types/domain';
import { fromCents, toCents } from '../utils/money';
import { todayLima } from '../utils/lima-date';

const FOR_UPDATE = env.DB_CLIENT === 'postgres' ? ' FOR UPDATE' : '';

let paymentSeq = 0;
/**
 * Id de pago ordenable cronológicamente (ms + contador). created_at solo tiene precisión de segundos,
 * así que este id desempata el orden del historial de cobros de forma determinista.
 */
const nextPaymentId = (): string => {
  paymentSeq = (paymentSeq + 1) % 10000;
  return `pay_${Date.now().toString().padStart(13, '0')}_${paymentSeq.toString().padStart(4, '0')}_${randomUUID().slice(0, 6)}`;
};

export interface SaleLineRow {
  sale_id: string;
  product_id: string;
  code: string;
  title: string;
  quantity: number;
  unit_price: number;
  unit_commission: number;
}

export interface LiquidationFilters {
  branchId?: string;
  status?: string;
  from?: string; // period_start >= from
  to?: string; // period_end <= to
  overdueOnly?: boolean;
}

export class LiquidationRepository {
  async findBranch(branchId: string, client: IDatabase = db): Promise<{ id: string; name: string; is_active: unknown } | null> {
    return client.queryOne<any>(`SELECT id, name, is_active FROM branches WHERE id = $1`, [branchId]);
  }

  /**
   * HU-15 / T02: líneas de venta liquidables de una sede en el rango [startUtc, endUtc).
   * - Solo ventas CONFIRMED (las anuladas no cuentan).
   * - Se usa el precio y la comisión CONGELADOS en sale_items (RN-06), nunca el catálogo vigente.
   * - Se excluyen las ventas que ya pertenecen a otra liquidación (evita doble conteo).
   */
  async findEligibleSaleLines(client: IDatabase, branchId: string, startUtc: string, endUtc: string): Promise<SaleLineRow[]> {
    const rows = await client.query<any>(
      `SELECT si.sale_id, si.product_id, p.code, p.title, si.quantity, si.unit_price, si.unit_commission
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       WHERE s.branch_id = $1 AND s.status = 'CONFIRMED' AND s.created_at >= $2 AND s.created_at < $3
         AND NOT EXISTS (SELECT 1 FROM liquidation_sales ls WHERE ls.sale_id = s.id)
       ORDER BY p.title ASC, si.unit_price ASC`,
      [branchId, startUtc, endUtc]
    );
    return rows.map((r) => ({
      sale_id: r.sale_id,
      product_id: r.product_id,
      code: r.code,
      title: r.title,
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      unit_commission: Number(r.unit_commission)
    }));
  }

  async countAlreadyLiquidatedSales(client: IDatabase, branchId: string, startUtc: string, endUtc: string): Promise<number> {
    const row = await client.queryOne<{ count: string | number }>(
      `SELECT count(*) as count FROM sales s
       WHERE s.branch_id = $1 AND s.status = 'CONFIRMED' AND s.created_at >= $2 AND s.created_at < $3
         AND EXISTS (SELECT 1 FROM liquidation_sales ls WHERE ls.sale_id = s.id)`,
      [branchId, startUtc, endUtc]
    );
    return Number(row?.count ?? 0);
  }

  async generateCode(client: IDatabase): Promise<string> {
    const row = await client.queryOne<{ count: string | number }>(`SELECT count(*) as count FROM liquidations`);
    return `LIQ-${new Date().getFullYear()}-${(Number(row?.count ?? 0) + 1).toString().padStart(4, '0')}`;
  }

  async insertLiquidation(
    client: IDatabase,
    d: {
      id: string;
      code: string;
      branchId: string;
      periodStart: string;
      periodEnd: string;
      salesCount: number;
      grossCents: number;
      commissionCents: number;
      netCents: number;
      dueDate: string;
      notes?: string;
      userId: string;
      items: Omit<LiquidationItem, 'id'>[];
      saleIds: string[];
    }
  ): Promise<void> {
    await client.execute(
      `INSERT INTO liquidations (id, liquidation_code, branch_id, period_start, period_end, sales_count, gross_amount, commission_amount,
         net_amount, paid_amount, pending_amount, status, due_date, notes, created_by_user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $9, 'PENDING', $10, $11, $12, CURRENT_TIMESTAMP)`,
      [d.id, d.code, d.branchId, d.periodStart, d.periodEnd, d.salesCount, fromCents(d.grossCents), fromCents(d.commissionCents), fromCents(d.netCents), d.dueDate, d.notes ?? null, d.userId]
    );
    for (const it of d.items) {
      await client.execute(
        `INSERT INTO liquidation_items (id, liquidation_id, product_id, title_snapshot, code_snapshot, quantity, unit_price, unit_commission, gross_subtotal, commission_subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [randomUUID(), d.id, it.product_id, it.title_snapshot, it.code_snapshot, it.quantity, it.unit_price, it.unit_commission, it.gross_subtotal, it.commission_subtotal]
      );
    }
    // PRIMARY KEY (sale_id): si una venta ya estaba liquidada, la BD aborta toda la transacción.
    for (const saleId of d.saleIds) {
      await client.execute(`INSERT INTO liquidation_sales (sale_id, liquidation_id) VALUES ($1, $2)`, [saleId, d.id]);
    }
  }

  // ----------------------------------------------------------------------------
  // Lectura
  // ----------------------------------------------------------------------------
  private readonly headerSql = `
    SELECT l.*, b.name as branch_name, u.full_name as created_by_name
    FROM liquidations l
    JOIN branches b ON b.id = l.branch_id
    JOIN users u ON u.id = l.created_by_user_id`;

  private mapHeader(r: any): Liquidation {
    const status = r.status as LiquidationStatus;
    const due = String(r.due_date).slice(0, 10);
    return {
      id: r.id,
      liquidation_code: r.liquidation_code,
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      period_start: String(r.period_start).slice(0, 10),
      period_end: String(r.period_end).slice(0, 10),
      sales_count: Number(r.sales_count),
      gross_amount: fromCents(toCents(r.gross_amount)),
      commission_amount: fromCents(toCents(r.commission_amount)),
      net_amount: fromCents(toCents(r.net_amount)),
      paid_amount: fromCents(toCents(r.paid_amount)),
      pending_amount: fromCents(toCents(r.pending_amount)),
      status,
      due_date: due,
      is_overdue: status !== 'PAID' && due < todayLima(),
      notes: r.notes,
      created_by_user_id: r.created_by_user_id,
      created_by_name: r.created_by_name,
      created_at: r.created_at
    };
  }

  async findById(id: string, client: IDatabase = db): Promise<Liquidation | null> {
    const row = await client.queryOne<any>(`${this.headerSql} WHERE l.id = $1`, [id]);
    if (!row) return null;
    const liq = this.mapHeader(row);
    const items = await client.query<any>(
      `SELECT * FROM liquidation_items WHERE liquidation_id = $1 ORDER BY title_snapshot ASC, unit_price ASC`,
      [id]
    );
    liq.details = items.map((i) => ({
      id: i.id,
      product_id: i.product_id,
      code_snapshot: i.code_snapshot,
      title_snapshot: i.title_snapshot,
      quantity: Number(i.quantity),
      unit_price: fromCents(toCents(i.unit_price)),
      unit_commission: fromCents(toCents(i.unit_commission)),
      gross_subtotal: fromCents(toCents(i.gross_subtotal)),
      commission_subtotal: fromCents(toCents(i.commission_subtotal))
    }));
    liq.payments = await this.listPayments(id, client);
    return liq;
  }

  async list(filters: LiquidationFilters): Promise<Liquidation[]> {
    let sql = `${this.headerSql} WHERE 1=1`;
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      sql += ` AND ${clause.replace('?', `$${params.length}`)}`;
    };
    if (filters.branchId) add('l.branch_id = ?', filters.branchId);
    if (filters.status) add('l.status = ?', filters.status);
    if (filters.from) add('l.period_start >= ?', filters.from);
    if (filters.to) add('l.period_end <= ?', filters.to);
    sql += ' ORDER BY l.created_at DESC, l.liquidation_code DESC';
    const rows = (await db.query<any>(sql, params)).map((r) => this.mapHeader(r));
    return filters.overdueOnly ? rows.filter((r) => r.is_overdue) : rows;
  }

  async listPayments(liquidationId: string, client: IDatabase = db): Promise<LiquidationPayment[]> {
    const rows = await client.query<any>(
      `SELECT p.*, u.full_name as registered_by_name
       FROM liquidation_payments p JOIN users u ON u.id = p.registered_by_user_id
       WHERE p.liquidation_id = $1 ORDER BY p.created_at ASC, p.id ASC`,
      [liquidationId]
    );
    return rows.map((r) => ({
      id: r.id,
      liquidation_id: r.liquidation_id,
      amount: fromCents(toCents(r.amount)),
      payment_method: r.payment_method,
      payment_date: String(r.payment_date).slice(0, 10),
      evidence: r.evidence,
      registered_by_user_id: r.registered_by_user_id,
      registered_by_name: r.registered_by_name,
      created_at: r.created_at
    }));
  }

  // ----------------------------------------------------------------------------
  // HU-16: cobros (dentro de transacción)
  // ----------------------------------------------------------------------------
  async lockLiquidation(client: IDatabase, id: string): Promise<{ id: string; branch_id: string; net_amount: number } | null> {
    const row = await client.queryOne<any>(`SELECT id, branch_id, net_amount FROM liquidations WHERE id = $1${FOR_UPDATE}`, [id]);
    return row ? { id: row.id, branch_id: row.branch_id, net_amount: Number(row.net_amount) } : null;
  }

  /** Suma de pagos en céntimos: la fuente de verdad es el historial de pagos, no un acumulado editable. */
  async sumPaymentsCents(client: IDatabase, liquidationId: string): Promise<number> {
    const rows = await client.query<any>(`SELECT amount FROM liquidation_payments WHERE liquidation_id = $1`, [liquidationId]);
    return rows.reduce((acc, r) => acc + toCents(r.amount), 0);
  }

  async insertPayment(
    client: IDatabase,
    d: { liquidationId: string; amountCents: number; method: string; paymentDate: string; evidence?: string; userId: string }
  ): Promise<void> {
    await client.execute(
      `INSERT INTO liquidation_payments (id, liquidation_id, amount, payment_method, payment_date, evidence, registered_by_user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [nextPaymentId(), d.liquidationId, fromCents(d.amountCents), d.method, d.paymentDate, d.evidence ?? null, d.userId]
    );
  }

  async updateTotals(client: IDatabase, id: string, paidCents: number, pendingCents: number, status: LiquidationStatus): Promise<void> {
    await client.execute(`UPDATE liquidations SET paid_amount = $1, pending_amount = $2, status = $3 WHERE id = $4`, [
      fromCents(paidCents),
      fromCents(pendingCents),
      status,
      id
    ]);
  }
}

export const liquidationRepository = new LiquidationRepository();
