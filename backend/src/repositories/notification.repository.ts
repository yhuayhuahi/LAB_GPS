import { randomUUID } from 'crypto';
import { db, IDatabase } from '../config/database';
import { AppNotification, AuthUser, NotificationType, RoleName } from '../types/domain';

const mapRow = (r: any): AppNotification => ({
  id: r.id,
  target_role: r.target_role as RoleName,
  target_branch_id: r.target_branch_id,
  type: r.type as NotificationType,
  title: r.title,
  message: r.message,
  replenishment_request_id: r.replenishment_request_id,
  is_read: Boolean(r.is_read),
  created_at: r.created_at,
  read_at: r.read_at
});

export class NotificationRepository {
  async create(
    client: IDatabase,
    data: {
      targetRole: RoleName;
      targetBranchId?: string | null;
      type: NotificationType;
      title: string;
      message: string;
      requestId?: string | null;
    }
  ): Promise<void> {
    await client.execute(
      `INSERT INTO notifications (id, target_role, target_branch_id, type, title, message, replenishment_request_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [randomUUID(), data.targetRole, data.targetBranchId ?? null, data.type, data.title, data.message, data.requestId ?? null, false]
    );
  }

  /**
   * Alcance de lectura:
   *  - Logística y Admin: notificaciones dirigidas al rol LOGISTICS.
   *  - Distribuidor: solo las dirigidas a su sede (RN-05).
   */
  private scope(user: AuthUser): { where: string; params: unknown[] } | null {
    if (user.role === 'DISTRIBUTOR') {
      if (!user.branch_id) return null;
      return { where: `target_role = 'DISTRIBUTOR' AND target_branch_id = $1`, params: [user.branch_id] };
    }
    return { where: `target_role = 'LOGISTICS'`, params: [] };
  }

  async listFor(user: AuthUser, limit = 30): Promise<AppNotification[]> {
    const scope = this.scope(user);
    if (!scope) return [];
    const rows = await db.query<any>(
      `SELECT * FROM notifications WHERE ${scope.where} ORDER BY created_at DESC, id DESC LIMIT ${Number(limit)}`,
      scope.params
    );
    return rows.map(mapRow);
  }

  async countUnread(user: AuthUser): Promise<number> {
    const scope = this.scope(user);
    if (!scope) return 0;
    const row = await db.queryOne<{ count: string | number }>(
      `SELECT count(*) as count FROM notifications WHERE ${scope.where} AND is_read = $${scope.params.length + 1}`,
      [...scope.params, false]
    );
    return Number(row?.count ?? 0);
  }

  async markRead(user: AuthUser, id: string): Promise<boolean> {
    const scope = this.scope(user);
    if (!scope) return false;
    const found = await db.queryOne<any>(`SELECT id FROM notifications WHERE id = $${scope.params.length + 1} AND ${scope.where}`, [...scope.params, id]);
    if (!found) return false;
    await db.execute(`UPDATE notifications SET is_read = $1, read_at = CURRENT_TIMESTAMP WHERE id = $2`, [true, id]);
    return true;
  }

  async markAllRead(user: AuthUser): Promise<void> {
    const scope = this.scope(user);
    if (!scope) return;
    await db.execute(
      `UPDATE notifications SET is_read = $${scope.params.length + 1}, read_at = CURRENT_TIMESTAMP WHERE ${scope.where} AND is_read = $${scope.params.length + 2}`,
      [...scope.params, true, false]
    );
  }
}

export const notificationRepository = new NotificationRepository();
