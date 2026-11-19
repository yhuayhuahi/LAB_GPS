# Informe de cambios — Sprint 4 (HU-13 y HU-14)

**Módulo:** M4 – Reabastecimiento y Liquidación · **Release 1 (MVP)**  
**Base de comparación:** el proyecto del archivo `LAB_GPS.rar` (versión anterior).  
**Historias:** HU-13 *Solicitud digital de reabastecimiento por el distribuidor* · HU-14 *Reabastecimiento asistido con consulta de ventas previas*.

## 1. Resumen

El distribuidor ahora envía una solicitud formal de reposición desde la web (HU-13) y Logística la atiende viendo, **antes de viajar**, lo entregado anteriormente, las ventas y el saldo de la sede; luego registra lo realmente entregado y el sistema actualiza almacén y sede, deja los movimientos y marca la solicitud como **Completada** (HU-14).

Se siguió el principio del informe técnico: *identificar → reutilizar → complementar → modificar solo si es indispensable*. **No se modificó ninguna tabla, servicio ni pantalla existente de forma incompatible**; solo se agregaron módulos y se hicieron ediciones aditivas en archivos compartidos (ver sección 5).

### Verificación realizada
| Comprobación | Resultado |
|---|---|
| Pruebas de integración del backend (`npm test`) | **59/59 OK** (41 previas + 18 nuevas), repetidas 2 veces sobre BD limpia y sobre una copia de tu `qsy.db` |
| Migración sobre BD ya existente (tu `qsy.db` + WAL) | OK: se crean las 4 tablas nuevas y se conservan los datos |
| Backend `tsc --noEmit` | Sin errores |
| Frontend `tsc -b` | Sin errores |
| Frontend `vite build` | OK (344 kB JS) |
| Frontend `oxlint` | 0 errores · 12 advertencias (antes 9; las 3 nuevas son del patrón `setState` en `useEffect` que ya usa el resto del código) |

> **Límites de la verificación:** no hay navegador en mi entorno, así que la interfaz se comprobó con compilación, build, lint y pruebas de los validadores, **no con clics reales**. Tampoco se probó contra PostgreSQL (solo SQLite); la sintaxis `FOR UPDATE` solo se activa con `DB_CLIENT=postgres`. Recomiendo una pasada manual (sección 8).

## 2. Qué se reutilizó y qué se creó (revisión de arquitectura)

| Necesidad | Existente reutilizado | Nuevo |
|---|---|---|
| Usuario → sede | `users.branch_id`, JWT (`branchId`), `AuthUser` | — |
| Catálogo de libros | `products`, `GET /products` | — |
| Stock almacén principal | `central_stock` | — (se usa para RN-01) |
| Stock por sede (entregado / ventas / saldo) | `branch_stock` (`received`, `sold`, `available`) alimentada por HU-05 y ventas | — |
| Roles, validación, errores | `requireRoles`, `validateBody` (zod), `AppError`, `ApiResponse` | — |
| Transacciones | `db.transaction` (SQLite y PostgreSQL) | — |
| Solicitudes y detalle | — (no existía) | `replenishment_requests`, `replenishment_request_items` |
| Trazabilidad de movimientos | — (no existía; `consignments` es otro flujo) | `inventory_movements` |
| Notificaciones | — (no existía) | `notifications` + campana |

**Por qué no se usó `consignments` para la entrega:** ese flujo (HU-04/05) exige que el distribuidor confirme la recepción después; HU-14 pide que el stock de la sede se sume al registrar la entrega en el local. Reutilizar `consignments` habría obligado a alterar su estado y sus reglas. En su lugar, la reposición escribe en las **mismas** tablas de stock, de modo que “entregado histórico” suma ambos orígenes sin tocar HU-04/05.

## 3. Decisiones y supuestos (confírmalos con el equipo)

