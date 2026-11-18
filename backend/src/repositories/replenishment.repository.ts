import { randomUUID } from 'crypto';
import { db, IDatabase } from '../config/database';
import { env } from '../config/env';
import {
  InventoryMovement,
  ReplenishmentItem,
  ReplenishmentItemInsight,
  ReplenishmentRequest,
  ReplenishmentStatus
} from '../types/domain';

// En PostgreSQL se bloquea la fila durante la transacción (evita despachos concurrentes sobre el mismo stock).
// SQLite serializa las escrituras por sí mismo y no soporta la cláusula.
const FOR_UPDATE = env.DB_CLIENT === 'postgres' ? ' FOR UPDATE' : '';

export class ReplenishmentRepository {
  // ----------------------------------------------------------------------------
  // HU-13: Registro de solicitudes
  // ----------------------------------------------------------------------------
  async generateRequestCode(client: IDatabase = db): Promise<string> {
    const year = new Date().getFullYear();
    const row = await client.queryOne<{ count: string | number }>(`SELECT count(*) as count FROM replenishment_requests`);
    const next = Number(row?.count ?? 0) + 1;
    return `REP-${year}-${next.toString().padStart(4, '0')}`;
  }

  async insertRequest(
    client: IDatabase,
    data: {
      id: string;
      requestCode: string;
      branchId: string;
      requestedByUserId: string;
      notes?: string;
      items: { productId: string; quantity: number }[];
    }
  ): Promise<void> {
    await client.execute(
      `INSERT INTO replenishment_requests (id, request_code, branch_id, requested_by_user_id, status, notes, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, CURRENT_TIMESTAMP)`,
      [data.id, data.requestCode, data.branchId, data.requestedByUserId, data.notes ?? null]
    );
    for (const item of data.items) {
      await client.execute(
        `INSERT INTO replenishment_request_items (id, request_id, product_id, requested_quantity, delivered_quantity)
         VALUES ($1, $2, $3, $4, 0)`,
        [randomUUID(), data.id, item.productId, item.quantity]
      );
    }
  }

  // ----------------------------------------------------------------------------
  // Consultas (HU-13 listado propio / HU-14 bandeja de Logística)
  // ----------------------------------------------------------------------------
  private mapItems(rows: any[]): ReplenishmentItem[] {
    return rows.map((r) => ({
      id: r.id,
      request_id: r.request_id,
      product_id: r.product_id,
      product_title: r.product_title,
      product_code: r.product_code,
      requested_quantity: Number(r.requested_quantity),
      delivered_quantity: Number(r.delivered_quantity)
    }));
  }

  private mapRequest(row: any, items: ReplenishmentItem[]): ReplenishmentRequest {
    return {
      id: row.id,
      request_code: row.request_code,
      branch_id: row.branch_id,
      branch_name: row.branch_name,
      requested_by_user_id: row.requested_by_user_id,
      requested_by_name: row.requested_by_name,
      status: row.status as ReplenishmentStatus,
      notes: row.notes,
      created_at: row.created_at,
      completed_at: row.completed_at,
      completed_by_user_id: row.completed_by_user_id,
      completed_by_name: row.completed_by_name,
      items
    };
  }

  private readonly headerSql = `
    SELECT r.*, b.name as branch_name, u.full_name as requested_by_name, uc.full_name as completed_by_name
    FROM replenishment_requests r
    JOIN branches b ON r.branch_id = b.id
    JOIN users u ON r.requested_by_user_id = u.id
    LEFT JOIN users uc ON r.completed_by_user_id = uc.id`;

  private readonly itemsSql = `
    SELECT ri.*, p.title as product_title, p.code as product_code
    FROM replenishment_request_items ri
    JOIN products p ON ri.product_id = p.id`;

  async findById(id: string, client: IDatabase = db): Promise<ReplenishmentRequest | null> {
    const row = await client.queryOne<any>(`${this.headerSql} WHERE r.id = $1`, [id]);
    if (!row) return null;
    const itemRows = await client.query<any>(`${this.itemsSql} WHERE ri.request_id = $1 ORDER BY p.title ASC`, [id]);
    return this.mapRequest(row, this.mapItems(itemRows));
  }

