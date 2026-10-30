import { randomUUID } from 'crypto';
import { db } from '../config/database';
import { Consignment, ConsignmentItem, ConsignmentStatus } from '../types/domain';

export class ConsignmentRepository {
  async generateDispatchCode(): Promise<string> {
    const year = new Date().getFullYear();
    const countRow = await db.queryOne<{ count: string | number }>(
      `SELECT count(*) as count FROM consignments`
    );
    const count = Number(countRow?.count ?? 0) + 1;
    return `DESP-${year}-${count.toString().padStart(4, '0')}`;
  }

  async create(data: {
    dispatchCode: string;
    targetBranchId: string;
    dispatcherUserId: string;
    notes?: string;
    items: { productId: string; quantity: number }[];
  }): Promise<Consignment> {
    const consignmentId = randomUUID();

    await db.transaction(async (tx) => {
      // 1. Insertar cabecera de consignación
      await tx.execute(
        `INSERT INTO consignments (
          id, dispatch_code, target_branch_id, dispatcher_user_id, status, notes, created_at
        ) VALUES ($1, $2, $3, $4, 'PENDING', $5, CURRENT_TIMESTAMP)`,
        [consignmentId, data.dispatchCode, data.targetBranchId, data.dispatcherUserId, data.notes ?? null]
      );

      // 2. Insertar partidas de libros despachados
      for (const item of data.items) {
        const itemId = randomUUID();
        await tx.execute(
          `INSERT INTO consignment_items (
            id, consignment_id, product_id, dispatched_quantity, received_quantity, discrepancy_notes
          ) VALUES ($1, $2, $3, $4, 0, NULL)`,
          [itemId, consignmentId, item.productId, item.quantity]
        );
      }
    });

    return (await this.findById(consignmentId))!;
  }

  async findById(id: string): Promise<Consignment | null> {
    const row = await db.queryOne<any>(
      `SELECT c.*, b.name as target_branch_name,
              u_disp.full_name as dispatcher_name,
              u_recv.full_name as receiver_name
       FROM consignments c
       JOIN branches b ON c.target_branch_id = b.id
       JOIN users u_disp ON c.dispatcher_user_id = u_disp.id
       LEFT JOIN users u_recv ON c.receiver_user_id = u_recv.id
       WHERE c.id = $1`,
      [id]
    );
    if (!row) return null;

    const itemsRows = await db.query<any>(
      `SELECT ci.*, p.title as product_title, p.code as product_code
       FROM consignment_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.consignment_id = $1
       ORDER BY p.title ASC`,
      [id]
    );

    const items: ConsignmentItem[] = itemsRows.map((ir) => ({
      id: ir.id,
      consignment_id: ir.consignment_id,
      product_id: ir.product_id,
      product_title: ir.product_title,
      product_code: ir.product_code,
      dispatched_quantity: Number(ir.dispatched_quantity),
      received_quantity: Number(ir.received_quantity),
      discrepancy_notes: ir.discrepancy_notes
    }));

    return {
      id: row.id,
      dispatch_code: row.dispatch_code,
      target_branch_id: row.target_branch_id,
      target_branch_name: row.target_branch_name,
      dispatcher_user_id: row.dispatcher_user_id,
      dispatcher_name: row.dispatcher_name,
      receiver_user_id: row.receiver_user_id,
      receiver_name: row.receiver_name,
      status: row.status as ConsignmentStatus,
      notes: row.notes,
      created_at: row.created_at,
      received_at: row.received_at,
      items
    };
  }

  async list(targetBranchId?: string, status?: string): Promise<Consignment[]> {
    let sql = `
      SELECT c.*, b.name as target_branch_name,
              u_disp.full_name as dispatcher_name,
              u_recv.full_name as receiver_name
       FROM consignments c
       JOIN branches b ON c.target_branch_id = b.id
       JOIN users u_disp ON c.dispatcher_user_id = u_disp.id
       LEFT JOIN users u_recv ON c.receiver_user_id = u_recv.id
       WHERE 1=1
    `;
    const params: unknown[] = [];
    if (targetBranchId) {
      params.push(targetBranchId);
      sql += ` AND c.target_branch_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }
    sql += ' ORDER BY c.created_at DESC';

    const rows = await db.query<any>(sql, params);
    const result: Consignment[] = [];

    for (const r of rows) {
      const itemsRows = await db.query<any>(
        `SELECT ci.*, p.title as product_title, p.code as product_code
         FROM consignment_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.consignment_id = $1`,
        [r.id]
      );

      result.push({
        id: r.id,
        dispatch_code: r.dispatch_code,
        target_branch_id: r.target_branch_id,
        target_branch_name: r.target_branch_name,
        dispatcher_user_id: r.dispatcher_user_id,
        dispatcher_name: r.dispatcher_name,
        receiver_user_id: r.receiver_user_id,
        receiver_name: r.receiver_name,
        status: r.status as ConsignmentStatus,
        notes: r.notes,
        created_at: r.created_at,
        received_at: r.received_at,
        items: itemsRows.map((ir) => ({
          id: ir.id,
          consignment_id: ir.consignment_id,
          product_id: ir.product_id,
          product_title: ir.product_title,
          product_code: ir.product_code,
          dispatched_quantity: Number(ir.dispatched_quantity),
          received_quantity: Number(ir.received_quantity),
          discrepancy_notes: ir.discrepancy_notes
        }))
      });
    }

    return result;
  }

  async confirmReception(data: {
    consignmentId: string;
    receiverUserId: string;
    status: 'RECEIVED' | 'OBSERVED';
    notes?: string;
    itemsConfirmation: {
      productId: string;
      receivedQuantity: number;
      discrepancyNotes?: string;
    }[];
  }): Promise<Consignment> {
    await db.transaction(async (tx) => {
      // 1. Actualizar estado de cabecera
      await tx.execute(
        `UPDATE consignments
         SET status = $1, receiver_user_id = $2, received_at = CURRENT_TIMESTAMP,
             notes = CASE WHEN $3 IS NOT NULL THEN COALESCE(notes || ' | ', '') || $3 ELSE notes END
         WHERE id = $4`,
        [data.status, data.receiverUserId, data.notes ?? null, data.consignmentId]
      );

      // 2. Actualizar detalle de partidas
      for (const item of data.itemsConfirmation) {
        await tx.execute(
          `UPDATE consignment_items
           SET received_quantity = $1, discrepancy_notes = $2
           WHERE consignment_id = $3 AND product_id = $4`,
          [item.receivedQuantity, item.discrepancyNotes ?? null, data.consignmentId, item.productId]
        );
      }
    });

    return (await this.findById(data.consignmentId))!;
  }
}

export const consignmentRepository = new ConsignmentRepository();

