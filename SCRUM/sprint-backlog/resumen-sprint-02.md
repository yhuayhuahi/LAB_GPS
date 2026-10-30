---
tipo: sprint-summary
sprint: Sprint 2
duracion: 2 semanas
story_points: 21
estado: done
periodo: Semanas 08 - 09
tags:
  - sprint-summary
  - sprint-2
---

# Resumen del Sprint 2: Inventario Central, Despacho en Consignación y Alertas

## 1. Objetivo del Sprint (Sprint Goal)
Implementar la gestión integral del inventario editorial de **QSY**, automatizando los despachos de lotes de libros en consignación desde el Almacén Central hacia las 3 distribuidoras aliadas de Arequipa, habilitando la confirmación digital de recepción por los distribuidores, la trazabilidad estricta de mermas y muestras justificadas, y un sistema proactivo de alertas automáticas ante niveles de stock crítico.

---

## 2. Parámetros de Planificación
* **Duración:** 2 semanas (Semanas 08 y 09 del calendario de desarrollo).
* **Capacidad del Equipo:** 115 horas-hombre / semana = **230 horas-hombre totales** (1 Scrum Master / DB, 2 Desarrolladores Full-Stack, 1 QA Tester).
* **Carga de Trabajo Comprometida:** **21 Story Points (SP)**.
* **Entregable / Hito 2:** Módulo operativo de Inventario y Distribución con Almacén Central, gestión de remesas con códigos `DESP-YYYY-XXXX`, confirmación digital de recepción en tienda, kardex de salidas especiales y balance multisede en tiempo real.

---

## 3. Historias de Usuario Completadas en el Sprint 2

| ID | Título | Módulo | Rol | Story Points | Prioridad MoSCoW | Estado |
|---|---|---|---|---|---|---|
| `[[HU-04]]` | Registro de despacho de libros en consignación | M2 - Inventario y Distribución | Logística | **5 SP** | Must Have | `done` |
| `[[HU-05]]` | Confirmación digital de recepción por la distribuidora | M2 - Inventario y Distribución | Distribuidor | **3 SP** | Must Have | `done` |
| `[[HU-06]]` | Consulta de stock central y en consignación por sede | M2 - Inventario y Distribución | Logística / Admin | **5 SP** | Must Have | `done` |
| `[[HU-07]]` | Registro de salidas no comerciales y mermas justificadas | M2 - Inventario y Distribución | Logística / Admin | **5 SP** | Must Have | `done` |
| `[[HU-08]]` | Alertas automáticas de stock crítico por distribuidora | M2 - Inventario y Distribución | Logística | **3 SP** | Must Have | `done` |
| **TOTAL** | **5 Historias de Usuario Comprometidas** | — | — | **21 SP** | — | **100% Completado** |

---

## 4. Descomposición Técnica de las 17 Tareas del Sprint 2

| ID Tarea | Título Técnico | Componente | Responsable | Estimación | Estado |
|---|---|---|---|---|---|
| TASK-04-01 | Script DDL para central_stock y tablas de consignación | Base de Datos | Yourdyy | 3 h | `done` |
| TASK-04-02 | Endpoints REST de despacho en consignación y validación RN-01 | Backend | Leonardo | 5 h | `done` |
| TASK-04-03 | Interfaz web de preparación y emisión de despachos | Frontend | Miguel | 5 h | `done` |
| TASK-04-04 | Pruebas de integración de despacho y validación de stock central | QA | Dolly | 3 h | `done` |
| TASK-05-01 | Endpoints REST de recepción de lotes y acreditación en branch_stock | Backend | Leonardo | 4 h | `done` |
| TASK-05-02 | Interfaz web móvil (Mobile-First) de confirmación y reporte de discrepancias | Frontend | Miguel | 4 h | `done` |
| TASK-05-03 | Pruebas funcionales de recepción conforme y aislamiento por sede (RN-05) | QA | Dolly | 2 h | `done` |
| TASK-06-01 | Endpoints REST de matriz de balance consolidado y restricción territorial | Backend | Leonardo | 4 h | `done` |
| TASK-06-02 | Interfaz web de matriz de inventario y vista de mostrador por sede | Frontend | Miguel | 5 h | `done` |
| TASK-06-03 | Pruebas de visibilidad cruzada para Admin y restricción para Distribuidor | QA | Dolly | 3 h | `done` |
| TASK-07-01 | Script DDL tabla non_commercial_exits y modelo de kardex de bajas | Base de Datos | Yourdyy | 3 h | `done` |
| TASK-07-02 | Endpoints REST de salidas especiales con validación de justificación (RN-07) | Backend | Leonardo | 4 h | `done` |
| TASK-07-03 | Interfaz web modal para registro de muestras docentes y mermas | Frontend | Miguel | 4 h | `done` |
| TASK-07-04 | Pruebas de validación estricta de motivo (RN-07) y descuento en kardex | QA | Dolly | 2 h | `done` |
| TASK-08-01 | Servicio y endpoints REST de detección de stock crítico y umbrales | Backend | Leonardo | 3 h | `done` |
| TASK-08-02 | Componente visual de alertas dinámicas con insignias y resaltado en rojo | Frontend | Miguel | 4 h | `done` |
| TASK-08-03 | Pruebas de activación y normalización automática de alertas ante reposición | QA | Dolly | 2 h | `done` |
| **TOTAL** | **17 Tareas Técnicas Ejecutadas** | — | — | **60 h** | **100% done** |