1. **Entregas parciales (el informe dice “debe definirse con el equipo”):** se permite entregar *menos* de lo solicitado (incluso 0 en algún título) pero **nunca más** que lo solicitado ni que el stock del almacén; debe entregarse al menos 1 ejemplar. Cada título solicitado debe informarse (0 si no se entrega). Cambiar esta regla es una línea en `replenishment.service.ts`.
2. **Estados:** `PENDING` (Pendiente) y `COMPLETED` (Completada); la interfaz los muestra en español.
3. **Sin cancelación/rechazo de solicitudes:** no está en HU-13/HU-14, no se agregó.
4. **Notificaciones:** internas y simples. El estado “leído” es **compartido por rol** (si un usuario de Logística la lee, queda leída para todos). El distribuidor solo ve las de su sede.
5. **Admin** puede registrar entregas (igual que en HU-04), pero **no** crear solicitudes (RN-05: solo el distribuidor de la sede).
6. **Ventas “según el periodo”:** se usa el acumulado de `branch_stock`, que ya respeta anulaciones; no se creó un concepto de “periodo de inventario” porque el sistema no lo tiene.

## 4. API nueva

Base: `/api/v1` (también `/api`). Todas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/replenishments` | DISTRIBUTOR | Crea solicitud `{ notes?, items:[{product_id, quantity}] }` → `PENDING` + notifica a Logística |
| GET | `/replenishments?status=PENDING\|COMPLETED` | Todos | Distribuidor: solo su sede · Logística/Admin: todas |
| GET | `/replenishments/:id` | Todos (RN-05) | Detalle. Logística/Admin reciben además `items[].insight` y `movements` |
| PUT | `/replenishments/:id/deliver` | LOGISTICS, ADMIN | Registra entrega `{ notes?, items:[{product_id, delivered_quantity}] }` |
| GET | `/notifications` | Todos | `{ unread, notifications[] }` según rol/sede |
| PUT | `/notifications/:id/read` · `/notifications/read-all` | Todos | Marcar leídas |

`insight` por título: `central_available`, `delivered_total`, `sold_total`, `other_exits`, `current_balance`.

Errores de negocio: `VALIDATION_ERROR`, `INVALID_PRODUCT`, `DUPLICATED_PRODUCT`, `DELIVERY_EXCEEDS_REQUEST`, `MISSING_DELIVERY_LINE`, `EMPTY_DELIVERY`, `INSUFFICIENT_CENTRAL_STOCK` (RN-01), `REPLENISHMENT_ALREADY_COMPLETED` (409), `BRANCH_ACCESS_DENIED` (403, RN-05).

## 5. Cambios por archivo (rutas relativas a la raíz del proyecto)

### 5.1. Archivos nuevos
| Ruta | Propósito |
|---|---|
| `backend/src/repositories/replenishment.repository.ts` | Consultas y operaciones transaccionales de solicitudes, insights y entrega |
| `backend/src/repositories/notification.repository.ts` | Alta, listado por rol/sede y lectura de notificaciones |
| `backend/src/services/replenishment.service.ts` | Reglas HU-13/HU-14: crear, listar, detalle asistido, entregar |
| `backend/src/services/notification.service.ts` | Servicio de la bandeja de notificaciones |
| `backend/src/controllers/replenishment.controller.ts` | Controlador de `/replenishments` |
| `backend/src/controllers/notification.controller.ts` | Controlador de `/notifications` |
| `backend/src/routes/replenishment.routes.ts` | Rutas y roles de `/replenishments` |
| `backend/src/routes/notification.routes.ts` | Rutas de `/notifications` |
| `backend/src/schemas/replenishment.schema.ts` | Validación zod de solicitud y entrega |
| `backend/src/test/sprint4.integration.test.ts` | 18 pruebas de integración HU-13/HU-14 |
| `frontend/src/views/replenishments/ReplenishmentsView.tsx` | Vista Reposición (distribuidor y Logística) |
| `frontend/src/components/common/NotificationBell.tsx` | Campana de notificaciones |
| `frontend/src/utils/quantity.ts` | Validadores de cantidades |
| `frontend/src/utils/date.ts` | Conversión de fechas SQLite/PostgreSQL |

### 5.2. Archivos modificados (respecto a la versión anterior)
| Ruta | Líneas | Cambio |
|---|---|---|
| `backend/src/db/schema.sql` | +78 | 4 tablas nuevas (`replenishment_requests`, `replenishment_request_items`, `inventory_movements`, `notifications`) y 5 índices. No se alteró ninguna tabla existente. |
| `SCRUM/docs/schemes/schema.sql` | +78 | Misma ampliación en la copia documental del esquema. |
| `backend/src/routes/index.ts` | +6 | Registra `/replenishments` y `/notifications`. |
| `backend/src/types/domain.ts` | +73 | Tipos de reposición, movimientos y notificaciones. |
| `backend/src/db/seed.ts` | +15 | Solicitud pendiente de demostración `REP-DEMO-0001` + notificación (idempotente). |
| `backend/package.json` | +1 −1 | El script `test` ahora incluye `sprint4.integration.test.ts`. |
| `frontend/src/types/index.ts` | +66 | Tipos del frontend de Sprint 4. |
| `frontend/src/services/api.ts` | +18 | Clientes `api.replenishments.*` y `api.notifications.*`. |
| `frontend/src/components/common/Navbar.tsx` | +18 −3 | Nueva pestaña **Reposición** y campana de notificaciones. |
| `frontend/src/App.tsx` | +20 −1 | Ruteo a la nueva vista y apertura de solicitud desde la campana. |
| `SCRUM/docs/schemes/01-diccionario-y-relaciones.md` | +64 | Secciones 3.11–3.14 (diccionario de las tablas nuevas). |
| `SCRUM/product-backlog/HU-13.md` | +22 −6 | Tabla de tareas, DoD y estado `review`. |
| `SCRUM/product-backlog/HU-14.md` | +32 −6 | Tabla de tareas, DoD y estado `review`. |

> Todos los cambios en archivos existentes son **aditivos** (el único reemplazo real es una línea de `package.json` y 4 líneas de `Navbar.tsx`/`App.tsx` para pasar nuevas props). No se tocaron `consignment.*`, `inventory.*`, `sale.*`, `auth.*`, `branch.*`, `product.*`, `database.ts` ni `migrate.ts`; el esquema se aplica con el `CREATE TABLE IF NOT EXISTS` que ya ejecuta `runMigrations()` al arrancar.

## 6. Detalle por tarea y commit

> **Sobre los enlaces de commit:** el formato es el de tu ejemplo, pero yo no puedo crear commits en tu repositorio de GitHub, así que cada enlace lleva `SHA_PENDIENTE_Cn`. Al ejecutar `aplicar-commits-sprint4.sh` (o los comandos de la sección 7) se generan los commits y reemplazas el SHA real. Un mismo commit puede cubrir varias tareas porque varios archivos (p. ej. el servicio) resuelven más de una a la vez.

### HU-13 · Solicitud digital de reabastecimiento por el distribuidor

#### HU13-T01 · Revisión de la estructura existente de solicitudes
**Componente:** Base de datos / Backend  
**Qué se hizo:** Se revisó el esquema completo: **no existía** ninguna tabla de solicitudes, detalle de solicitudes, movimientos de inventario ni notificaciones (solo `consignments`, que va en sentido contrario: Logística → sede). Se crearon `replenishment_requests` y `replenishment_request_items`. Se reutilizaron `users.branch_id`, `branches`, `products` y `central_stock`/`branch_stock`.  
**Archivos:** `backend/src/db/schema.sql` (+ copia documental `SCRUM/docs/schemes/schema.sql`)  
**Commit:** [feat(db): add replenishment requests, movements and notifications tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C1)

#### HU13-T02 · Formulario de solicitud
**Componente:** Frontend  
**Qué se hizo:** Nueva pestaña **Reposición** y botón **Solicitar Reposición**: catálogo vigente (`api.products.list(false)`), agregar/quitar títulos, cantidad por título (con el stock actual en mostrador como ayuda), resumen de títulos/ejemplares y botón **Enviar**. Se reutilizaron estilos, modales y el patrón de las vistas existentes (no se duplicó ninguna pantalla).  
**Archivos:** `frontend/src/views/replenishments/ReplenishmentsView.tsx` (nuevo), `frontend/src/components/common/Navbar.tsx`, `frontend/src/App.tsx`  
**Commit:** [feat(ui): add Solicitar Reposición form and Logistics delivery view](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C8)

#### HU13-T03 · Validaciones de cantidades
**Componente:** Frontend / Backend  
**Qué se hizo:** Regla: entero **> 0**. Frontend: `validateRequestedQty` (rechaza vacío, texto, `0`, negativos, decimales con `.` o `,`, > 100000) con mensajes por línea. Backend: esquema zod `createReplenishmentSchema` (rechaza `0`, `-5`, `2.5`, `"3"`, `null`) — también bloquea peticiones externas.  
**Archivos:** `frontend/src/utils/quantity.ts` (nuevo), `backend/src/schemas/replenishment.schema.ts` (nuevo)  
**Commit:** [feat(api): add replenishment domain types and quantity validation schemas](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C2)

#### HU13-T04 · Servicio de registro de solicitudes
**Componente:** Backend  
**Qué se hizo:** `POST /api/v1/replenishments`: valida libros existentes/activos y no repetidos, genera código `REP-AAAA-NNNN`, guarda cabecera + detalle con estado `PENDING` y fecha, todo en **una transacción**.  
**Archivos:** `backend/src/services/replenishment.service.ts`, `backend/src/repositories/replenishment.repository.ts`, `backend/src/controllers/replenishment.controller.ts`, `backend/src/routes/replenishment.routes.ts`, `backend/src/routes/index.ts`  
**Commit:** [feat(api): add replenishment and notification services, controllers and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C4)

#### HU13-T05 · Asociación con la sede (RN-05)
**Componente:** Backend / Base de datos  
**Qué se hizo:** La sede **nunca** se lee del cuerpo: sale del token (`user.branch_id`); si el cliente envía otro `branch_id`, se ignora. Solo rol `DISTRIBUTOR` puede crear (Logística/Admin reciben 403). Un distribuidor solo lista y abre solicitudes de su sede (403 en las ajenas) y no ve datos del almacén central.  
**Archivos:** `backend/src/services/replenishment.service.ts`, `backend/src/routes/replenishment.routes.ts`  
**Commit:** [feat(api): add replenishment and notification services, controllers and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C4)

#### HU13-T06 · Notificación a Logística
**Componente:** Backend / Frontend  
**Qué se hizo:** No existía sistema de notificaciones: se creó uno simple (tabla `notifications`, `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`). Al registrar una solicitud se notifica a Logística (sede, código, totales, fecha) en la misma transacción. Campana en la barra con contador y refresco cada 30 s; al pulsar una notificación se abre la solicitud. También se notifica al distribuidor cuando la entrega se completa.  
**Archivos:** `backend/src/repositories/notification.repository.ts`, `backend/src/services/notification.service.ts`, `backend/src/controllers/notification.controller.ts`, `backend/src/routes/notification.routes.ts` (nuevos); `frontend/src/components/common/NotificationBell.tsx` (nuevo), `Navbar.tsx`, `App.tsx`  
**Commit:** [feat(ui): add notification bell and Reposición navigation tab](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C9)

#### HU13-T07 · Pruebas de HU-13
**Componente:** Testing  
**Qué se hizo:** 7 pruebas de integración: solicitud con varios libros en `PENDING`, sede tomada del token, notificación a Logística, rechazo de `0/-5/2.5/"3"/null`, lista vacía, libro inexistente o repetido, roles (403) y aislamiento RN-05.  
**Archivos:** `backend/src/test/sprint4.integration.test.ts` (nuevo), `backend/package.json` (script `test`)  
**Commit:** [test(api): cover HU-13 and HU-14 acceptance criteria and business rules](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C6)

### HU-14 · Reabastecimiento asistido con consulta de ventas previas

#### HU14-T01 · Revisión de solicitudes de HU-13 y permisos
**Componente:** Backend / Base de datos  
**Qué se hizo:** Se verificó que el detalle trae libros, cantidades, sede, solicitante y estado, y que Logística/Admin pueden listar todas (`GET /replenishments`, filtro `?status=`).  
**Archivos:** `backend/src/services/replenishment.service.ts`  
**Commit:** [feat(api): add replenishment and notification services, controllers and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C4)

#### HU14-T02 · Vista de solicitudes para Logística
**Componente:** Frontend  
**Qué se hizo:** Para Logística/Admin la pestaña **Reposición** muestra la bandeja (por defecto *Pendientes*, filtro por estado): código, sede, fecha, estado, títulos y botón **Revisar y entregar** / **Ver detalle**.  
**Archivos:** `frontend/src/views/replenishments/ReplenishmentsView.tsx`  
**Commit:** [feat(ui): add Solicitar Reposición form and Logistics delivery view](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C8)

#### HU14-T03 · Stock entregado anteriormente
**Componente:** Backend / Base de datos  
**Qué se hizo:** Se reutilizó `branch_stock.received_quantity`, que ya acumula **todas** las entregas históricas (despachos HU-05 confirmados + reposiciones HU-14). `GET /replenishments/:id` lo devuelve por título en `insight.delivered_total`.  
**Archivos:** `backend/src/repositories/replenishment.repository.ts` (`getInsights`)  
**Commit:** [feat(api): add replenishment and notification repositories with guarded stock updates](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C3)

#### HU14-T04 · Ventas registradas
**Componente:** Backend / Base de datos  
**Qué se hizo:** Se reutilizó `branch_stock.sold_quantity` (módulo de ventas de Sprint 3): ya filtra por sede y descuenta las ventas anuladas. Se expone en `insight.sold_total`.  
**Archivos:** `backend/src/repositories/replenishment.repository.ts` (`getInsights`)  
**Commit:** [feat(api): add replenishment and notification repositories with guarded stock updates](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C3)

#### HU14-T05 · Cálculo y visualización del saldo
**Componente:** Backend / Frontend  
**Qué se hizo:** Saldo actual = `branch_stock.available_quantity` (`insight.current_balance`); además `other_exits` = entregado − ventas − saldo (mermas, muestras, cortesías de HU-07). La tabla del detalle muestra por separado: Solicitado · Entregado antes · Ventas · Saldo en sede · Almacén · Entregar (saldo ≤ 3 en rojo).  
**Archivos:** `backend/src/repositories/replenishment.repository.ts`, `backend/src/services/replenishment.service.ts`, `frontend/src/views/replenishments/ReplenishmentsView.tsx`  
**Commit:** [feat(ui): add Solicitar Reposición form and Logistics delivery view](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C8)

#### HU14-T06 · Interfaz para registrar entregas
**Componente:** Frontend  
**Qué se hizo:** En el detalle: cantidad entregada por título (precargada con `min(solicitado, stock almacén)`), validación en línea, resumen y botón **Confirmar entrega** con confirmación. Al completar muestra los movimientos registrados.  
**Archivos:** `frontend/src/views/replenishments/ReplenishmentsView.tsx`, `frontend/src/utils/quantity.ts`  
**Commit:** [feat(ui): add Solicitar Reposición form and Logistics delivery view](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C8)

#### HU14-T07 · Validación de disponibilidad (RN-01)
**Componente:** Backend / Base de datos  
**Qué se hizo:** `PUT /replenishments/:id/deliver` lee el stock dentro de la transacción (con `FOR UPDATE` en PostgreSQL) y rechaza con `INSUFFICIENT_CENTRAL_STOCK` si se entrega más de lo disponible. El `UPDATE` además lleva `WHERE current_quantity >= qty` y la tabla tiene `CHECK (current_quantity >= 0)`. Rechaza negativos, decimales, más de lo solicitado y entregas totalmente vacías.  
**Archivos:** `backend/src/services/replenishment.service.ts`, `backend/src/repositories/replenishment.repository.ts`, `backend/src/schemas/replenishment.schema.ts`  
**Commit:** [feat(api): add replenishment and notification services, controllers and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C4)

#### HU14-T08 · Actualización del almacén principal
**Componente:** Backend / Base de datos  
**Qué se hizo:** Descuento de `central_stock` por cada título entregado, dentro de la transacción.  
**Archivos:** `backend/src/repositories/replenishment.repository.ts` (`decreaseCentralStock`)  
**Commit:** [feat(api): add replenishment and notification repositories with guarded stock updates](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C3)

#### HU14-T09 · Actualización del inventario de la sede
**Componente:** Backend / Base de datos  
**Qué se hizo:** Alta/incremento en `branch_stock` (`received_quantity` y `available_quantity`), reutilizando la misma tabla que usan despachos y ventas.  
**Archivos:** `backend/src/repositories/replenishment.repository.ts` (`addBranchStock`)  
**Commit:** [feat(api): add replenishment and notification repositories with guarded stock updates](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C3)

#### HU14-T10 · Registro de movimientos
**Componente:** Backend / Base de datos  
**Qué se hizo:** Tabla `inventory_movements`: por cada título entregado se guardan una **salida** (`CENTRAL`) y una **entrada** (`BRANCH`) con libro, cantidad, fecha, usuario y solicitud. Visibles en el detalle de la solicitud completada.  
**Archivos:** `backend/src/db/schema.sql`, `backend/src/repositories/replenishment.repository.ts`  
**Commit:** [feat(db): add replenishment requests, movements and notifications tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C1)

#### HU14-T11 · Cambio de estado a Completada
**Componente:** Backend / Base de datos  
**Qué se hizo:** La solicitud pasa a `COMPLETED` (con `completed_at`/`completed_by_user_id`) en la **misma transacción** que stock y movimientos: si algo falla, no se guarda nada. Repetir la entrega devuelve `409 REPLENISHMENT_ALREADY_COMPLETED` sin tocar inventarios.  
**Archivos:** `backend/src/services/replenishment.service.ts`, `backend/src/repositories/replenishment.repository.ts`  
**Commit:** [feat(api): add replenishment and notification services, controllers and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C4)

#### HU14-T12 · Pruebas de HU-14
**Componente:** Testing  
**Qué se hizo:** 11 pruebas: saldo/entregado/ventas, bandeja, permisos, validaciones, **rollback** ante falta de stock en un título, entrega correcta (almacén, sede, 4 movimientos, estado), no duplicación, entrega parcial y notificaciones.  
**Archivos:** `backend/src/test/sprint4.integration.test.ts`  
**Commit:** [test(api): cover HU-13 and HU-14 acceptance criteria and business rules](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C6)

## 7. Commits sugeridos (orden de aplicación)

Cada commit compila por sí solo y respeta el orden de dependencias. Los mensajes siguen *Conventional Commits* como en tu ejemplo.

### C1 · [feat(db): add replenishment requests, movements and notifications tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C1)
**Tareas:** HU13-T01, HU13-T05 (BD) · HU14-T01, HU14-T03, HU14-T10 (almacenamiento)  
```bash
git add backend/src/db/schema.sql \
        SCRUM/docs/schemes/schema.sql
