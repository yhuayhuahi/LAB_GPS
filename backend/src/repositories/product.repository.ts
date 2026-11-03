import { db } from '../config/database';
import { Product } from '../types/domain';

export class ProductRepository {
  async findAll(activeOnly = true): Promise<Product[]> {
    let sql = `
      SELECT id, code, category_code, title, education_level, isbn, public_price, fixed_commission, observations, is_active, created_at
      FROM products
    `;
    if (activeOnly) {
      sql += ` WHERE is_active = $1 ORDER BY title ASC;`;
      return db.query<Product>(sql, [true]);
    }
    sql += ` ORDER BY title ASC;`;
    return db.query<Product>(sql);
  }

  async findById(id: string): Promise<Product | null> {
    const sql = `
      SELECT id, code, category_code, title, education_level, isbn, public_price, fixed_commission, observations, is_active, created_at
      FROM products
      WHERE id = $1;
    `;
    return db.queryOne<Product>(sql, [id]);
  }

  async findByCode(code: string): Promise<Product | null> {
    const sql = `
      SELECT id, code, category_code, title, education_level, isbn, public_price, fixed_commission, observations, is_active, created_at
      FROM products
      WHERE UPPER(code) = UPPER($1);
    `;
    return db.queryOne<Product>(sql, [code]);
  }

  async create(product: Omit<Product, 'created_at'>): Promise<Product> {
    const sql = `
      INSERT INTO products (id, code, category_code, title, education_level, isbn, public_price, fixed_commission, observations, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;
    await db.execute(sql, [
      product.id,
      product.code.toUpperCase(),
      product.category_code,
      product.title,
      product.education_level,
      product.isbn ?? null,
      product.public_price,
      product.fixed_commission,
      product.observations ?? null,
      product.is_active ?? true
    ]);
    const created = await this.findById(product.id);
    return created!;
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      title: product.title ?? existing.title,
      category_code: product.category_code ?? existing.category_code,
      education_level: product.education_level ?? existing.education_level,
      isbn: product.isbn !== undefined ? product.isbn : existing.isbn,
      public_price: product.public_price !== undefined ? product.public_price : existing.public_price,
      fixed_commission: product.fixed_commission !== undefined ? product.fixed_commission : existing.fixed_commission,
      observations: product.observations !== undefined ? product.observations : existing.observations,
      is_active: product.is_active !== undefined ? product.is_active : existing.is_active
    };

    const sql = `
      UPDATE products 
      SET title = $1, category_code = $2, education_level = $3, isbn = $4, public_price = $5, fixed_commission = $6, observations = $7, is_active = $8
      WHERE id = $9;
    `;
    await db.execute(sql, [
      updated.title,
      updated.category_code,
      updated.education_level,
      updated.isbn,
      updated.public_price,
      updated.fixed_commission,
      updated.observations,
      updated.is_active,
      id
    ]);

    return this.findById(id);
  }
}

export const productRepository = new ProductRepository();
