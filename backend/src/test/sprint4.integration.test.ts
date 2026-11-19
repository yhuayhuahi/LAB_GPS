import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../app';
import { db } from '../config/database';

/**
 * Sprint 4 - HU-13 (Solicitud digital de reabastecimiento) y HU-14 (Reabastecimiento asistido).
 * La prueba crea sus propias sedes, usuarios y libros con sufijo único para no depender del seed.
 */
let server: http.Server;
let baseUrl = '';
const suffix = `${Date.now().toString().slice(-5)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

let adminToken = '';
let logisticsToken = '';
let distAToken = '';
let distBToken = '';
let branchAId = '';
let branchBId = '';
let prod1 = '';
let prod2 = '';
let requestId = '';

const json = (token: string) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });
const call = async (method: string, path: string, token: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: json(token), body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: (await res.json()) as any };
};
const login = async (email: string, password: string) => {
  const res = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return ((await res.json()) as any).data.token as string;
};
const centralQty = async (productId: string) => Number((await db.queryOne<any>('SELECT current_quantity FROM central_stock WHERE product_id = $1', [productId]))!.current_quantity);
const branchRow = async (branchId: string, productId: string) =>
  db.queryOne<any>('SELECT received_quantity, sold_quantity, available_quantity FROM branch_stock WHERE branch_id = $1 AND product_id = $2', [branchId, productId]);

before(async () => {
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
      resolve();
    });
  });
  adminToken = await login('admin@editorialqsy.com', 'Admin123!');
  logisticsToken = await login('logistica@editorialqsy.com', 'Admin123!');

  branchAId = (await call('POST', '/branches', adminToken, { code: `S4A-${suffix}`, name: `Sede S4 A ${suffix}`, address: 'Calle Uno 123, Arequipa' })).body.data.id;
  branchBId = (await call('POST', '/branches', adminToken, { code: `S4B-${suffix}`, name: `Sede S4 B ${suffix}`, address: 'Calle Dos 456, Arequipa' })).body.data.id;
  await call('POST', `/branches/${branchAId}/users`, adminToken, { email: `s4.a.${suffix.toLowerCase()}@editorialqsy.com`, password: 'Password123!', full_name: 'Distribuidor S4 A' });
  await call('POST', `/branches/${branchBId}/users`, adminToken, { email: `s4.b.${suffix.toLowerCase()}@editorialqsy.com`, password: 'Password123!', full_name: 'Distribuidor S4 B' });
  distAToken = await login(`s4.a.${suffix.toLowerCase()}@editorialqsy.com`, 'Password123!');
  distBToken = await login(`s4.b.${suffix.toLowerCase()}@editorialqsy.com`, 'Password123!');

  prod1 = (await call('POST', '/products', adminToken, { code: `S4-P1-${suffix}`, title: 'Libro S4 Uno', education_level: 'Básico', public_price: 30, fixed_commission: 3 })).body.data.id;
  prod2 = (await call('POST', '/products', adminToken, { code: `S4-P2-${suffix}`, title: 'Libro S4 Dos', education_level: 'Básico', public_price: 40, fixed_commission: 4 })).body.data.id;
  await call('POST', '/inventory/central/entry', adminToken, { product_id: prod1, quantity: 20 });
  await call('POST', '/inventory/central/entry', adminToken, { product_id: prod2, quantity: 8 });
});

after(() => server.close());

describe('HU-13: Solicitud digital de reabastecimiento', () => {
  it('Escenario 1: crea la solicitud PENDING con varios libros, asociada a la sede del token (RN-05)', async () => {
    const res = await call('POST', '/replenishments', distAToken, {
      branch_id: branchBId, // intento de suplantar otra sede: debe ignorarse
      notes: 'Quedan pocos ejemplares',
      items: [
        { product_id: prod1, quantity: 10 },
        { product_id: prod2, quantity: 5 }
      ]
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'PENDING');
    assert.equal(res.body.data.branch_id, branchAId);
    assert.match(res.body.data.request_code, /^REP-\d{4}-\d{4}$/);
    assert.equal(res.body.data.items.length, 2);
    requestId = res.body.data.id;
  });

  it('Escenario 1: Logística recibe la notificación de la nueva solicitud', async () => {
    const res = await call('GET', '/notifications', logisticsToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.unread >= 1);
    const found = res.body.data.notifications.find((n: any) => n.replenishment_request_id === requestId);
    assert.ok(found);
    assert.equal(found.type, 'REPLENISHMENT_REQUESTED');
    assert.equal(found.is_read, false);
  });

  it('Escenario 2: rechaza cantidades 0, negativas, decimales y no numéricas (400)', async () => {
    for (const bad of [0, -5, 2.5, '3', null]) {
      const res = await call('POST', '/replenishments', distAToken, { items: [{ product_id: prod1, quantity: bad }] });
      assert.equal(res.status, 400, `cantidad ${JSON.stringify(bad)} debía rechazarse`);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  });

  it('rechaza solicitud vacía, libro inexistente y libro repetido', async () => {
    assert.equal((await call('POST', '/replenishments', distAToken, { items: [] })).status, 400);
    const ghost = await call('POST', '/replenishments', distAToken, { items: [{ product_id: 'no-existe', quantity: 1 }] });
    assert.equal(ghost.status, 400);
    assert.equal(ghost.body.error.code, 'INVALID_PRODUCT');
    const dup = await call('POST', '/replenishments', distAToken, { items: [{ product_id: prod1, quantity: 1 }, { product_id: prod1, quantity: 2 }] });
    assert.equal(dup.status, 400);
    assert.equal(dup.body.error.code, 'DUPLICATED_PRODUCT');
  });

  it('solo un distribuidor puede solicitar (Logística/Admin reciben 403)', async () => {
    assert.equal((await call('POST', '/replenishments', logisticsToken, { items: [{ product_id: prod1, quantity: 1 }] })).status, 403);
    assert.equal((await call('POST', '/replenishments', adminToken, { items: [{ product_id: prod1, quantity: 1 }] })).status, 403);
  });

  it('RN-05: un distribuidor solo ve y consulta las solicitudes de su sede', async () => {
    const mineA = await call('GET', '/replenishments', distAToken);
    assert.ok(mineA.body.data.some((r: any) => r.id === requestId));
    assert.ok(mineA.body.data.every((r: any) => r.branch_id === branchAId));
    const mineB = await call('GET', '/replenishments', distBToken);
    assert.ok(!mineB.body.data.some((r: any) => r.id === requestId));
    assert.equal((await call('GET', `/replenishments/${requestId}`, distBToken)).status, 403);
    assert.equal((await call('GET', `/replenishments/${requestId}`, distAToken)).status, 200);
  });

  it('el distribuidor no recibe datos internos del almacén central', async () => {
    const res = await call('GET', `/replenishments/${requestId}`, distAToken);
    assert.ok(res.body.data.items.every((i: any) => i.insight === undefined));
    assert.equal(res.body.data.movements, undefined);
  });
});

describe('HU-14: Reabastecimiento asistido', () => {
  it('Escenario 1: Logística ve entregado anterior, ventas y saldo actual de la sede', async () => {
    // Estado previo de la sede A: 12 recibidos, 4 vendidos, 8 disponibles
    await db.execute(
      `INSERT INTO branch_stock (id, branch_id, product_id, received_quantity, sold_quantity, available_quantity, updated_at)
       VALUES ($1, $2, $3, 12, 4, 8, CURRENT_TIMESTAMP)`,
      [`bs-s4-${suffix}`, branchAId, prod1]
    );
    const res = await call('GET', `/replenishments/${requestId}`, logisticsToken);
    assert.equal(res.status, 200);
    const line = res.body.data.items.find((i: any) => i.product_id === prod1);
    assert.deepEqual(line.insight, { central_available: 20, delivered_total: 12, sold_total: 4, other_exits: 0, current_balance: 8 });
    const empty = res.body.data.items.find((i: any) => i.product_id === prod2);
    assert.deepEqual(empty.insight, { central_available: 8, delivered_total: 0, sold_total: 0, other_exits: 0, current_balance: 0 });
  });

  it('Logística lista las solicitudes pendientes de todas las sedes', async () => {
    const res = await call('GET', '/replenishments?status=PENDING', logisticsToken);
    assert.ok(res.body.data.some((r: any) => r.id === requestId));
    assert.equal((await call('GET', '/replenishments?status=XYZ', logisticsToken)).status, 400);
  });

  it('un distribuidor no puede registrar entregas (403)', async () => {
    const res = await call('PUT', `/replenishments/${requestId}/deliver`, distAToken, { items: [{ product_id: prod1, delivered_quantity: 1 }, { product_id: prod2, delivered_quantity: 1 }] });
    assert.equal(res.status, 403);
  });

  it('valida cantidades: negativas, decimales, mayores a lo solicitado y líneas faltantes', async () => {
    const path = `/replenishments/${requestId}/deliver`;
    assert.equal((await call('PUT', path, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: -1 }, { product_id: prod2, delivered_quantity: 1 }] })).status, 400);
    assert.equal((await call('PUT', path, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 1.5 }, { product_id: prod2, delivered_quantity: 1 }] })).status, 400);
    const over = await call('PUT', path, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 11 }, { product_id: prod2, delivered_quantity: 1 }] });
    assert.equal(over.body.error.code, 'DELIVERY_EXCEEDS_REQUEST');
    const missing = await call('PUT', path, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 1 }] });
    assert.equal(missing.body.error.code, 'MISSING_DELIVERY_LINE');
    const zero = await call('PUT', path, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 0 }, { product_id: prod2, delivered_quantity: 0 }] });
    assert.equal(zero.body.error.code, 'EMPTY_DELIVERY');
  });

  it('RN-01: no permite entregar más que el stock del almacén y no deja efectos parciales (rollback)', async () => {
    // Solicitud B: pide 15 del libro 2 (el almacén tiene 8) y 3 del libro 1
    const created = await call('POST', '/replenishments', distBToken, { items: [{ product_id: prod1, quantity: 3 }, { product_id: prod2, quantity: 15 }] });
    const id = created.body.data.id;
    const before1 = await centralQty(prod1);
    const res = await call('PUT', `/replenishments/${id}/deliver`, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 3 }, { product_id: prod2, delivered_quantity: 15 }] });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INSUFFICIENT_CENTRAL_STOCK');
    assert.equal(res.body.error.details.available_quantity, 8);
    assert.equal(await centralQty(prod1), before1, 'el libro 1 no debe descontarse si el libro 2 falla');
    assert.equal(await branchRow(branchBId, prod1), null);
    const still = await call('GET', `/replenishments/${id}`, logisticsToken);
    assert.equal(still.body.data.status, 'PENDING');
    assert.equal(still.body.data.movements.length, 0);
  });

  it('Escenario 2: registra la entrega, actualiza ambos inventarios, movimientos y marca COMPLETED', async () => {
    const c1 = await centralQty(prod1);
    const c2 = await centralQty(prod2);
    const res = await call('PUT', `/replenishments/${requestId}/deliver`, logisticsToken, {
      notes: 'Entrega en mostrador',
      items: [{ product_id: prod1, delivered_quantity: 10 }, { product_id: prod2, delivered_quantity: 3 }]
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'COMPLETED');
    assert.ok(res.body.data.completed_at);
    assert.equal(res.body.data.items.find((i: any) => i.product_id === prod2).delivered_quantity, 3);

    assert.equal(await centralQty(prod1), c1 - 10);
    assert.equal(await centralQty(prod2), c2 - 3);
    const a1 = await branchRow(branchAId, prod1);
    assert.equal(Number(a1.received_quantity), 22);
    assert.equal(Number(a1.available_quantity), 18);
    assert.equal(Number(a1.sold_quantity), 4);
    const a2 = await branchRow(branchAId, prod2);
    assert.equal(Number(a2.available_quantity), 3);

    const movements = res.body.data.movements as any[];
    assert.equal(movements.length, 4);
    assert.equal(movements.filter((m) => m.movement_type === 'REPLENISHMENT_OUT' && m.location_type === 'CENTRAL').length, 2);
    assert.equal(movements.filter((m) => m.movement_type === 'REPLENISHMENT_IN' && m.branch_id === branchAId).length, 2);
    assert.ok(movements.every((m) => m.replenishment_request_id === requestId && m.performed_by_name));
  });

  it('notifica al distribuidor la finalización (solo su sede)', async () => {
    const mine = await call('GET', '/notifications', distAToken);
    assert.ok(mine.body.data.notifications.some((n: any) => n.type === 'REPLENISHMENT_COMPLETED' && n.replenishment_request_id === requestId));
    const other = await call('GET', '/notifications', distBToken);
    assert.ok(!other.body.data.notifications.some((n: any) => n.replenishment_request_id === requestId));
  });

  it('no duplica la entrega al repetir la operación (409) y el stock no cambia', async () => {
    const c1 = await centralQty(prod1);
    const again = await call('PUT', `/replenishments/${requestId}/deliver`, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 10 }, { product_id: prod2, delivered_quantity: 3 }] });
    assert.equal(again.status, 409);
    assert.equal(again.body.error.code, 'REPLENISHMENT_ALREADY_COMPLETED');
    assert.equal(await centralQty(prod1), c1);
    assert.equal(Number((await branchRow(branchAId, prod1)).available_quantity), 18);
  });

  it('el saldo actual refleja la nueva entrega en la siguiente consulta (entregado 22, ventas 4, saldo 18)', async () => {
    const created = await call('POST', '/replenishments', distAToken, { items: [{ product_id: prod1, quantity: 2 }] });
    const res = await call('GET', `/replenishments/${created.body.data.id}`, logisticsToken);
    assert.equal(res.body.data.items[0].insight.delivered_total, 22);
    assert.equal(res.body.data.items[0].insight.sold_total, 4);
    assert.equal(res.body.data.items[0].insight.current_balance, 18);
  });

  it('permite entrega parcial (menor a lo solicitado) con líneas en cero', async () => {
    const created = await call('POST', '/replenishments', distBToken, { items: [{ product_id: prod1, quantity: 4 }, { product_id: prod2, quantity: 2 }] });
    const res = await call('PUT', `/replenishments/${created.body.data.id}/deliver`, logisticsToken, { items: [{ product_id: prod1, delivered_quantity: 2 }, { product_id: prod2, delivered_quantity: 0 }] });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'COMPLETED');
    assert.equal(res.body.data.movements.length, 2);
    assert.equal(Number((await branchRow(branchBId, prod1)).available_quantity), 2);
    assert.equal(await branchRow(branchBId, prod2), null);
  });

  it('las notificaciones se pueden marcar como leídas', async () => {
    const list = await call('GET', '/notifications', logisticsToken);
    const first = list.body.data.notifications[0];
    assert.equal((await call('PUT', `/notifications/${first.id}/read`, logisticsToken)).status, 200);
    assert.equal((await call('PUT', `/notifications/${first.id}/read`, distAToken)).status, 404);
    assert.equal((await call('PUT', '/notifications/read-all', logisticsToken)).status, 200);
    assert.equal((await call('GET', '/notifications', logisticsToken)).body.data.unread, 0);
  });
});