git commit -m "feat(db): add replenishment requests, movements and notifications tables"
```

### C2 · [feat(api): add replenishment domain types and quantity validation schemas](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C2)
**Tareas:** HU13-T03 (backend) · HU14-T07 (rechazo de negativos/decimales)  
```bash
git add backend/src/types/domain.ts \
        backend/src/schemas/replenishment.schema.ts
git commit -m "feat(api): add replenishment domain types and quantity validation schemas"
```

### C3 · [feat(api): add replenishment and notification repositories with guarded stock updates](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C3)
**Tareas:** HU13-T04, HU13-T05, HU13-T06 · HU14-T03, T04, T05, T07, T08, T09, T10  
```bash
git add backend/src/repositories/replenishment.repository.ts \
        backend/src/repositories/notification.repository.ts
git commit -m "feat(api): add replenishment and notification repositories with guarded stock updates"
```

### C4 · [feat(api): add replenishment and notification services, controllers and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C4)
**Tareas:** HU13-T04, T05, T06 · HU14-T01, T05, T07, T08, T09, T10, T11  
```bash
git add backend/src/services/replenishment.service.ts \
        backend/src/services/notification.service.ts \
        backend/src/controllers/replenishment.controller.ts \
        backend/src/controllers/notification.controller.ts \
        backend/src/routes/replenishment.routes.ts \
        backend/src/routes/notification.routes.ts \
        backend/src/routes/index.ts
