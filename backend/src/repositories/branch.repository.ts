import { db } from '../config/database';
import { Branch } from '../types/domain';

export class BranchRepository {
  async findAll(activeOnly = true): Promise<Branch[]> {
    let sql = `
      SELECT id, code, name, address, phone, manager_name, observations, is_active, created_at
      FROM branches
    `;
    if (activeOnly) {
      sql += ` WHERE is_active = $1 ORDER BY name ASC;`;
      return db.query<Branch>(sql, [true]);
    }
    sql += ` ORDER BY name ASC;`;
    return db.query<Branch>(sql);
  }

  async findById(id: string): Promise<Branch | null> {
    const sql = `
      SELECT id, code, name, address, phone, manager_name, observations, is_active, created_at
      FROM branches
      WHERE id = $1;
    `;
    return db.queryOne<Branch>(sql, [id]);
  }

  async findByCode(code: string): Promise<Branch | null> {
    const sql = `
      SELECT id, code, name, address, phone, manager_name, observations, is_active, created_at
      FROM branches
      WHERE UPPER(code) = UPPER($1);
    `;
    return db.queryOne<Branch>(sql, [code]);
  }

  async create(branch: Omit<Branch, 'created_at'>): Promise<Branch> {
    const sql = `
      INSERT INTO branches (id, code, name, address, phone, manager_name, observations, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    await db.execute(sql, [
      branch.id,
      branch.code.toUpperCase(),
      branch.name,
      branch.address,
      branch.phone ?? null,
      branch.manager_name ?? null,
      branch.observations ?? null,
      branch.is_active ?? true
    ]);
    const created = await this.findById(branch.id);
    return created!;
  }

  async update(id: string, branch: Partial<Branch>): Promise<Branch | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      name: branch.name ?? existing.name,
      address: branch.address ?? existing.address,
      phone: branch.phone !== undefined ? branch.phone : existing.phone,
      manager_name: branch.manager_name !== undefined ? branch.manager_name : existing.manager_name,
      observations: branch.observations !== undefined ? branch.observations : existing.observations,
      is_active: branch.is_active !== undefined ? branch.is_active : existing.is_active
    };

    const sql = `
      UPDATE branches 
      SET name = $1, address = $2, phone = $3, manager_name = $4, observations = $5, is_active = $6
      WHERE id = $7;
    `;
    await db.execute(sql, [
      updated.name,
      updated.address,
      updated.phone,
      updated.manager_name,
      updated.observations,
      updated.is_active,
      id
    ]);

    return this.findById(id);
  }
}

export const branchRepository = new BranchRepository();