---

## 5. Implementación en Código Fuente por Historia de Usuario

### 🔹 HU-04: Registro de despacho de libros en consignación (5 SP)
- **Base de Datos:** Tablas `central_stock`, `consignments` y `consignment_items` en `schema.sql`.
- **Backend:**
  - `consignment.service.ts`: Método `createDispatch` con validación de existencias en Almacén Central (RN-01) y descuento atómico. Generación automática de código `DESP-YYYY-XXXX`.
  - `consignment.routes.ts`: Protegido exclusivamente para roles `ADMIN` y `LOGISTICS`.
- **Frontend:**
  - `ConsignmentsView.tsx`: Formulario modal de alta de despacho con selector de distribuidora, adición dinámica de partidas y validación de stock disponible.
- **QA:** Casos de prueba en `sprint2.integration.test.ts` (ingreso a central, despacho exitoso, bloqueo ante sobreventa).

### 🔹 HU-05: Confirmación digital de recepción por la distribuidora (3 SP)
- **Base de Datos:** Actualización de estados (`PENDING` ➔ `RECEIVED` / `OBSERVED`) y campo `received_at` en `consignments`.
- **Backend:**
  - `consignment.service.ts`: Método `confirmReception` que suma unidades a `branch_stock`.
  - Aplicación forzosa de RN-05: un distribuidor solo puede confirmar remesas dirigidas a su propia sede (403 `BRANCH_ACCESS_DENIED`).
- **Frontend:**
  - `ConsignmentsView.tsx`: Botones de acción táctil móvil: "Conforme" (1 clic) y "Observar Faltante" (modal para reportar ejemplares dañados o faltantes).
- **QA:** Pruebas de confirmación conforme, confirmación con discrepancia y bloqueo entre sedes.

### 🔹 HU-06: Consulta de stock central y en consignación por sede (5 SP)
- **Backend:**
  - `inventory.service.ts`: Método `getInventoryBalance`.
  - Para `ADMIN`/`LOGISTICS`: Retorna matriz consolidada con Almacén Central, En Tránsito y cada una de las 3 sucursales.
  - Para `DISTRIBUTOR`: Restringe automáticamente la respuesta al inventario de su tienda física (RN-05).
- **Frontend:**
  - `InventoryView.tsx`: Tabla de balance consolidado multisede con totales calculados y vista especializada de mostrador para vendedores.
- **QA:** Pruebas automatizadas de visibilidad global y aislamiento estricto.

### 🔹 HU-07: Registro de salidas no comerciales y mermas justificadas (5 SP)
- **Base de Datos:** Tabla `non_commercial_exits` con tipos de movimiento (`MUESTRA_DOCENTE`, `CORTESIA`, `PROMOCION`, `SORTEO`, `MERMA_DANO`, `AJUSTE`).
- **Backend:**
  - `inventory.service.ts`: Método `registerNonCommercialExit` con validación Zod de motivo obligatorio $\ge 5$ caracteres (RN-07).
  - Descuento exacto en `central_stock` o en `branch_stock` según el origen.
- **Frontend:**
  - `InventoryView.tsx`: Modal para registro de bajas y tabla histórica auditable de salidas especiales.
- **QA:** Pruebas de validación de justificación, bloqueo por saldo insuficiente y rechazo a distribuidores sin autorización.

### 🔹 HU-08: Alertas automáticas de stock crítico por distribuidora (3 SP)
- **Backend:**
  - `inventory.service.ts`: Método `getCriticalAlerts` que detecta productos con existencias $\le 3$ en distribuidoras y $\le 5$ en almacén central.
- **Frontend:**
  - `Navbar.tsx`: Badge animado con conteo de alertas activas.
  - `InventoryView.tsx`: Banner de alerta roja en cabecera y celdas resaltadas con etiquetas de stock crítico.
- **QA:** Pruebas de activación automática al descender a $\le 3$ unidades y normalización inmediata tras reposición.