git commit -m "feat(api): add replenishment and notification services, controllers and routes"
```

### C5 · [feat(seed): add demo pending replenishment request for Trilce](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C5)
**Tareas:** HU13-T07 / HU14-T12 (datos de demostración)  
```bash
git add backend/src/db/seed.ts
git commit -m "feat(seed): add demo pending replenishment request for Trilce"
```

### C6 · [test(api): cover HU-13 and HU-14 acceptance criteria and business rules](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C6)
**Tareas:** HU13-T07 · HU14-T12  
```bash
git add backend/src/test/sprint4.integration.test.ts \
        backend/package.json
git commit -m "test(api): cover HU-13 and HU-14 acceptance criteria and business rules"
```

### C7 · [feat(ui): add replenishment and notification API client, types and quantity helpers](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C7)
**Tareas:** HU13-T03 (frontend) · HU14-T06 (validación de entrega)  
```bash
git add frontend/src/types/index.ts \
        frontend/src/services/api.ts \
        frontend/src/utils/date.ts \
        frontend/src/utils/quantity.ts
git commit -m "feat(ui): add replenishment and notification API client, types and quantity helpers"
```

### C8 · [feat(ui): add Solicitar Reposición form and Logistics delivery view](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C8)
**Tareas:** HU13-T02, T03 · HU14-T02, T05, T06  
```bash
git add frontend/src/views/replenishments/ReplenishmentsView.tsx
git commit -m "feat(ui): add Solicitar Reposición form and Logistics delivery view"
```

### C9 · [feat(ui): add notification bell and Reposición navigation tab](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C9)
**Tareas:** HU13-T02, T06 · HU14-T02  
```bash
git add frontend/src/components/common/NotificationBell.tsx \
        frontend/src/components/common/Navbar.tsx \
        frontend/src/App.tsx
