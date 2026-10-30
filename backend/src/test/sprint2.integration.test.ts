import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../app';

let server: http.Server;
let baseUrl: string;

const runSuffix = `${Date.now().toString().slice(-4)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
const branchCodeA = `TRILCE-${runSuffix}`;
const branchCodeB = `SIGLOXX-${runSuffix}`;
const sellerAEmail = `vendedor.a.${runSuffix.toLowerCase()}@editorialqsy.com`;
const sellerBEmail = `vendedor.b.${runSuffix.toLowerCase()}@editorialqsy.com`;
const productCode1 = `QSY-BAS-${runSuffix}`;
const productCode2 = `QSY-MED-${runSuffix}`;

let adminToken = '';
let distributorAToken = '';
let distributorBToken = '';
let branchAId = '';
let branchBId = '';
let product1Id = '';
let product2Id = '';

let consignmentIdA = '';

before(async () => {
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
      }
      resolve();
    });
  });

  // 1. Iniciar sesión como Super-Administrador
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@editorialqsy.com',
      password: 'Admin123!'
    })
  });
  const loginBody = (await loginRes.json()) as any;
  adminToken = loginBody.data.token;

  // 2. Crear dos sedes para pruebas de aislamiento y consignaciones
  const bResA = await fetch(`${baseUrl}/branches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      code: branchCodeA,
      name: `Librería Trilce ${runSuffix}`,
      address: 'Calle San Juan de Dios 214, Arequipa'
    })
  });
  branchAId = ((await bResA.json()) as any).data.id;

  const bResB = await fetch(`${baseUrl}/branches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      code: branchCodeB,
      name: `Librería Siglo XX ${runSuffix}`,
      address: 'Calle Siglo XX 108, Arequipa'
    })
  });
  branchBId = ((await bResB.json()) as any).data.id;

  // 3. Crear usuario distribuidor en Sede A y en Sede B
  await fetch(`${baseUrl}/branches/${branchAId}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: sellerAEmail,
      password: 'Password123!',
      full_name: 'Vendedor Sede A'
    })
  });

  await fetch(`${baseUrl}/branches/${branchBId}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: sellerBEmail,
      password: 'Password123!',
      full_name: 'Vendedor Sede B'
    })
  });

  // Loguear distribuidores
  const loginARes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: sellerAEmail, password: 'Password123!' })
  });
  distributorAToken = ((await loginARes.json()) as any).data.token;

  const loginBRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: sellerBEmail, password: 'Password123!' })
  });
  distributorBToken = ((await loginBRes.json()) as any).data.token;

  // 4. Crear 2 productos en el catálogo
  const p1Res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      code: productCode1,
      title: 'Quechua Básico para Principiantes',
      education_level: 'Básico',
      public_price: 35.0,
      fixed_commission: 5.0
    })
  });
  product1Id = ((await p1Res.json()) as any).data.id;

  const p2Res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      code: productCode2,
      title: 'Quechua Médico Clínico',
      education_level: 'Especializado',
      public_price: 50.0,
      fixed_commission: 8.0
    })
  });
  product2Id = ((await p2Res.json()) as any).data.id;
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Sprint 2 - Integration Test Suite (Dolly / QA & Leonardo / Backend)', () => {
  // ============================================================================
  // HU-04: Registro de despacho de libros en consignación (TASK-04-04)
  // ============================================================================
  describe('HU-04: Registro de despacho de libros en consignación', () => {
    it('1. Carga de stock al Almacén Central desde imprenta (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/inventory/central/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          product_id: product1Id,
          quantity: 50,
          notes: 'Lote de 50 libros de Quechua Básico recibido de imprenta'
        })
      });

      assert.strictEqual(res.status, 201);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.current_quantity, 50);
    });

    it('2. RN-01: Bloqueo por stock insuficiente en Almacén Central (400 Bad Request)', async () => {
      // Intentar despachar 100 unidades cuando solo hay 50 en central
      const res = await fetch(`${baseUrl}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_branch_id: branchAId,
          notes: 'Despacho excesivo sin stock',
          items: [{ product_id: product1Id, quantity: 100 }]
        })
      });

      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'INSUFFICIENT_CENTRAL_STOCK');
    });

    it('3. Despacho exitoso con stock suficiente y generación de código DESP (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_branch_id: branchAId,
          notes: 'Primer despacho regular para Trilce',
          items: [{ product_id: product1Id, quantity: 20 }]
        })
      });

      assert.strictEqual(res.status, 201);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'PENDING');
      assert.match(body.data.dispatch_code, /^DESP-\d{4}-\d{4}$/);
      assert.strictEqual(body.data.items.length, 1);
      assert.strictEqual(body.data.items[0].dispatched_quantity, 20);

      consignmentIdA = body.data.id;
    });

    it('4. Verifica que el stock del Almacén Central se redujo automáticamente (50 - 20 = 30)', async () => {
      const res = await fetch(`${baseUrl}/inventory/central`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      const found = body.data.find((item: any) => item.product_id === product1Id);
      assert.strictEqual(found.current_quantity, 30);
    });

    it('5. Distribuidor NO tiene autorización para crear despachos (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorAToken}`
        },
        body: JSON.stringify({
          target_branch_id: branchAId,
          items: [{ product_id: product1Id, quantity: 5 }]
        })
      });
      assert.strictEqual(res.status, 403);
    });
  });

  // ============================================================================
  // HU-05: Confirmación digital de recepción por la distribuidora (TASK-05-03)
  // ============================================================================
  describe('HU-05: Confirmación digital de recepción por la distribuidora', () => {
    it('1. Distribuidor A consulta despachos en tránsito asignados a su sede (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/consignments?status=PENDING`, {
        headers: { Authorization: `Bearer ${distributorAToken}` }
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.ok(body.data.some((c: any) => c.id === consignmentIdA));
    });

    it('2. RN-05: Distribuidor de otra sede (Sede B) es bloqueado al intentar confirmar recepción de Sede A (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/consignments/${consignmentIdA}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorBToken}`
        },
        body: JSON.stringify({
          notes: 'Intento malicioso de confirmación cruzada'
        })
      });

      assert.strictEqual(res.status, 403);
      const body = (await res.json()) as any;
      assert.strictEqual(body.error.code, 'BRANCH_ACCESS_DENIED');
    });

    it('3. Distribuidor A confirma recepción conforme (200 OK) y acredita stock en sucursal', async () => {
      const res = await fetch(`${baseUrl}/consignments/${consignmentIdA}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorAToken}`
        },
        body: JSON.stringify({
          notes: 'Recepción física completa y conforme de los 20 libros'
        })
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'RECEIVED');
      assert.strictEqual(body.data.items[0].received_quantity, 20);

      // Comprobar que las 20 unidades ahora están disponibles en branch_stock de Sede A
      const balanceRes = await fetch(`${baseUrl}/inventory/balance`, {
        headers: { Authorization: `Bearer ${distributorAToken}` }
      });
      const balanceBody = (await balanceRes.json()) as any;
      assert.strictEqual(balanceBody.data.scope, 'BRANCH');
      const itemStock = balanceBody.data.branchStock.find((bs: any) => bs.product_id === product1Id);
      assert.ok(itemStock);
      assert.strictEqual(itemStock.available_quantity, 20);
      assert.strictEqual(itemStock.received_quantity, 20);
    });

    it('4. Confirmación con observación/discrepancia física genera estado OBSERVED', async () => {
      // Despachar 10 unidades de producto 2 para Sede A
      await fetch(`${baseUrl}/inventory/central/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ product_id: product2Id, quantity: 30 })
      });

      const dispRes = await fetch(`${baseUrl}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_branch_id: branchAId,
          items: [{ product_id: product2Id, quantity: 10 }]
        })
      });
      const newConsignmentId = ((await dispRes.json()) as any).data.id;

      // Distribuidor confirma con faltante: solo llegaron 8 unidades y 2 dañadas
      const confirmRes = await fetch(`${baseUrl}/consignments/${newConsignmentId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorAToken}`
        },
        body: JSON.stringify({
          notes: 'Se observan 2 ejemplares con hojas mojadas',
          items: [
            {
              product_id: product2Id,
              received_quantity: 8,
              discrepancy_notes: 'Faltan 2 ejemplares que llegaron dañados'
            }
          ]
        })
      });

      assert.strictEqual(confirmRes.status, 200);
      const confirmBody = (await confirmRes.json()) as any;
      assert.strictEqual(confirmBody.data.status, 'OBSERVED');
      assert.strictEqual(confirmBody.data.items[0].received_quantity, 8);
    });
  });

  // ============================================================================
  // HU-06: Consulta de stock central y en consignación por sede (TASK-06-03)
  // ============================================================================
  describe('HU-06: Consulta de stock central y en consignación por sede', () => {
    it('1. Administrador consulta Matriz de Balance Global Multisede (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/inventory/balance`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.scope, 'GLOBAL');
      assert.ok(Array.isArray(body.data.matrix));

      const row = body.data.matrix.find((r: any) => r.product_id === product1Id);
      assert.ok(row);
      assert.strictEqual(row.central_stock, 30);
      assert.ok(row.total_available >= 50);
      assert.ok(row.branches_stock.length >= 2);
    });

    it('2. RN-05: Distribuidor solo puede ver su inventario local y no el balance global', async () => {
      const res = await fetch(`${baseUrl}/inventory/balance`, {
        headers: { Authorization: `Bearer ${distributorAToken}` }
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.data.scope, 'BRANCH');
      assert.strictEqual(body.data.matrix, undefined);
      assert.ok(Array.isArray(body.data.branchStock));

      for (const bs of body.data.branchStock) {
        assert.strictEqual(bs.branch_id, branchAId);
      }
    });
  });

  // ============================================================================
  // HU-07: Registro de salidas no comerciales y mermas justificadas (TASK-07-04)
  // ============================================================================
  describe('HU-07: Registro de salidas no comerciales y mermas justificadas', () => {
    it('1. Logística/Admin registra salida para muestra a docente con justificación (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/inventory/non-commercial-exits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          product_id: product1Id,
          source_type: 'CENTRAL',
          movement_type: 'MUESTRA_DOCENTE',
          quantity: 2,
          justification: 'Entrega de muestra pedagógica al profesor de Quechua de la UNSA'
        })
      });

      assert.strictEqual(res.status, 201);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.movement_type, 'MUESTRA_DOCENTE');
      assert.strictEqual(body.data.quantity, 2);

      // Comprobar que central disminuyó de 30 a 28
      const centralRes = await fetch(`${baseUrl}/inventory/central`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const centralBody = (await centralRes.json()) as any;
      const found = centralBody.data.find((item: any) => item.product_id === product1Id);
      assert.strictEqual(found.current_quantity, 28);
    });

    it('2. RN-07: Bloqueo si la justificación está vacía o incompleta (< 5 caracteres) (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/inventory/non-commercial-exits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          product_id: product1Id,
          source_type: 'CENTRAL',
          movement_type: 'MERMA_DANO',
          quantity: 1,
          justification: 'mer'
        })
      });

      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('3. Distribuidor NO tiene permisos para registrar salidas o mermas (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/inventory/non-commercial-exits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorAToken}`
        },
        body: JSON.stringify({
          product_id: product1Id,
          source_type: 'BRANCH',
          branch_id: branchAId,
          movement_type: 'MERMA_DANO',
          quantity: 1,
          justification: 'Libro roto sin autorización'
        })
      });

      assert.strictEqual(res.status, 403);
    });
  });

  // ============================================================================
  // HU-08: Alertas automáticas de stock crítico por distribuidora (TASK-08-03)
  // ============================================================================
  describe('HU-08: Alertas automáticas de stock crítico por distribuidora', () => {
    it('1. Detecta alerta crítica cuando una sede tiene stock disponible <= 3 unidades (200 OK)', async () => {
      // En Sede B, no tiene stock de producto 1 -> disponible = 0 o inexistente.
      // Vamos a despachar solo 2 unidades a Sede B para que quede en stock crítico
      const dispRes = await fetch(`${baseUrl}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_branch_id: branchBId,
          items: [{ product_id: product1Id, quantity: 2 }]
        })
      });
      const consBId = ((await dispRes.json()) as any).data.id;

      // Confirmar recepción en Sede B (quedan 2 unidades <= 3)
      await fetch(`${baseUrl}/consignments/${consBId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorBToken}`
        },
        body: JSON.stringify({ notes: 'Recibidas 2 unidades' })
      });

      // Consultar alertas críticas
      const alertsRes = await fetch(`${baseUrl}/inventory/critical-alerts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.strictEqual(alertsRes.status, 200);
      const alertsBody = (await alertsRes.json()) as any;
      assert.strictEqual(alertsBody.success, true);

      const alertForB = alertsBody.data.find(
        (a: any) => a.product_id === product1Id && a.branch_id === branchBId
      );
      assert.ok(alertForB);
      assert.strictEqual(alertForB.available_quantity, 2);
      assert.strictEqual(alertForB.threshold, 3);
      assert.strictEqual(alertForB.is_critical, true);
    });

    it('2. Normalización automática de alerta al reabastecer por encima del umbral', async () => {
      // Despachar 10 unidades más a Sede B
      const dispRes = await fetch(`${baseUrl}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_branch_id: branchBId,
          items: [{ product_id: product1Id, quantity: 10 }]
        })
      });
      const consBId2 = ((await dispRes.json()) as any).data.id;

      // Confirmar recepción en Sede B (2 + 10 = 12 unidades > 3)
      await fetch(`${baseUrl}/consignments/${consBId2}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorBToken}`
        },
        body: JSON.stringify({ notes: 'Reposición exitosa' })
      });

      // Consultar alertas críticas: Sede B ya NO debe aparecer en alerta para product1
      const alertsRes = await fetch(`${baseUrl}/inventory/critical-alerts`, {
        headers: { Authorization: `Bearer ${distributorBToken}` }
      });
      const alertsBody = (await alertsRes.json()) as any;
      const alertForB = alertsBody.data.find(
        (a: any) => a.product_id === product1Id && a.branch_id === branchBId
      );
      assert.strictEqual(alertForB, undefined);
    });
  });
});
