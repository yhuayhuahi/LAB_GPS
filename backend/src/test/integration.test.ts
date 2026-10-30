import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../app';

let server: http.Server;
let baseUrl: string;

const runSuffix = `${Date.now().toString().slice(-4)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
const branchCodeA = `TRILCE-${runSuffix}`;
const branchCodeB = `SIGLOXX-${runSuffix}`;
const sellerEmail = `vendedor.${runSuffix.toLowerCase()}@editorialqsy.com`;
const productCode = `QSY-BAS-${runSuffix}`;

let adminToken = '';
let branchAId = '';
let branchBId = '';
let distributorToken = '';
let productId = '';

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
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Sprint 1 - Integration Test Suite (Dolly / QA)', () => {

  // ============================================================================
  // HU-01: Autenticación, RBAC y Aislamiento por Sede (TASK-01-06)
  // ============================================================================
  describe('HU-01: Autenticación y Control de Acceso RBAC (TASK-01-06)', () => {
    it('1. Debe iniciar sesión exitosamente como Super-Administrador (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@editorialqsy.com',
          password: 'Admin123!'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.token, 'Debe devolver un JWT');
      assert.equal(body.data.user.role, 'ADMIN');
      adminToken = body.data.token;
    });

    it('2. Debe rechazar inicio de sesión con contraseña inválida (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@editorialqsy.com',
          password: 'PasswordErrada999!'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 401);
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    });

    it('3. Debe rechazar inicio de sesión con usuario inexistente (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'noexiste@editorialqsy.com',
          password: 'PasswordValida123!'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 401);
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    });

    it('4. Debe obtener información del usuario actual mediante /auth/me con token válido', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.email, 'admin@editorialqsy.com');
      assert.equal(body.data.role, 'ADMIN');
    });

    it('5. Debe rechazar peticiones sin token con 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      assert.equal(res.status, 401);
    });

    it('6. Debe rechazar peticiones con token manipulado o falsificado (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer token-totalmente-falso-y-manipulado' }
      });
      assert.equal(res.status, 401);
    });
  });

  // ============================================================================
  // HU-02: Gestión del Padrón de Sedes y Personal (TASK-02-04)
  // ============================================================================
  describe('HU-02: Gestión de Distribuidoras y Asignación de Personal (TASK-02-04)', () => {
    it('1. El Administrador puede dar de alta una nueva sede (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: branchCodeA,
          name: 'Distribuidora Trilce Arequipa',
          address: 'Calle San Juan de Dios 214, Cercado',
          phone: '959123456',
          manager_name: 'Carlos Mendoza',
          observations: 'Punto de venta principal'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.code, branchCodeA);
      branchAId = body.data.id;
    });

    it('2. El Administrador crea una segunda sede para pruebas de aislamiento', async () => {
      const res = await fetch(`${baseUrl}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: branchCodeB,
          name: 'Distribuidora Siglo XX',
          address: 'Av. Siglo XX 108, Cercado',
          phone: '958765432',
          manager_name: 'Juana Pérez',
          observations: 'Punto de venta secundario'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 201);
      assert.equal(body.success, true);
      branchBId = body.data.id;
    });

    it('3. Debe rechazar creación de sede con código duplicado (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: branchCodeA,
          name: 'Distribuidora Duplicada',
          address: 'Cualquier direccion 123'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 409);
      assert.equal(body.error.code, 'BRANCH_CODE_EXISTS');
    });

    it('4. Debe rechazar creación de sede con campos requeridos faltantes (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: 'AB' // Código muy corto y falta address, name
        })
      });

      assert.equal(res.status, 400);
    });

    it('5. Debe listar las distribuidoras registradas', async () => {
      const res = await fetch(`${baseUrl}/branches`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 2);
    });

    it('6. El Administrador asigna y crea un usuario distribuidor en la Sede A (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/branches/${branchAId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email: sellerEmail,
          password: 'Vendedor123!',
          full_name: 'Roberto Valdivia',
          role_id: 'role-03',
          observations: 'Vendedor titular de Trilce'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.branch_id, branchAId);
    });

    it('7. Debe listar los usuarios asignados a la Sede A', async () => {
      const res = await fetch(`${baseUrl}/branches/${branchAId}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.some((u: any) => u.email === sellerEmail));
    });
  });

  // ============================================================================
  // Regla de Negocio Crítica: Aislamiento por Sede (RN-05 & TASK-01-04)
  // ============================================================================
  describe('RN-05: Aislamiento estricto de sucursales (enforceBranchScope)', () => {
    it('1. El usuario Distribuidor inicia sesión y obtiene su token de sede', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sellerEmail,
          password: 'Vendedor123!'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.equal(body.data.user.role, 'DISTRIBUTOR');
      assert.equal(body.data.user.branch_id, branchAId);
      distributorToken = body.data.token;
    });

    it('2. El Distribuidor PUEDE consultar la información de su propia sede (Sede A)', async () => {
      const res = await fetch(`${baseUrl}/branches/${branchAId}`, {
        headers: { Authorization: `Bearer ${distributorToken}` }
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.equal(body.data.id, branchAId);
    });

    it('3. El Distribuidor es BLOQUEADO al intentar consultar datos de otra sede (Sede B) -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/branches/${branchBId}`, {
        headers: { Authorization: `Bearer ${distributorToken}` }
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 403);
      assert.equal(body.error.code, 'BRANCH_ACCESS_DENIED');
    });

    it('4. El Distribuidor es BLOQUEADO al intentar crear una nueva sede -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorToken}`
        },
        body: JSON.stringify({
          code: 'SEDE-ILEGAL',
          name: 'Intento de creacion por distribuidor',
          address: 'Direccion falsa 123'
        })
      });

      assert.equal(res.status, 403);
    });
  });

  // ============================================================================
  // HU-03: Catálogo de Libros, Precios y Comisiones Fijas (TASK-03-04)
  // ============================================================================
  describe('HU-03: Catálogo de Libros y Reglas de Tarifas (TASK-03-04)', () => {
    it('1. El Administrador registra un libro en el catálogo (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: productCode,
          title: 'Quechua Collao: Nivel Básico Comunicativo',
          education_level: 'Básico',
          isbn: '978-612-48123-0-1',
          public_price: 35.0,
          fixed_commission: 5.0,
          observations: 'Texto guía primer ciclo'
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.code, productCode);
      assert.equal(Number(body.data.public_price), 35.0);
      assert.equal(Number(body.data.fixed_commission), 5.0);
      productId = body.data.id;
    });

    it('2. Debe rechazar si la comisión fija es mayor o igual al precio de venta (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: `ERR-${runSuffix}`,
          title: 'Libro con comisión absurda',
          education_level: 'Básico',
          public_price: 20.0,
          fixed_commission: 25.0 // Comisión > Precio
        })
      });

      assert.equal(res.status, 400);
    });

    it('3. Debe rechazar alta con código de producto duplicado (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          code: productCode,
          title: 'Otro libro con mismo código',
          education_level: 'Avanzado',
          public_price: 40.0,
          fixed_commission: 6.0
        })
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 409);
      assert.equal(body.error.code, 'PRODUCT_CODE_EXISTS');
    });

    it('4. RN-03: Distribuidor NO puede crear libros en el catálogo (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorToken}`
        },
        body: JSON.stringify({
          code: `DIS-${runSuffix}`,
          title: 'Libro creado por vendedor',
          education_level: 'Básico',
          public_price: 30.0,
          fixed_commission: 4.0
        })
      });

      assert.equal(res.status, 403);
    });

    it('5. RN-03: Distribuidor NO puede alterar precios o comisiones (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${distributorToken}`
        },
        body: JSON.stringify({
          public_price: 15.0
        })
      });

      assert.equal(res.status, 403);
    });

    it('6. El Distribuidor PUEDE consultar el catálogo de libros con sus precios oficiales', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${distributorToken}` }
      });

      const body = (await res.json()) as any;
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data));
      const found = body.data.find((p: any) => p.code === productCode);
      assert.ok(found, 'El libro registrado debe aparecer en el catálogo');
      assert.equal(Number(found.public_price), 35.0);
      assert.equal(Number(found.fixed_commission), 5.0);
    });
  });

});
