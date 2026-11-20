import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { app } from '../app';
import { db } from '../config/database';
import { computeLiquidation } from '../services/liquidation.service';
import { addDays, limaDayStartUtc, todayLima } from '../utils/lima-date';
import { fromCents, hasMaxTwoDecimals, toCents } from '../utils/money';

/**
 * Sprint 4 (cont.) - HU-15 (Liquidación automática con comisión fija) y HU-16 (Cobro y saldos pendientes).
 * Cada ejecución crea sus propias sedes, usuarios y libros con sufijo único.
 * Las fechas de las ventas se fijan en 2025 para controlar los períodos (la BD guarda created_at en UTC).
 */
let server: http.Server;
let baseUrl = '';
const suffix = `${Date.now().toString().slice(-5)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

let adminToken = '';
let logisticsToken = '';
let distXToken = '';
let distYToken = '';
let branchX = '';
let branchY = '';
let p1 = ''; // S/ 30.00, comisión S/ 5.00
let p2 = ''; // S/ 50.00, comisión S/ 8.00
let saleA = '';
let liq1 = '';
let liq2 = '';
let liq3 = '';
let liq4 = ''; // junio: S/ 84.00 neto (2 × (50 − 8))

const call = async (method: string, path: string, token: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: (await res.json()) as any };
};
const login = async (email: string, password: string) => {
  const res = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return ((await res.json()) as any).data.token as string;
};
/** Registra una venta real por API y luego fija su fecha (UTC) para ubicarla en el período deseado. */
const makeSale = async (items: { product_id: string; quantity: number }[], createdAtUtc: string, token = distXToken) => {
  const res = await call('POST', '/sales', token, { client_sale_uuid: randomUUID(), customer_dni: '12345678', customer_name: 'Cliente Prueba S5', payment_method: 'EFECTIVO', items });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  await db.execute('UPDATE sales SET created_at = $1 WHERE id = $2', [createdAtUtc, res.body.data.id]);
  return res.body.data.id as string;
};

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
  const mail = (k: string) => `s5.${k}.${suffix.toLowerCase()}@editorialqsy.com`;
  branchX = (await call('POST', '/branches', adminToken, { code: `S5X-${suffix}`, name: `Sede S5 X ${suffix}`, address: 'Calle Uno 123, Arequipa' })).body.data.id;
  branchY = (await call('POST', '/branches', adminToken, { code: `S5Y-${suffix}`, name: `Sede S5 Y ${suffix}`, address: 'Calle Dos 456, Arequipa' })).body.data.id;
  await call('POST', `/branches/${branchX}/users`, adminToken, { email: mail('x'), password: 'Password123!', full_name: 'Vendedor S5 X' });
  await call('POST', `/branches/${branchY}/users`, adminToken, { email: mail('y'), password: 'Password123!', full_name: 'Vendedor S5 Y' });
  distXToken = await login(mail('x'), 'Password123!');
  distYToken = await login(mail('y'), 'Password123!');
  p1 = (await call('POST', '/products', adminToken, { code: `S5-P1-${suffix}`, title: 'Libro S5 A', education_level: 'Básico', public_price: 30, fixed_commission: 5 })).body.data.id;
  p2 = (await call('POST', '/products', adminToken, { code: `S5-P2-${suffix}`, title: 'Libro S5 B', education_level: 'Básico', public_price: 50, fixed_commission: 8 })).body.data.id;
  for (const [branch, prod] of [[branchX, p1], [branchX, p2]]) {
    await db.execute(
      `INSERT INTO branch_stock (id, branch_id, product_id, received_quantity, sold_quantity, available_quantity, updated_at) VALUES ($1, $2, $3, 500, 0, 500, CURRENT_TIMESTAMP)`,
      [randomUUID(), branch, prod]
    );
  }
});

after(() => server.close());

describe('Utilidades monetarias y de fechas', () => {
  it('trabaja en céntimos sin errores de punto flotante', () => {
    assert.equal(toCents(0.1) + toCents(0.2), 30);
    assert.equal(fromCents(toCents(19.99) * 3), 59.97);
    assert.equal(hasMaxTwoDecimals(10.55), true);
    assert.equal(hasMaxTwoDecimals(10.555), false);
  });
  it('interpreta los días en hora de Lima (UTC-5)', () => {
    assert.equal(limaDayStartUtc('2025-03-01'), '2025-03-01 05:00:00');
    assert.equal(addDays('2025-03-31', 1), '2025-04-01');
    assert.equal(addDays('2025-12-31', 7), '2026-01-07');
  });
  it('computeLiquidation separa precios distintos y suma exacto', () => {
    const lines = [
      { sale_id: 's1', product_id: 'a', code: 'A', title: 'A', quantity: 3, unit_price: 10.1, unit_commission: 0.1 },
      { sale_id: 's2', product_id: 'a', code: 'A', title: 'A', quantity: 2, unit_price: 10.1, unit_commission: 0.1 },
      { sale_id: 's3', product_id: 'a', code: 'A', title: 'A', quantity: 1, unit_price: 12.35, unit_commission: 0.35 }
    ];
    const c = computeLiquidation(lines);
    assert.equal(c.items.length, 2);
    assert.equal(c.salesCount, 3);
    assert.equal(fromCents(c.grossCents), 62.85); // 5×10.10 + 12.35
    assert.equal(fromCents(c.commissionCents), 0.85); // 5×0.10 + 0.35
    assert.equal(fromCents(c.netCents), 62.0);
  });
});

describe('HU-15: Liquidación automática con deducción de comisión fija', () => {
  before(async () => {
    saleA = await makeSale([{ product_id: p1, quantity: 12 }], '2025-03-05 15:00:00');
    await makeSale([{ product_id: p1, quantity: 8 }], '2025-03-31 04:59:59'); // 30-mar 23:59:59 Lima: incluida
    await makeSale([{ product_id: p2, quantity: 1 }], '2025-04-01 05:00:00'); // 1-abr 00:00 Lima: fuera
    await makeSale([{ product_id: p2, quantity: 1 }], '2025-03-01 04:59:59'); // 28-feb 23:59:59 Lima: fuera
    const annulled = await makeSale([{ product_id: p1, quantity: 3 }], '2025-03-10 15:00:00');
    assert.equal((await call('PUT', `/sales/${annulled}/annul`, distXToken, { justification: 'Error de digitación en prueba' })).status, 200);
  });

  it('Escenario 1: calcula bruto, comisión y neto (20 × S/30, comisión S/5 → 600 / 100 / 500)', async () => {
    const res = await call('GET', `/liquidations/preview?branch_id=${branchX}&period_start=2025-03-01&period_end=2025-03-31`, logisticsToken);
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.equal(d.gross_amount, 600);
    assert.equal(d.commission_amount, 100);
    assert.equal(d.net_amount, 500);
    assert.equal(d.sales_count, 2); // la anulada y las de los límites no cuentan
    assert.equal(d.details.length, 1);
    assert.deepEqual(
      { q: d.details[0].quantity, p: d.details[0].unit_price, c: d.details[0].unit_commission, g: d.details[0].gross_subtotal, cs: d.details[0].commission_subtotal },
      { q: 20, p: 30, c: 5, g: 600, cs: 100 }
    );
    assert.equal(d.due_date, '2025-04-07'); // fin de período + 7 días
  });

  it('la previsualización no guarda nada', async () => {
    const n = await db.queryOne<any>('SELECT count(*) as c FROM liquidations WHERE branch_id = $1', [branchX]);
    assert.equal(Number(n.c), 0);
  });

  it('solo Logística/Admin pueden calcular y generar (el distribuidor recibe 403)', async () => {
    assert.equal((await call('GET', `/liquidations/preview?branch_id=${branchX}&period_start=2025-03-01&period_end=2025-03-31`, distXToken)).status, 403);
    assert.equal((await call('POST', '/liquidations', distXToken, { branch_id: branchX, period_start: '2025-03-01', period_end: '2025-03-31' })).status, 403);
  });

  it('valida el período y la sede', async () => {
    const post = (b: unknown) => call('POST', '/liquidations', logisticsToken, b);
    assert.equal((await post({ branch_id: branchX, period_start: '2025-03-31', period_end: '2025-03-01' })).status, 400);
    assert.equal((await post({ branch_id: branchX, period_start: '2025-02-30', period_end: '2025-03-01' })).status, 400);
    assert.equal((await post({ branch_id: branchX, period_start: '01/03/2025', period_end: '2025-03-31' })).status, 400);
    assert.equal((await post({ branch_id: branchX, period_start: '2025-03-01', period_end: '2999-01-01' })).body.error.code, 'PERIOD_IN_FUTURE');
    assert.equal((await post({ branch_id: 'no-existe', period_start: '2025-03-01', period_end: '2025-03-31' })).status, 404);
    assert.equal((await call('GET', '/liquidations/preview?branch_id=x', logisticsToken)).status, 400);
  });

  it('RN-06: rechaza cualquier intento de enviar comisión o importes manuales (400)', async () => {
    for (const extra of [{ commission: 0 }, { unit_commission: 1 }, { net_amount: 999 }]) {
      const res = await call('POST', '/liquidations', logisticsToken, { branch_id: branchX, period_start: '2025-03-01', period_end: '2025-03-31', ...extra });
      assert.equal(res.status, 400);
    }
  });

  it('no genera liquidación si no hay ventas en el período (400)', async () => {
    const res = await call('POST', '/liquidations', logisticsToken, { branch_id: branchX, period_start: '2025-01-01', period_end: '2025-01-31' });
    assert.equal(res.body.error.code, 'NO_SALES_TO_LIQUIDATE');
  });

  it('genera y guarda la liquidación con su detalle congelado', async () => {
    const res = await call('POST', '/liquidations', logisticsToken, { branch_id: branchX, period_start: '2025-03-01', period_end: '2025-03-31', notes: 'Marzo' });
    assert.equal(res.status, 201);
    const l = res.body.data;
    assert.match(l.liquidation_code, /^LIQ-\d{4}-\d{4}$/);
    assert.equal(l.status, 'PENDING');
    assert.equal(l.net_amount, 500);
    assert.equal(l.pending_amount, 500);
    assert.equal(l.paid_amount, 0);
    assert.equal(l.sales_count, 2);
    assert.equal(l.branch_id, branchX);
    assert.equal(l.details[0].title_snapshot, 'Libro S5 A');
    assert.equal(l.created_by_name.length > 0, true);
    liq1 = l.id;
  });

  it('evita liquidar dos veces las mismas ventas (400) y aun con períodos solapados no hay doble conteo', async () => {
    const again = await call('POST', '/liquidations', logisticsToken, { branch_id: branchX, period_start: '2025-03-01', period_end: '2025-03-31' });
    assert.equal(again.body.error.code, 'NO_SALES_TO_LIQUIDATE');
    await makeSale([{ product_id: p1, quantity: 1 }], '2025-03-15 15:00:00'); // venta nueva dentro de un período ya liquidado
    const preview = await call('GET', `/liquidations/preview?branch_id=${branchX}&period_start=2025-03-01&period_end=2025-03-31`, logisticsToken);
    assert.equal(preview.body.data.sales_count, 1);
    assert.equal(preview.body.data.already_liquidated_sales, 2);
    assert.equal(preview.body.data.gross_amount, 30);
    const second = await call('POST', '/liquidations', logisticsToken, { branch_id: branchX, period_start: '2025-03-01', period_end: '2025-03-31' });
    assert.equal(second.status, 201);
    assert.equal(second.body.data.net_amount, 25);
    liq2 = second.body.data.id;
  });

  it('la base de datos impide que una venta pertenezca a dos liquidaciones', async () => {
    await assert.rejects(db.execute('INSERT INTO liquidation_sales (sale_id, liquidation_id) VALUES ($1, $2)', [saleA, liq2]));
  });

  it('dos generaciones simultáneas del mismo período producen una sola liquidación', async () => {
    await makeSale([{ product_id: p2, quantity: 2 }], '2025-06-10 15:00:00');
    const body = { branch_id: branchX, period_start: '2025-06-01', period_end: '2025-06-30' };
    const results = await Promise.all([call('POST', '/liquidations', logisticsToken, body), call('POST', '/liquidations', adminToken, body)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 400]);
    liq4 = results.find((r) => r.status === 201)!.body.data.id;
    assert.equal(results.find((r) => r.status === 201)!.body.data.net_amount, 84);
    const n = await db.queryOne<any>(`SELECT count(*) as c FROM liquidations WHERE branch_id = $1 AND period_start = '2025-06-01'`, [branchX]);
    assert.equal(Number(n.c), 1);
  });

  it('no permite anular una venta que ya fue liquidada (409)', async () => {
    const res = await call('PUT', `/sales/${saleA}/annul`, distXToken, { justification: 'Intento posterior a la liquidación' });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'SALE_ALREADY_LIQUIDATED');
  });

  it('un cambio posterior de precio/comisión del catálogo no altera liquidaciones anteriores y las nuevas usan lo congelado en cada venta', async () => {
    await call('PUT', `/products/${p1}`, adminToken, { public_price: 35, fixed_commission: 6 });
    const before = await call('GET', `/liquidations/${liq1}`, logisticsToken);
    assert.equal(before.body.data.net_amount, 500);
    assert.equal(before.body.data.details[0].unit_price, 30);
    await makeSale([{ product_id: p1, quantity: 2 }], '2025-05-10 15:00:00'); // vendida con S/ 35 y comisión S/ 6
    const res = await call('POST', '/liquidations', logisticsToken, { branch_id: branchX, period_start: '2025-05-01', period_end: '2025-05-31' });
    assert.equal(res.body.data.gross_amount, 70);
    assert.equal(res.body.data.commission_amount, 12);
    assert.equal(res.body.data.net_amount, 58);
    liq3 = res.body.data.id;
    const unchanged = await call('GET', `/liquidations/${liq1}`, logisticsToken);
    assert.equal(unchanged.body.data.details[0].unit_price, 30);
  });
});

describe('HU-16: Registro de cobro y saldos pendientes', () => {
  const pay = (id: string, body: unknown, token = logisticsToken) => call('POST', `/liquidations/${id}/payments`, token, body);

  it('rechaza montos 0, negativos, con más de 2 decimales y no numéricos', async () => {
    for (const amount of [0, -5, 10.555, '100', null]) {
      const res = await pay(liq1, { amount, payment_method: 'CASH' });
      assert.equal(res.status, 400, `monto ${JSON.stringify(amount)} debía rechazarse`);
    }
  });

  it('exige referencia para constancia/transferencia y un método válido', async () => {
    assert.equal((await pay(liq1, { amount: 10, payment_method: 'VOUCHER' })).status, 400);
    assert.equal((await pay(liq1, { amount: 10, payment_method: 'TRANSFER', evidence: 'x' })).status, 400);
    assert.equal((await pay(liq1, { amount: 10, payment_method: 'BITCOIN' })).status, 400);
  });

  it('no permite pagar más que el saldo pendiente ni con fecha futura', async () => {
    const over = await pay(liq1, { amount: 500.01, payment_method: 'CASH' });
    assert.equal(over.status, 400);
    assert.equal(over.body.error.code, 'PAYMENT_EXCEEDS_PENDING');
    assert.equal(over.body.error.details.pending_amount, 500);
    const future = await pay(liq1, { amount: 10, payment_method: 'CASH', payment_date: addDays(todayLima(), 2) });
    assert.equal(future.body.error.code, 'PAYMENT_DATE_IN_FUTURE');
    assert.equal((await call('GET', `/liquidations/${liq1}`, logisticsToken)).body.data.payments.length, 0);
  });

  it('solo Logística/Admin registran cobros (distribuidor 403) y la liquidación debe existir', async () => {
    assert.equal((await pay(liq1, { amount: 10, payment_method: 'CASH' }, distXToken)).status, 403);
    assert.equal((await pay('no-existe', { amount: 10, payment_method: 'CASH' })).status, 404);
  });

  it('Escenario: S/ 500 → pago S/ 200 deja PARCIAL con saldo S/ 300', async () => {
    const res = await pay(liq1, { amount: 200, payment_method: 'CASH', payment_date: '2025-04-02' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'PARTIAL');
    assert.equal(res.body.data.paid_amount, 200);
    assert.equal(res.body.data.pending_amount, 300);
    assert.equal(res.body.data.payments.length, 1);
  });

  it('segundo pago con constancia: se conserva el historial (S/ 300 pagados, deuda S/ 200)', async () => {
    const res = await pay(liq1, { amount: 100, payment_method: 'VOUCHER', evidence: 'CONST-0001' });
    assert.equal(res.body.data.status, 'PARTIAL');
    assert.equal(res.body.data.paid_amount, 300);
    assert.equal(res.body.data.pending_amount, 200);
    const p = res.body.data.payments;
    assert.deepEqual(p.map((x: any) => [x.amount, x.payment_method]), [[200, 'CASH'], [100, 'VOUCHER']]);
    assert.equal(p[1].evidence, 'CONST-0001');
    assert.ok(p[0].registered_by_name);
  });

  it('el pago final liquida el saldo y la liquidación pasa a PAGADA; no admite más cobros (409)', async () => {
    const res = await pay(liq1, { amount: 200, payment_method: 'TRANSFER', evidence: 'OP-778899' });
    assert.equal(res.body.data.status, 'PAID');
    assert.equal(res.body.data.pending_amount, 0);
    assert.equal(res.body.data.paid_amount, 500);
    assert.equal(res.body.data.is_overdue, false);
    const extra = await pay(liq1, { amount: 1, payment_method: 'CASH' });
    assert.equal(extra.status, 409);
    assert.equal(extra.body.error.code, 'LIQUIDATION_ALREADY_PAID');
  });

  it('el saldo se calcula desde el historial: la suma de pagos coincide con paid_amount', async () => {
    const rows = await db.query<any>('SELECT amount FROM liquidation_payments WHERE liquidation_id = $1', [liq1]);
    assert.equal(rows.reduce((a, r) => a + toCents(r.amount), 0), 50000);
  });

  it('centavos exactos: 3 pagos de S/ 8.33 + S/ 0.01 saldan una liquidación de S/ 25.00', async () => {
    // liq2 neto S/ 25.00
    for (const amount of [8.33, 8.33, 8.33]) assert.equal((await pay(liq2, { amount, payment_method: 'CASH' })).status, 201);
    const mid = await call('GET', `/liquidations/${liq2}`, logisticsToken);
    assert.equal(mid.body.data.pending_amount, 0.01);
    assert.equal(mid.body.data.status, 'PARTIAL');
    const last = await pay(liq2, { amount: 0.01, payment_method: 'CASH' });
    assert.equal(last.body.data.status, 'PAID');
    assert.equal(last.body.data.pending_amount, 0);
  });

  it('panel de deudas: totales por distribuidora y vencidas', async () => {
    const res = await call('GET', '/liquidations/debts', logisticsToken);
    assert.equal(res.status, 200);
    const x = res.body.data.branches.find((b: any) => b.branch_id === branchX);
    assert.equal(x.liquidations_count, 4);
    assert.equal(x.net_total, 667); // 500 + 25 + 58 + 84
    assert.equal(x.paid_total, 525);
    assert.equal(x.pending_total, 142); // 58 + 84
    assert.equal(x.open_liquidations, 2);
    assert.equal(x.overdue_liquidations, 2); // mayo y junio de 2025 ya vencieron (fin de período + 7 días)
    assert.equal(x.overdue_pending, 142);
    assert.ok(res.body.data.total_to_collect >= 142);
    assert.ok(res.body.data.total_collected >= 525);
  });

  it('filtros por distribuidora, estado, período y vencimiento', async () => {
    const byBranch = await call('GET', `/liquidations?branch_id=${branchX}`, logisticsToken);
    assert.equal(byBranch.body.data.length, 4);
    const paid = await call('GET', `/liquidations?branch_id=${branchX}&status=PAID`, logisticsToken);
    assert.deepEqual(paid.body.data.map((l: any) => l.id).sort(), [liq1, liq2].sort());
    const pending = await call('GET', `/liquidations?branch_id=${branchX}&status=PENDING`, logisticsToken);
    assert.deepEqual(pending.body.data.map((l: any) => l.id).sort(), [liq3, liq4].sort());
    const period = await call('GET', `/liquidations?branch_id=${branchX}&from=2025-05-01&to=2025-05-31`, logisticsToken);
    assert.deepEqual(period.body.data.map((l: any) => l.id), [liq3]);
    const overdue = await call('GET', `/liquidations?branch_id=${branchX}&overdue=true`, logisticsToken);
    assert.deepEqual(overdue.body.data.map((l: any) => l.id).sort(), [liq3, liq4].sort());
    assert.equal((await call('GET', '/liquidations?status=XYZ', logisticsToken)).status, 400);
    assert.equal((await call('GET', '/liquidations?from=ayer', logisticsToken)).status, 400);
  });

  it('RN-05: cada distribuidora solo ve sus liquidaciones y deudas', async () => {
    const mine = await call('GET', '/liquidations', distXToken);
    assert.equal(mine.body.data.length, 4);
    assert.ok(mine.body.data.every((l: any) => l.branch_id === branchX));
    assert.equal((await call('GET', `/liquidations/${liq1}`, distXToken)).status, 200);
    const other = await call('GET', `/liquidations/${liq1}`, distYToken);
    assert.equal(other.status, 403);
    assert.equal(other.body.error.code, 'BRANCH_ACCESS_DENIED');
    assert.equal((await call('GET', '/liquidations', distYToken)).body.data.length, 0);
    const debtsY = await call('GET', '/liquidations/debts', distYToken);
    assert.equal(debtsY.body.data.branches.length, 0);
    assert.equal(debtsY.body.data.total_to_collect, 0);
    const debtsX = await call('GET', '/liquidations/debts', distXToken);
    assert.equal(debtsX.body.data.branches.length, 1);
    assert.equal(debtsX.body.data.total_to_collect, 142);
    // el distribuidor tampoco puede filtrar por otra sede
    const spoof = await call('GET', `/liquidations?branch_id=${branchY}`, distXToken);
    assert.ok(spoof.body.data.every((l: any) => l.branch_id === branchX));
  });
});
