import { randomUUID } from 'crypto';
import { db } from '../config/database';
import {
  BranchStock,
  CentralStock,
  CriticalStockAlert,
  GlobalInventoryMatrixRow,
  NonCommercialExit,
  NonCommercialExitType
} from '../types/domain';

export class InventoryRepository {
  // ----------------------------------------------------------------------------
  // 1. ALMACÉN CENTRAL (HU-04, HU-06)
  // ----------------------------------------------------------------------------
  async getCentralStockByProductId(productId: string): Promise<CentralStock | null> {
    const row = await db.queryOne<any>(
      `SELECT cs.*, p.title as product_title, p.code as product_code
       FROM central_stock cs
       JOIN products p ON cs.product_id = p.id
       WHERE cs.product_id = $1`,
      [productId]
    );
    if (!row) return null;
    return {
      id: row.id,
      product_id: row.product_id,
      product_title: row.product_title,
      product_code: row.product_code,
      current_quantity: Number(row.current_quantity),
      min_critical_stock: Number(row.min_critical_stock),
      updated_at: row.updated_at
    };
  }

  async upsertCentralStock(productId: string, quantityToAdd: number): Promise<CentralStock> {
    const existing = await this.getCentralStockByProductId(productId);
    if (existing) {
      await db.execute(
        `UPDATE central_stock
         SET current_quantity = current_quantity + $1, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [quantityToAdd, productId]
      );
      return (await this.getCentralStockByProductId(productId))!;
    } else {
      const id = randomUUID();
      await db.execute(
        `INSERT INTO central_stock (id, product_id, current_quantity, min_critical_stock, updated_at)
         VALUES ($1, $2, $3, 5, CURRENT_TIMESTAMP)`,
        [id, productId, quantityToAdd]
      );
      return (await this.getCentralStockByProductId(productId))!;
    }
  }

  async decreaseCentralStock(productId: string, quantityToSubtract: number): Promise<void> {
    await db.execute(
      `UPDATE central_stock
       SET current_quantity = current_quantity - $1, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2`,
      [quantityToSubtract, productId]
    );
  }

  async listCentralStock(): Promise<CentralStock[]> {
    const rows = await db.query<any>(
      `SELECT cs.*, p.title as product_title, p.code as product_code
       FROM central_stock cs
       JOIN products p ON cs.product_id = p.id
       ORDER BY p.title ASC`
    );
    return rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_title: r.product_title,
      product_code: r.product_code,
      current_quantity: Number(r.current_quantity),
      min_critical_stock: Number(r.min_critical_stock),
      updated_at: r.updated_at
    }));
  }

  // ----------------------------------------------------------------------------
  // 2. INVENTARIO EN CONSIGNACIÓN POR SUCURSAL (HU-05, HU-06)
  // ----------------------------------------------------------------------------
  async getBranchStock(branchId: string, productId: string): Promise<BranchStock | null> {
    const row = await db.queryOne<any>(
      `SELECT bs.*, p.title as product_title, p.code as product_code, b.name as branch_name, b.code as branch_code
       FROM branch_stock bs
       JOIN products p ON bs.product_id = p.id
       JOIN branches b ON bs.branch_id = b.id
       WHERE bs.branch_id = $1 AND bs.product_id = $2`,
      [branchId, productId]
    );
    if (!row) return null;
    return {
      id: row.id,
      branch_id: row.branch_id,
      branch_name: row.branch_name,
      branch_code: row.branch_code,
      product_id: row.product_id,
      product_title: row.product_title,
      product_code: row.product_code,
      received_quantity: Number(row.received_quantity),
      sold_quantity: Number(row.sold_quantity),
      available_quantity: Number(row.available_quantity),
      updated_at: row.updated_at
    };
  }

  async addBranchStock(branchId: string, productId: string, quantityToAdd: number): Promise<BranchStock> {
    const existing = await this.getBranchStock(branchId, productId);
    if (existing) {
      await db.execute(
        `UPDATE branch_stock
         SET received_quantity = received_quantity + $1,
             available_quantity = available_quantity + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE branch_id = $2 AND product_id = $3`,
        [quantityToAdd, branchId, productId]
      );
    } else {
      const id = randomUUID();
      await db.execute(
        `INSERT INTO branch_stock (id, branch_id, product_id, received_quantity, sold_quantity, available_quantity, updated_at)
         VALUES ($1, $2, $3, $4, 0, $4, CURRENT_TIMESTAMP)`,
        [id, branchId, productId, quantityToAdd]
      );
    }
    return (await this.getBranchStock(branchId, productId))!;
  }

  async decreaseBranchStock(branchId: string, productId: string, quantityToSubtract: number): Promise<void> {
    await db.execute(
      `UPDATE branch_stock
       SET available_quantity = available_quantity - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE branch_id = $2 AND product_id = $3`,
      [quantityToSubtract, branchId, productId]
    );
  }

  async listBranchStock(branchId?: string): Promise<BranchStock[]> {
    let sql = `
      SELECT bs.*, p.title as product_title, p.code as product_code, b.name as branch_name, b.code as branch_code
      FROM branch_stock bs
      JOIN products p ON bs.product_id = p.id
      JOIN branches b ON bs.branch_id = b.id
    `;
    const params: unknown[] = [];
    if (branchId) {
      sql += ' WHERE bs.branch_id = $1';
      params.push(branchId);
    }
    sql += ' ORDER BY b.name ASC, p.title ASC';
    const rows = await db.query<any>(sql, params);
    return rows.map((r) => ({
      id: r.id,
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      branch_code: r.branch_code,
      product_id: r.product_id,
      product_title: r.product_title,
      product_code: r.product_code,
      received_quantity: Number(r.received_quantity),
      sold_quantity: Number(r.sold_quantity),
      available_quantity: Number(r.available_quantity),
      updated_at: r.updated_at
    }));
  }

  // ----------------------------------------------------------------------------
  // 3. MATRIZ DE BALANCE GLOBAL MULTISEDE (HU-06)
  // ----------------------------------------------------------------------------
  async getGlobalInventoryMatrix(): Promise<GlobalInventoryMatrixRow[]> {
    const products = await db.query<any>(
      `SELECT p.id, p.code, p.title, p.education_level, p.public_price,
              COALESCE(cs.current_quantity, 0) as central_stock,
              COALESCE(cs.min_critical_stock, 5) as min_central_critical
       FROM products p
       LEFT JOIN central_stock cs ON p.id = cs.product_id
       WHERE p.is_active = 1 OR p.is_active = true
       ORDER BY p.title ASC`
    );

    const branches = await db.query<any>(
      `SELECT id, code, name FROM branches WHERE is_active = 1 OR is_active = true ORDER BY name ASC`
    );

    const allBranchStocks = await db.query<any>(`SELECT * FROM branch_stock`);

    // Calcular stock en tránsito (despachos PENDING)
    const inTransitRows = await db.query<any>(
      `SELECT ci.product_id, SUM(ci.dispatched_quantity) as in_transit
       FROM consignment_items ci
       JOIN consignments c ON ci.consignment_id = c.id
       WHERE c.status = 'PENDING'
       GROUP BY ci.product_id`
    );
    const inTransitMap = new Map<string, number>();
    for (const row of inTransitRows) {
      inTransitMap.set(row.product_id, Number(row.in_transit));
    }

    const matrix: GlobalInventoryMatrixRow[] = [];

    for (const prod of products) {
      const centralQty = Number(prod.central_stock);
      const inTransitQty = inTransitMap.get(prod.id) ?? 0;

      const branchesList = branches.map((b) => {
        const found = allBranchStocks.find(
          (bs: any) => bs.branch_id === b.id && bs.product_id === prod.id
        );
        const avail = found ? Number(found.available_quantity) : 0;
        const rec = found ? Number(found.received_quantity) : 0;
        const sold = found ? Number(found.sold_quantity) : 0;
        return {
          branch_id: b.id,
          branch_code: b.code,
          branch_name: b.name,
          available_quantity: avail,
          received_quantity: rec,
          sold_quantity: sold,
          is_critical: avail <= 3 // Regla HU-08
        };
      });

      const totalBranchAvailable = branchesList.reduce((acc, curr) => acc + curr.available_quantity, 0);
      const totalAvailable = centralQty + inTransitQty + totalBranchAvailable;

      matrix.push({
        product_id: prod.id,
        product_code: prod.code,
        product_title: prod.title,
        education_level: prod.education_level,
        public_price: Number(prod.public_price),
        central_stock: centralQty,
        in_transit_stock: inTransitQty,
        branches_stock: branchesList,
        total_available: totalAvailable,
        is_central_critical: centralQty <= Number(prod.min_central_critical)
      });
    }

    return matrix;
  }

  // ----------------------------------------------------------------------------
  // 4. SALIDAS NO COMERCIALES Y MERMAS JUSTIFICADAS (HU-07)
  // ----------------------------------------------------------------------------
  async createNonCommercialExit(data: {
    productId: string;
    sourceType: 'CENTRAL' | 'BRANCH';
    branchId?: string | null;
    movementType: NonCommercialExitType;
    quantity: number;
    justification: string;
    authorizedByUserId: string;
  }): Promise<NonCommercialExit> {
    const id = randomUUID();
    await db.execute(
      `INSERT INTO non_commercial_exits (
        id, product_id, source_type, branch_id, movement_type, quantity, justification, authorized_by_user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [
        id,
        data.productId,
        data.sourceType,
        data.branchId ?? null,
        data.movementType,
        data.quantity,
        data.justification,
        data.authorizedByUserId
      ]
    );

    const created = await db.queryOne<any>(
      `SELECT nce.*, p.title as product_title, p.code as product_code, b.name as branch_name, u.full_name as authorized_by_name
       FROM non_commercial_exits nce
       JOIN products p ON nce.product_id = p.id
       LEFT JOIN branches b ON nce.branch_id = b.id
       JOIN users u ON nce.authorized_by_user_id = u.id
       WHERE nce.id = $1`,
      [id]
    );

    return {
      id: created.id,
      product_id: created.product_id,
      product_title: created.product_title,
      product_code: created.product_code,
      source_type: created.source_type,
      branch_id: created.branch_id,
      branch_name: created.branch_name,
      movement_type: created.movement_type,
      quantity: Number(created.quantity),
      justification: created.justification,
      authorized_by_user_id: created.authorized_by_user_id,
      authorized_by_name: created.authorized_by_name,
      created_at: created.created_at
    };
  }

  async listNonCommercialExits(branchId?: string): Promise<NonCommercialExit[]> {
    let sql = `
      SELECT nce.*, p.title as product_title, p.code as product_code, b.name as branch_name, u.full_name as authorized_by_name
      FROM non_commercial_exits nce
      JOIN products p ON nce.product_id = p.id
      LEFT JOIN branches b ON nce.branch_id = b.id
      JOIN users u ON nce.authorized_by_user_id = u.id
    `;
    const params: unknown[] = [];
    if (branchId) {
      sql += ' WHERE nce.branch_id = $1';
      params.push(branchId);
    }
    sql += ' ORDER BY nce.created_at DESC';

    const rows = await db.query<any>(sql, params);
    return rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_title: r.product_title,
      product_code: r.product_code,
      source_type: r.source_type,
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      movement_type: r.movement_type,
      quantity: Number(r.quantity),
      justification: r.justification,
      authorized_by_user_id: r.authorized_by_user_id,
      authorized_by_name: r.authorized_by_name,
      created_at: r.created_at
    }));
  }

  // ----------------------------------------------------------------------------
  // 5. ALERTAS AUTOMÁTICAS DE STOCK CRÍTICO (HU-08)
  // ----------------------------------------------------------------------------
  async getCriticalStockAlerts(branchId?: string, threshold = 3): Promise<CriticalStockAlert[]> {
    const alerts: CriticalStockAlert[] = [];

    // Alertas por sede (disponible <= 3 unidades)
    let branchSql = `
      SELECT bs.available_quantity, p.id as product_id, p.title as product_title, p.code as product_code,
             b.id as branch_id, b.name as branch_name
      FROM branch_stock bs
      JOIN products p ON bs.product_id = p.id
      JOIN branches b ON bs.branch_id = b.id
      WHERE bs.available_quantity <= $1 AND (p.is_active = 1 OR p.is_active = true)
    `;
    const branchParams: unknown[] = [threshold];
    if (branchId) {
      branchSql += ' AND bs.branch_id = $2';
      branchParams.push(branchId);
    }
    branchSql += ' ORDER BY bs.available_quantity ASC, p.title ASC';

    const branchRows = await db.query<any>(branchSql, branchParams);
    for (const r of branchRows) {
      alerts.push({
        product_id: r.product_id,
        product_title: r.product_title,
        product_code: r.product_code,
        scope: 'BRANCH',
        branch_id: r.branch_id,
        branch_name: r.branch_name,
        available_quantity: Number(r.available_quantity),
        threshold,
        is_critical: true
      });
    }

    // Si no se pide para una sede particular (Administrador o Logística), incluir Almacén Central
    if (!branchId) {
      const centralRows = await db.query<any>(
        `SELECT cs.current_quantity, cs.min_critical_stock, p.id as product_id, p.title as product_title, p.code as product_code
         FROM central_stock cs
         JOIN products p ON cs.product_id = p.id
         WHERE cs.current_quantity <= cs.min_critical_stock AND (p.is_active = 1 OR p.is_active = true)
         ORDER BY cs.current_quantity ASC`
      );
      for (const cr of centralRows) {
        alerts.push({
          product_id: cr.product_id,
          product_title: cr.product_title,
          product_code: cr.product_code,
          scope: 'CENTRAL',
          branch_id: null,
          branch_name: 'Almacén Central QSY',
          available_quantity: Number(cr.current_quantity),
          threshold: Number(cr.min_critical_stock),
          is_critical: true
        });
      }
    }

    return alerts;
  }
}

export const inventoryRepository = new InventoryRepository();

