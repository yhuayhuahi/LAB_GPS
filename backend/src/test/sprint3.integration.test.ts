import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { app } from '../app';

let server: http.Server;
let baseUrl = '';
let token = '';
let saleId = '';
const saleUuid = randomUUID();

before(async () => {
  await new Promise<void>((resolve) => { server = http.createServer(app); server.listen(0, '127.0.0.1', () => { const address = server.address() as any; baseUrl = `http://127.0.0.1:${address.port}/api/v1`; resolve(); }); });
  const login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'distribuidor.trilce@editorialqsy.com', password: 'Admin123!' }) });
  token = ((await login.json()) as any).data.token;
});
after(() => server.close());

describe('Sprint 3 - ventas móviles', () => {
  it('registra una venta, es idempotente y bloquea sobreventa', async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const body = { client_sale_uuid: saleUuid, customer_name: 'Prueba Sprint Tres', customer_dni: '87654321', payment_method: 'YAPE', items: [{ product_id: 'prod-04', quantity: 1 }] };
    const first = await fetch(`${baseUrl}/sales`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal(first.status, 201); saleId = ((await first.json()) as any).data.id;
    const replay = await fetch(`${baseUrl}/sales`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal(((await replay.json()) as any).data.id, saleId);
    const excess = await fetch(`${baseUrl}/sales`, { method: 'POST', headers, body: JSON.stringify({ ...body, client_sale_uuid: randomUUID(), items: [{ product_id: 'prod-04', quantity: 999 }] }) });
    assert.equal(excess.status, 400);
  });

  it('entrega ticket PDF, lista la venta y la anula restaurando su estado', async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const ticket = await fetch(`${baseUrl}/sales/${saleId}/ticket`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(ticket.headers.get('content-type'), 'application/pdf');
    assert.match(await ticket.text(), /^%PDF-1.4/);
    const mine = await fetch(`${baseUrl}/sales/mine`, { headers: { Authorization: `Bearer ${token}` } });
    assert.ok(((await mine.json()) as any).data.some((sale: any) => sale.id === saleId));
    const annul = await fetch(`${baseUrl}/sales/${saleId}/annul`, { method: 'PUT', headers, body: JSON.stringify({ justification: 'Prueba automatizada de anulación' }) });
    assert.equal(((await annul.json()) as any).data.status, 'ANNULLED');
  });
});
