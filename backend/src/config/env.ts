import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Cargar variables de entorno desde .env si existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_CLIENT: z.enum(['sqlite', 'postgres']).default('sqlite'),
  SQLITE_DB_PATH: z.string().default('./data/qsy.db'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres').default('qsy_super_secret_jwt_key_for_development_purposes_only_2026'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('*'),
  APP_VERSION: z.string().default('1.0.0')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
