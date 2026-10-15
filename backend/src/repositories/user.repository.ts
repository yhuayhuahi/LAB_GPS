import { db } from '../config/database';
import { User, RoleName } from '../types/domain';

export class UserRepository {
  async findByEmail(email: string): Promise<(User & { role_name: RoleName; branch_name: string | null }) | null> {
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.password_hash, 
        u.full_name, 
        u.role_id, 
        r.name as role_name,
        u.branch_id,
        b.name as branch_name,
        u.observations, 
        u.is_active, 
        u.created_at
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE LOWER(u.email) = LOWER($1);
    `;
    const rows = await db.query<User & { role_name: RoleName; branch_name: string | null }>(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
  }

  async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.password_hash, 
        u.full_name, 
        u.role_id, 
        r.name as role_name,
        u.branch_id, 
        u.observations, 
        u.is_active, 
        u.created_at
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1;
    `;
    return db.queryOne<User>(sql, [id]);
  }

  async create(user: Omit<User, 'created_at'>): Promise<User> {
    const sql = `
      INSERT INTO users (id, email, password_hash, full_name, role_id, branch_id, observations, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    await db.execute(sql, [
      user.id,
      user.email,
      user.password_hash,
      user.full_name,
      user.role_id,
      user.branch_id,
      user.observations ?? null,
      user.is_active ?? true
    ]);
    const created = await this.findById(user.id);
    return created!;
  }
}

export const userRepository = new UserRepository();
