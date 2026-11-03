import { db } from '../config/database';

export async function seedDemoData() {
  console.log('🌱 Sembrando datos demostrativos para evaluación del Sprint 1 y Sprint 2...');

  // 1. Sedes Oficiales de Arequipa
  await db.execute(`
    INSERT INTO branches (id, code, name, address, phone, manager_name, observations, is_active)
    VALUES
      ('branch-01', 'SEDE-TRILCE', 'Distribuidora Trilce', 'San Juan de Dios 214, Arequipa', '959123456', 'Don Carlos Trilce', 'Sede céntrica en casona comercial', 1),
      ('branch-02', 'SEDE-SIGLOXX', 'Distribuidora Siglo XX', 'Calle Siglo XX 108, Arequipa', '958765432', 'Sra. Elena Siglo XX', 'Local con señal móvil precaria', 1),
      ('branch-03', 'SEDE-JERUSALEN', 'Distribuidora Jerusalén', 'Calle Jerusalén 302, Arequipa', '957112233', 'Sr. Mario Jerusalén', 'Punto aliado cercano a universidades', 1)
    ON CONFLICT (id) DO UPDATE SET is_active = 1;
  `);

  // 2. Usuarios de Demostración (Contraseña: Admin123!)
  const passwordHash = '$2b$10$fimOaIiaveBCbnNLzG89KuOw5mY39wJ9hCquAqnLq9EpL/2.iKFb2';

  await db.execute(`
    INSERT INTO users (id, email, password_hash, full_name, role_id, branch_id, observations, is_active)
    VALUES
      ('user-admin-01', 'admin@editorialqsy.com', '${passwordHash}', 'Don Walter (Administrador General)', 'role-01', NULL, 'Gerencia Editorial', 1),
      ('user-logistics-01', 'logistica@editorialqsy.com', '${passwordHash}', 'Encargado de Logística Central', 'role-02', NULL, 'Custodio de almacén central y remesas', 1),
      ('user-dist-trilce', 'distribuidor.trilce@editorialqsy.com', '${passwordHash}', 'Vendedor Trilce (Mostrador)', 'role-03', 'branch-01', 'Atención en San Juan de Dios', 1)
    ON CONFLICT (email) DO UPDATE SET is_active = 1;
  `);

  // 3. Catálogo Maestro de Publicaciones de Quechua
  await db.execute(`
    INSERT INTO products (id, code, title, education_level, isbn, public_price, fixed_commission, observations, is_active)
    VALUES
      ('prod-01', 'QSY-BAS-01', 'Quechua Básico para Principiantes', 'Básico', '978-612-00-1122-1', 35.00, 5.00, 'Texto introductorio con CD de audio', 1),
      ('prod-02', 'QSY-INT-01', 'Quechua Intermedio Gramatical', 'Intermedio', '978-612-00-1122-2', 40.00, 6.00, 'Estructura sintáctica y morfología', 1),
      ('prod-03', 'QSY-AVN-01', 'Quechua Avanzado y Literatura', 'Avanzado', '978-612-00-1122-3', 45.00, 7.00, 'Textos clásicos y poesía quechua', 1),
      ('prod-04', 'QSY-MED-01', 'Quechua Médico Clínico', 'Especializado', '978-612-00-1122-4', 50.00, 8.00, 'Manual para profesionales de salud en zonas rurales', 1),
      ('prod-05', 'QSY-DIC-01', 'Diccionario Trilingüe Quechua-Español-Inglés', 'Especializado', '978-612-00-1122-5', 60.00, 10.00, 'Más de 15,000 vocablos y giros idiomáticos', 1)
    ON CONFLICT (id) DO UPDATE SET is_active = 1;
  `);

  // 4. Existencias en Almacén Central (HU-04)
  await db.execute(`
    INSERT INTO central_stock (id, product_id, current_quantity, min_critical_stock, updated_at)
    VALUES
      ('cstock-01', 'prod-01', 50, 5, CURRENT_TIMESTAMP),
      ('cstock-02', 'prod-02', 35, 5, CURRENT_TIMESTAMP),
      ('cstock-03', 'prod-03', 25, 5, CURRENT_TIMESTAMP),
      ('cstock-04', 'prod-04', 20, 5, CURRENT_TIMESTAMP),
      ('cstock-05', 'prod-05', 15, 5, CURRENT_TIMESTAMP)
    ON CONFLICT (product_id) DO UPDATE SET current_quantity = EXCLUDED.current_quantity;
  `);

  // 5. Existencias en Sede Trilce (HU-06 y Alerta Crítica HU-08)
  // Nota: prod-01 tiene 2 unidades (<= 3), activando la alerta crítica roja de demostración
  await db.execute(`
    INSERT INTO branch_stock (id, branch_id, product_id, received_quantity, sold_quantity, available_quantity, updated_at)
    VALUES
      ('bstock-trilce-01', 'branch-01', 'prod-01', 2, 0, 2, CURRENT_TIMESTAMP),
      ('bstock-trilce-02', 'branch-01', 'prod-04', 10, 0, 10, CURRENT_TIMESTAMP)
    ON CONFLICT (branch_id, product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
  `);

  // 6. Despacho en Tránsito Pendiente para Trilce (HU-05)
  await db.execute(`
    INSERT OR IGNORE INTO consignments (id, dispatch_code, target_branch_id, dispatcher_user_id, status, notes, created_at)
    VALUES
      ('cons-demo-01', 'DESP-2026-DEMO', 'branch-01', 'user-logistics-01', 'PENDING', 'Remesa regular en caja precintada enviada a San Juan de Dios', CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO consignment_items (id, consignment_id, product_id, dispatched_quantity, received_quantity, discrepancy_notes)
    VALUES
      ('citem-demo-01', 'cons-demo-01', 'prod-02', 15, 0, NULL);
  `);

  console.log('✅ Base de datos poblada exitosamente con datos representativos de Editorial QSY.');
  // Catálogo comercial vigente: las categorías son independientes y no se mezclan.
  await db.execute(`
    UPDATE products SET is_active = 0 WHERE id IN ('prod-01', 'prod-02', 'prod-03', 'prod-04', 'prod-05');
    INSERT INTO products (id, code, category_code, title, education_level, public_price, fixed_commission, observations, is_active) VALUES
      ('prod-qsy-bas', 'QSY-BAS', 'QSY', 'QSY Básico', 'Básico', 89, 0, 'Categoría QSY', 1), ('prod-qsy-int', 'QSY-INT', 'QSY', 'QSY Intermedio', 'Intermedio', 89, 0, 'Categoría QSY', 1), ('prod-qsy-avn', 'QSY-AVN', 'QSY', 'QSY Avanzado', 'Avanzado', 89, 0, 'Categoría QSY', 1), ('prod-qsy-dic', 'QSY-DIC', 'QSY', 'Diccionario QSY', 'Diccionario', 25, 0, 'Categoría QSY', 1),
      ('prod-pk-bas', 'PK-BAS', 'PK', 'PK Básico', 'Básico', 89, 0, 'Categoría PK', 1), ('prod-pk-int', 'PK-INT', 'PK', 'PK Intermedio', 'Intermedio', 89, 0, 'Categoría PK', 1), ('prod-pk-avn', 'PK-AVN', 'PK', 'PK Avanzado', 'Avanzado', 89, 0, 'Categoría PK', 1),
      ('prod-kusi-bas', 'KUSI-BAS', 'KUSI', 'Kusi Básico', 'Básico', 89, 0, 'Categoría Kusi', 1), ('prod-kusi-int', 'KUSI-INT', 'KUSI', 'Kusi Intermedio', 'Intermedio', 89, 0, 'Categoría Kusi', 1), ('prod-kusi-avn', 'KUSI-AVN', 'KUSI', 'Kusi Avanzado', 'Avanzado', 89, 0, 'Categoría Kusi', 1)
    ON CONFLICT (id) DO UPDATE SET category_code = EXCLUDED.category_code, title = EXCLUDED.title, education_level = EXCLUDED.education_level, public_price = EXCLUDED.public_price, fixed_commission = EXCLUDED.fixed_commission, is_active = 1;
    INSERT INTO central_stock (id, product_id, current_quantity, min_critical_stock, updated_at) VALUES
      ('cstock-qsy-bas', 'prod-qsy-bas', 25, 5, CURRENT_TIMESTAMP), ('cstock-qsy-int', 'prod-qsy-int', 25, 5, CURRENT_TIMESTAMP), ('cstock-qsy-avn', 'prod-qsy-avn', 25, 5, CURRENT_TIMESTAMP), ('cstock-qsy-dic', 'prod-qsy-dic', 25, 5, CURRENT_TIMESTAMP), ('cstock-pk-bas', 'prod-pk-bas', 25, 5, CURRENT_TIMESTAMP), ('cstock-pk-int', 'prod-pk-int', 25, 5, CURRENT_TIMESTAMP), ('cstock-pk-avn', 'prod-pk-avn', 25, 5, CURRENT_TIMESTAMP), ('cstock-kusi-bas', 'prod-kusi-bas', 25, 5, CURRENT_TIMESTAMP), ('cstock-kusi-int', 'prod-kusi-int', 25, 5, CURRENT_TIMESTAMP), ('cstock-kusi-avn', 'prod-kusi-avn', 25, 5, CURRENT_TIMESTAMP)
    ON CONFLICT (product_id) DO UPDATE SET current_quantity = EXCLUDED.current_quantity;
    INSERT INTO branch_stock (id, branch_id, product_id, received_quantity, sold_quantity, available_quantity, updated_at) VALUES
      ('bstock-qsy-bas', 'branch-01', 'prod-qsy-bas', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-qsy-int', 'branch-01', 'prod-qsy-int', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-qsy-avn', 'branch-01', 'prod-qsy-avn', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-qsy-dic', 'branch-01', 'prod-qsy-dic', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-pk-bas', 'branch-01', 'prod-pk-bas', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-pk-int', 'branch-01', 'prod-pk-int', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-pk-avn', 'branch-01', 'prod-pk-avn', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-kusi-bas', 'branch-01', 'prod-kusi-bas', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-kusi-int', 'branch-01', 'prod-kusi-int', 8, 0, 8, CURRENT_TIMESTAMP), ('bstock-kusi-avn', 'branch-01', 'prod-kusi-avn', 8, 0, 8, CURRENT_TIMESTAMP)
    ON CONFLICT (branch_id, product_id) DO UPDATE SET received_quantity = EXCLUDED.received_quantity, available_quantity = EXCLUDED.available_quantity;
  `);
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error al sembrar datos:', err);
      process.exit(1);
    });
}