  async list(branchId?: string, status?: string): Promise<ReplenishmentRequest[]> {
    let sql = `${this.headerSql} WHERE 1=1`;
    const params: unknown[] = [];
    if (branchId) {
      params.push(branchId);
      sql += ` AND r.branch_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }
    sql += ' ORDER BY r.created_at DESC, r.request_code DESC';
    const rows = await db.query<any>(sql, params);
    const result: ReplenishmentRequest[] = [];
    for (const row of rows) {
      const itemRows = await db.query<any>(`${this.itemsSql} WHERE ri.request_id = $1 ORDER BY p.title ASC`, [row.id]);
      result.push(this.mapRequest(row, this.mapItems(itemRows)));
    }
    return result;
  }

  /**
   * HU-14 / T03-T05: entregado histórico, ventas y saldo actual por título para una sede.
   * Se reutiliza branch_stock (alimentada por despachos HU-05, reposiciones HU-14 y ventas Sprint 3),
   * por lo que respeta anulaciones de venta y aísla estrictamente por sede (RN-05).
   */
  async getInsights(branchId: string, productIds: string[]): Promise<Map<string, ReplenishmentItemInsight>> {
    const map = new Map<string, ReplenishmentItemInsight>();
    for (const productId of productIds) {
      const central = await db.queryOne<any>(`SELECT current_quantity FROM central_stock WHERE product_id = $1`, [productId]);
      const bs = await db.queryOne<any>(
        `SELECT received_quantity, sold_quantity, available_quantity FROM branch_stock WHERE branch_id = $1 AND product_id = $2`,
        [branchId, productId]
      );
      const delivered = bs ? Number(bs.received_quantity) : 0;
      const sold = bs ? Number(bs.sold_quantity) : 0;
      const balance = bs ? Number(bs.available_quantity) : 0;
      map.set(productId, {
        central_available: central ? Number(central.current_quantity) : 0,
        delivered_total: delivered,
        sold_total: sold,
        other_exits: Math.max(delivered - sold - balance, 0),
        current_balance: balance
      });
    }
    return map;
  }

  // ----------------------------------------------------------------------------
  // HU-14: Entrega (todas estas operaciones se ejecutan dentro de una transacción)
  // ----------------------------------------------------------------------------
  async lockRequest(client: IDatabase, id: string): Promise<{ id: string; branch_id: string; status: ReplenishmentStatus } | null> {
    return client.queryOne<any>(`SELECT id, branch_id, status FROM replenishment_requests WHERE id = $1${FOR_UPDATE}`, [id]);
  }

  async lockCentralQuantity(client: IDatabase, productId: string): Promise<number> {
    const row = await client.queryOne<any>(`SELECT current_quantity FROM central_stock WHERE product_id = $1${FOR_UPDATE}`, [productId]);
    return row ? Number(row.current_quantity) : 0;
  }

  /** Descuento protegido: la condición current_quantity >= qty impide dejar el stock en negativo (RN-01). */
  async decreaseCentralStock(client: IDatabase, productId: string, quantity: number): Promise<void> {
    await client.execute(
      `UPDATE central_stock SET current_quantity = current_quantity - $1, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2 AND current_quantity >= $1`,
      [quantity, productId]
    );
  }

  async addBranchStock(client: IDatabase, branchId: string, productId: string, quantity: number): Promise<void> {
    const existing = await client.queryOne<any>(`SELECT id FROM branch_stock WHERE branch_id = $1 AND product_id = $2`, [branchId, productId]);
    if (existing) {
      await client.execute(
        `UPDATE branch_stock
         SET received_quantity = received_quantity + $1, available_quantity = available_quantity + $1, updated_at = CURRENT_TIMESTAMP
         WHERE branch_id = $2 AND product_id = $3`,
        [quantity, branchId, productId]
      );
    } else {
      await client.execute(
        `INSERT INTO branch_stock (id, branch_id, product_id, received_quantity, sold_quantity, available_quantity, updated_at)
         VALUES ($1, $2, $3, $4, 0, $4, CURRENT_TIMESTAMP)`,
        [randomUUID(), branchId, productId, quantity]
      );
    }
  }

  async insertMovement(
    client: IDatabase,
    data: {
      productId: string;
      movementType: 'REPLENISHMENT_OUT' | 'REPLENISHMENT_IN';
      locationType: 'CENTRAL' | 'BRANCH';
      branchId?: string | null;
      quantity: number;
      requestId: string;
      userId: string;
    }
  ): Promise<void> {
    await client.execute(
      `INSERT INTO inventory_movements (
         id, product_id, movement_type, location_type, branch_id, quantity, replenishment_request_id, performed_by_user_id, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [randomUUID(), data.productId, data.movementType, data.locationType, data.branchId ?? null, data.quantity, data.requestId, data.userId]
    );
  }

  async setItemDelivered(client: IDatabase, requestId: string, productId: string, quantity: number): Promise<void> {
    await client.execute(
      `UPDATE replenishment_request_items SET delivered_quantity = $1 WHERE request_id = $2 AND product_id = $3`,
      [quantity, requestId, productId]
    );
  }

  async markCompleted(client: IDatabase, requestId: string, userId: string, notes?: string): Promise<void> {
    await client.execute(
      `UPDATE replenishment_requests
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, completed_by_user_id = $1
       WHERE id = $2 AND status = 'PENDING'`,
      [userId, requestId]
    );
    if (notes && notes.length > 0) {
      await client.execute(
        `UPDATE replenishment_requests SET notes = COALESCE(notes || ' | ', '') || $1 WHERE id = $2`,
        [`Entrega: ${notes}`, requestId]
      );
    }
  }

  async listMovements(requestId: string): Promise<InventoryMovement[]> {
    const rows = await db.query<any>(
      `SELECT m.*, p.title as product_title, p.code as product_code, b.name as branch_name, u.full_name as performed_by_name
       FROM inventory_movements m
       JOIN products p ON m.product_id = p.id
       LEFT JOIN branches b ON m.branch_id = b.id
       JOIN users u ON m.performed_by_user_id = u.id
       WHERE m.replenishment_request_id = $1
       ORDER BY m.created_at ASC, m.movement_type DESC, p.title ASC`,
      [requestId]
    );
    return rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_title: r.product_title,
      product_code: r.product_code,
      movement_type: r.movement_type,
      location_type: r.location_type,
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      quantity: Number(r.quantity),
      replenishment_request_id: r.replenishment_request_id,
      performed_by_user_id: r.performed_by_user_id,
      performed_by_name: r.performed_by_name,
      created_at: r.created_at
    }));
  }
}

export const replenishmentRepository = new ReplenishmentRepository();
