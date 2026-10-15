import fs from 'fs';
import path from 'path';
import { db } from '../config/database';

export async function runMigrations() {
  console.log('🚀 Iniciando ejecución de migraciones de base de datos...');
  
  // Buscar schema.sql en src/db/ o en dist/db/
  const possiblePaths = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql'),
    path.resolve(process.cwd(), 'dist/db/schema.sql'),
    path.resolve(process.cwd(), '../SCRUM/docs/schemes/schema.sql')
  ];

  let schemaPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      schemaPath = p;
      break;
    }
  }

  if (!schemaPath) {
    throw new Error('❌ No se encontró el archivo schema.sql en ninguna de las rutas esperadas.');
  }

  console.log(`📄 Leyendo esquema DDL desde: ${schemaPath}`);
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  // Ejecutar script DDL
  await db.execute(sql);

  // Verificar tablas creadas
  const roles = await db.query<{ count: string | number }>('SELECT count(*) as count FROM roles;');
  const users = await db.query<{ count: string | number }>('SELECT count(*) as count FROM users;');
  const branches = await db.query<{ count: string | number }>('SELECT count(*) as count FROM branches;');
  const products = await db.query<{ count: string | number }>('SELECT count(*) as count FROM products;');

  console.log('✅ Migraciones aplicadas con éxito:');
  console.log(`   - Roles registrados: ${roles[0]?.count ?? 0}`);
  console.log(`   - Usuarios base: ${users[0]?.count ?? 0} (Super-Admin)`);
  console.log(`   - Distribuidoras: ${branches[0]?.count ?? 0} (Padrón listo para alta por Admin)`);
  console.log(`   - Productos: ${products[0]?.count ?? 0} (Catálogo listo para alta por Admin)`);
}

// Ejecutar directamente si es invocado por CLI (npm run db:migrate)
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migración finalizada correctamente.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error durante la migración:', err);
      process.exit(1);
    });
}
