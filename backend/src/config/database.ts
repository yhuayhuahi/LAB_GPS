import { env } from './env';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export interface IDatabase {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  transaction<T = unknown>(callback: (client: IDatabase) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// ------------------------------------------------------------------------------
// 1. ADAPTADOR SQLITE (Node.js 26 Built-in DatabaseSync)
// ------------------------------------------------------------------------------
class SqliteAdapter implements IDatabase {
  private db: any;

  constructor(dbPath: string) {
    // Asegurar directorio padre
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    this.db = new DatabaseSync(dbPath);
    // Habilitar claves foráneas y modo WAL en SQLite
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
  }

  private prepareSqlAndParams(sql: string, params?: unknown[]): { normalizedSql: string; orderedParams: unknown[] } {
    if (!params || params.length === 0) {
      return { normalizedSql: sql, orderedParams: [] };
    }
    const safeParams = params.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
    const orderedParams: unknown[] = [];
    const normalizedSql = sql.replace(/\$(\d+)/g, (_, numStr) => {
      const idx = parseInt(numStr, 10) - 1;
      orderedParams.push(safeParams[idx]);
      return '?';
    });
    return { normalizedSql, orderedParams };
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const { normalizedSql, orderedParams } = this.prepareSqlAndParams(sql, params);
    if (orderedParams.length === 0) {
      const stmt = this.db.prepare(sql);
      return stmt.all() as T[];
    }
    const stmt = this.db.prepare(normalizedSql);
    return stmt.all(...orderedParams) as T[];
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    const { normalizedSql, orderedParams } = this.prepareSqlAndParams(sql, params);
    if (orderedParams.length === 0) {
      this.db.exec(sql);
    } else {
      const stmt = this.db.prepare(normalizedSql);
      stmt.run(...orderedParams);
    }
  }

  async transaction<T = unknown>(callback: (client: IDatabase) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = await callback(this);
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

// ------------------------------------------------------------------------------
// 2. ADAPTADOR POSTGRESQL (Pool pg)
// ------------------------------------------------------------------------------
class PostgresAdapter implements IDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows as T[];
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await this.pool.query(sql, params);
  }

  async transaction<T = unknown>(callback: (client: IDatabase) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txAdapter: IDatabase = {
        query: async <R>(sql: string, p?: unknown[]) => (await client.query(sql, p)).rows as R[],
        queryOne: async <R>(sql: string, p?: unknown[]) => {
          const res = (await client.query(sql, p)).rows as R[];
          return res.length > 0 ? res[0] : null;
        },
        execute: async (sql: string, p?: unknown[]) => {
          await client.query(sql, p);
        },
        transaction: () => {
          throw new Error('Transacciones anidadas no soportadas');
        },
        close: async () => {}
      };
      const result = await callback(txAdapter);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ------------------------------------------------------------------------------
// 3. FACTORÍA DE CONEXIÓN SEGÚN ENTORNO
// ------------------------------------------------------------------------------
export function createDatabaseConnection(): IDatabase {
  if (env.DB_CLIENT === 'postgres') {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL es requerida cuando DB_CLIENT=postgres');
    }
    console.log('🐘 Conectando a PostgreSQL central...');
    return new PostgresAdapter(env.DATABASE_URL);
  } else {
    const resolvedPath = path.resolve(process.cwd(), env.SQLITE_DB_PATH);
    console.log(`📁 Conectando a SQLite embebido en: ${resolvedPath}`);
    return new SqliteAdapter(resolvedPath);
  }
}

export const db = createDatabaseConnection();