git commit -m "feat(ui): add notification bell and Reposición navigation tab"
```

### C10 · [docs(scrum): document replenishment tables and close HU-13 and HU-14 tasks](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_C10)
**Tareas:** Documentación de HU-13 y HU-14  
```bash
git add SCRUM/docs/schemes/01-diccionario-y-relaciones.md \
        SCRUM/product-backlog/HU-13.md \
        SCRUM/product-backlog/HU-14.md \
        INFORME_CAMBIOS_SPRINT4.md
git commit -m "docs(scrum): document replenishment tables and close HU-13 and HU-14 tasks"
```

Para aplicarlos todos de una vez (desde la raíz del repositorio): `bash aplicar-commits-sprint4.sh` — luego puedes borrar el script.

## 8. Cómo ejecutar y probar

```bash
# Backend (Node 22.5+; usa node:sqlite)
cd backend
npm install
npm run db:migrate      # crea las tablas nuevas sobre tu BD actual sin perder datos
npm run db:seed         # opcional: usuarios/stock de demo + solicitud REP-DEMO-0001
npm test                # 59 pruebas (usa la BD configurada en SQLITE_DB_PATH)
npm run dev

# Frontend
cd ../frontend && npm install && npm run dev
```

**Usuarios de demo (clave `Admin123!`):** `distribuidor.trilce@editorialqsy.com` (Distribuidor), `logistica@editorialqsy.com` (Logística), `admin@editorialqsy.com`.

**Recorrido manual sugerido**
1. Distribuidor → **Reposición → Solicitar Reposición**: agregar 2 libros; probar `0`, `-5`, `2.5`, `abc` (debe bloquear); enviar con valores válidos → aparece *Pendiente*.
2. Logística → la campana muestra la solicitud → **Revisar y entregar** → ver *Entregado antes / Ventas / Saldo / Almacén*.
3. Poner una cantidad mayor que el stock del almacén → bloqueado (RN-01).
4. **Confirmar entrega** → estado *Completada*, movimientos visibles; el inventario de la sede y del almacén cambian (pestaña Inventario).
5. Distribuidor → ve la solicitud *Completada* y una notificación.

> **Importante:** las pruebas de integración **escriben datos** en la BD configurada. Ejecútalas con una BD de desarrollo (p. ej. `SQLITE_DB_PATH=./data/test.db`), no con datos reales.

## 9. Observaciones y pendientes

- **Code Review** de HU-13/HU-14 sigue pendiente (por eso en el backlog quedaron en `estado: review`, no `done`).
- **`backend/data/qsy.db`** de tu .rar es una BD casi vacía (solo el usuario admin; los datos están en el archivo `-wal`). No se modificó. Al iniciar el servidor, `runMigrations()` crea las tablas nuevas.
- **`node_modules` del .rar** trae binarios de Windows (rolldown/oxlint) y sin permisos de ejecución en Linux; hice las comprobaciones de build/lint en una copia con `npm ci`. En tu equipo no cambia nada.
- **`backend/tsconfig.json`** ya daba el aviso `moduleResolution=node10 deprecated` con el TypeScript instalado (preexistente, no lo toqué).
- Las notificaciones se refrescan por *polling* cada 30 s (suficiente para el MVP; sin WebSockets).
- Con PostgreSQL el bloqueo de filas usa `FOR UPDATE`; no pude probar ese motor aquí.
