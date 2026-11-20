# Informe de cambios — HU-15 y HU-16 (Liquidación y Cobranzas)

**Módulo:** M4 – Reabastecimiento y Liquidación · **Sprint 4 · Release 1 (MVP)**  
**Base de comparación:** el proyecto tal como quedó tras HU-13/HU-14 (`LAB_GPS_actualizado.zip`).  
**Historias:** HU-15 *Liquidación automática con deducción de comisión fija* · HU-16 *Registro de cobro de liquidación y saldos pendientes*.

## 1. Resumen

Logística ahora elige una distribuidora y un período, y el sistema calcula **Ingreso bruto − Comisión fija = Neto a entregar a QSY** con desglose por título (HU-15). Luego registra los cobros (efectivo, constancia/comprobante o transferencia), incluso parciales, y el sistema mantiene el **saldo pendiente**, el **estado** (Pendiente / Parcial / Pagada), el **historial** y un **panel de deudas** por distribuidora con las liquidaciones vencidas resaltadas (HU-16).

Ejemplo del plan, reproducido en las pruebas: 20 ejemplares × S/ 30 con comisión S/ 5 → bruto S/ 600, comisión S/ 100, neto S/ 500. Si la distribuidora entrega S/ 300, queda *Parcial* con deuda de S/ 200.

### Verificación realizada
| Comprobación | Resultado |
|---|---|
| Pruebas del backend (`npm test`) | **86/86 OK** (59 previas + 27 nuevas), 3 corridas seguidas sobre BD limpia migrada y sembrada |
| Backend `tsc --noEmit` | Sin errores |
| Frontend `tsc -b` y `vite build` | Sin errores · build OK (377 kB JS) |
| Frontend `oxlint` | 0 errores · 15 advertencias (antes 12; las 3 nuevas son el patrón `setState` en `useEffect` ya usado en el resto del código) |
| Validadores de monto del frontend | 11 casos verificados (0, negativos, decimales, texto, exceso, coma decimal) |

> **Límites:** no hay navegador en mi entorno, así que la interfaz se verificó con compilación, build, lint y pruebas de los validadores, **no con clics reales**. Tampoco se probó PostgreSQL (solo SQLite). Hay una pasada manual sugerida en la sección 8.

Durante las pruebas apareció una intermitencia real: el orden del historial de pagos dependía de `created_at` (precisión de segundos) y de un UUID aleatorio, así que dos pagos en el mismo segundo podían salir invertidos. Se corrigió con un identificador de pago ordenable por tiempo.

## 2. Qué se reutilizó y qué se creó

| Necesidad | Reutilizado | Nuevo |
|---|---|---|
| Ventas, líneas, precio y comisión | `sales`, `sale_items` (**ya congelan** `unit_price`, `unit_commission`, subtotales) | — |
| Catálogo, sedes, usuarios | `products`, `branches`, `users` | — |
| Roles, validación, errores, transacciones | `requireRoles`, `validateBody`, `AppError`, `db.transaction` | — |
| Liquidación y su desglose | — | `liquidations`, `liquidation_items` |
| Ventas ya liquidadas | — | `liquidation_sales` (PK = `sale_id`) |
| Cobros | — | `liquidation_payments` |

**Diferencias con el plan propuesto (y por qué):**
- Tablas: `LiquidationDetails` → `liquidation_items` (igual que `sale_items`), `Payments` → `liquidation_payments` (evita confundirla con `sales.payment_method`), y se agregó `liquidation_sales`, que el propio plan pedía como vínculo para impedir liquidar dos veces una venta.
- Backend: el plan sugería `modules/liquidations/`; el proyecto usa capas planas (`routes/controllers/services/repositories/schemas`), y se respetó esa arquitectura.
- Frontend: se siguió `views/liquidations` y `components/liquidations`. `LiquidationForm` → `LiquidationGenerator`; `LiquidationDetails` y `PaymentForm` quedaron dentro de `LiquidationDetailModal`; `DebtSummary` quedó dentro de `CollectionsView`.
- `daily_settlements` (arqueo diario) existe pero ningún código lo usa y su restricción `UNIQUE(sede, día)` no admite períodos, por eso no se reutilizó.

## 3. Decisiones y supuestos (confírmalos con el equipo)

1. **Comisión histórica (la pregunta abierta del plan):** se usa la comisión y el precio **congelados en cada venta** (`sale_items`), no el catálogo vigente. Un cambio posterior del catálogo no altera ni liquidaciones ya generadas ni ventas pasadas (hay una prueba que lo demuestra).
2. **Fecha de vencimiento (no definida en la historia):** fin del período + **7 días**, configurable con `LIQUIDATION_DUE_DAYS`. Una liquidación está *vencida* si no está pagada y su vencimiento ya pasó (se calcula al consultar).
3. **Excedentes:** no se admiten; un pago mayor al saldo se rechaza (400). Un mecanismo de excedentes requeriría una regla de negocio nueva.
4. **Métodos de pago:** `CASH` (efectivo), `VOUCHER` (constancia/comprobante) y `TRANSFER`. Los dos últimos exigen un N° de referencia (texto). **No hay carga de archivos** de constancia, solo la referencia.
5. **Período:** días completos en hora de Lima (UTC-5), inicio y fin inclusivos; el fin no puede ser futuro.
6. **Solapamiento:** se permiten períodos que se cruzan; cada venta solo entra en la primera liquidación que la toma.
7. **Anulación:** una venta liquidada ya no puede anularse (409). No existe reversión de liquidaciones (no está en las historias).
8. **Permisos:** generar liquidaciones y registrar cobros → Logística y Admin. El distribuidor **puede consultar por API** solo las de su sede (RN-05), pero **no se le agregó pantalla**: la pestaña es solo para Logística/Admin.
9. **Netos en cero:** una liquidación con neto S/ 0.00 nace *Pagada* (no hay nada que cobrar).
10. **Sin datos demo:** no agregué ventas al `seed` porque habría que alterar el stock de la sede de demostración. Para probar, registra ventas con el usuario distribuidor (pestaña *Vender*).

## 4. API nueva

Base `/api/v1`. Requieren `Authorization: Bearer <token>`.

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/liquidations/preview?branch_id&period_start&period_end` | LOGISTICS, ADMIN | Calcula sin guardar |
| POST | `/liquidations` | LOGISTICS, ADMIN | Genera `{ branch_id, period_start, period_end, notes? }` (cualquier otro campo → 400, RN-06) |
| GET | `/liquidations?branch_id&status&from&to&overdue` | Todos (distribuidor: su sede) | Listado con filtros |
| GET | `/liquidations/debts` | Todos (distribuidor: su sede) | Totales por cobrar/recibido/vencido y deuda por distribuidora |
| GET | `/liquidations/:id` | Todos (RN-05) | Detalle con desglose y pagos |
| POST | `/liquidations/:id/payments` | LOGISTICS, ADMIN | Cobro `{ amount, payment_method, payment_date?, evidence? }` |

Errores de negocio: `NO_SALES_TO_LIQUIDATE`, `PERIOD_IN_FUTURE`, `SALE_ALREADY_LIQUIDATED`, `PAYMENT_EXCEEDS_PENDING`, `LIQUIDATION_ALREADY_PAID` (409), `PAYMENT_DATE_IN_FUTURE`, `BRANCH_ACCESS_DENIED` (403), `VALIDATION_ERROR`.

## 5. Cambios por archivo (rutas relativas a la raíz)

### 5.1. Archivos nuevos
| Ruta | Propósito |
|---|---|
| `backend/src/utils/money.ts` | Céntimos enteros y validación de 2 decimales |
| `backend/src/utils/lima-date.ts` | Fechas de negocio en hora de Lima |
| `backend/src/schemas/liquidation.schema.ts` | Validación zod (período estricto, cobro) |
| `backend/src/repositories/liquidation.repository.ts` | Consultas, cobros y totales |
| `backend/src/services/liquidation.service.ts` | Cálculo, generación, cobros y panel de deudas |
| `backend/src/controllers/liquidation.controller.ts` | Controlador de `/liquidations` |
| `backend/src/routes/liquidation.routes.ts` | Rutas y roles |
| `backend/src/test/sprint5.integration.test.ts` | 27 pruebas de HU-15/HU-16 |
| `frontend/src/utils/money.ts` | Formato S/, fechas y validación de montos |
| `frontend/src/components/liquidations/LiquidationStatusBadge.tsx` | Insignia Pendiente/Parcial/Pagada/Vencida |
| `frontend/src/components/liquidations/LiquidationTable.tsx` | Tabla reutilizable de liquidaciones |
| `frontend/src/components/liquidations/LiquidationGenerator.tsx` | Calcular y generar liquidación |
| `frontend/src/components/liquidations/LiquidationDetailModal.tsx` | Desglose, historial y registro de cobro |
| `frontend/src/views/liquidations/LiquidationsView.tsx` | Módulo Liquidaciones (contenedor) |
| `frontend/src/views/liquidations/CollectionsView.tsx` | Cobranzas: panel de deudas y filtros |

### 5.2. Archivos modificados
| Ruta | Líneas | Cambio |
|---|---|---|
| `backend/src/db/schema.sql` | +81 | 4 tablas (`liquidations`, `liquidation_items`, `liquidation_sales`, `liquidation_payments`) y 6 índices. Ninguna tabla existente se alteró. |
| `SCRUM/docs/schemes/schema.sql` | +81 | Misma ampliación en la copia documental. |
| `backend/src/config/env.ts` | +3 −1 | Variable `LIQUIDATION_DUE_DAYS` (por defecto 7). |
| `backend/.env.example` | +3 | Documenta `LIQUIDATION_DUE_DAYS`. |
| `backend/src/routes/index.ts` | +4 | Registra `/liquidations`. |
| `backend/src/types/domain.ts` | +87 | Tipos de liquidación, cobro y deudas. |
| `backend/src/services/sale.service.ts` | +3 | Bloquea anular ventas ya liquidadas (único cambio a lógica existente). |
| `backend/package.json` | +1 −1 | `npm test` incluye `sprint5.integration.test.ts`. |
| `frontend/src/types/index.ts` | +92 | Tipos de Sprint 4 (liquidaciones). |
| `frontend/src/services/api.ts` | +30 | `api.liquidations.*`. |
| `frontend/src/components/common/Navbar.tsx` | +16 −2 | Pestaña **Liquidaciones** (solo Logística/Admin). |
| `frontend/src/App.tsx` | +3 | Ruteo a `LiquidationsView`. |
| `SCRUM/docs/schemes/01-diccionario-y-relaciones.md` | +61 | Secciones 3.15–3.18. |
| `SCRUM/product-backlog/HU-15.md` | +24 −6 | Tareas, DoD y estado `review`. |
| `SCRUM/product-backlog/HU-16.md` | +26 −6 | Tareas, DoD y estado `review`. |

> Casi todo es aditivo. No se tocaron inventario, despachos, reposición (HU-13/14), autenticación, ni la lógica de ventas salvo el bloqueo de anulación de 3 líneas. Las tablas se crean con `CREATE TABLE IF NOT EXISTS`, que `runMigrations()` ya ejecuta al arrancar el servidor.

## 6. Detalle por tarea y commit

> Los enlaces llevan `SHA_PENDIENTE_Dn` porque no puedo crear commits en tu GitHub. Se generan al ejecutar `aplicar-commits-hu15-hu16.sh` o los comandos de la sección 7. Un commit puede cubrir varias tareas porque un mismo archivo (p. ej. el servicio) resuelve varias a la vez.

### HU-15 · Liquidación automática con deducción de comisión fija

#### HU15-T01 · Revisión del modelo de ventas, catálogo, distribuidoras y comisiones
**Componente:** BD / Backend  
**Qué se hizo:** Hallazgos que cambiaron el diseño: (1) `sale_items` **ya congela** `unit_price`, `unit_commission` y subtotales en cada venta (RN-06), así que no hizo falta agregar copias a las ventas; (2) `sales.status` distingue `CONFIRMED`/`ANNULLED`; (3) existe `daily_settlements` (arqueo diario) pero **ningún código lo usa** y su `UNIQUE(sede, día)` no sirve para períodos, por lo que no se reutilizó; (4) no existía nada de liquidaciones ni pagos. Se reutilizan `branches`, `products`, `sales`, `sale_items`, `users`, roles, `validateBody`, `AppError` y `db.transaction`.  
**Archivos:** `backend/src/db/schema.sql`, `SCRUM/docs/schemes/schema.sql`  
**Commit:** [feat(db): add liquidations, items, sales link and payments tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D1)

#### HU15-T02 · Consulta de ventas por distribuidora y período
**Componente:** Backend  
**Qué se hizo:** `findEligibleSaleLines` toma solo ventas `CONFIRMED` de la sede, dentro del período y que no estén ya en una liquidación. El período se interpreta en **hora de Lima**: `2025-03-01` a `2025-03-31` equivale a `[01-mar 00:00, 01-abr 00:00)` Lima, convertido a UTC porque la BD guarda `created_at` en UTC. Se agregó un índice `(branch_id, status, created_at)` en `sales`.  
**Archivos:** `backend/src/repositories/liquidation.repository.ts`, `backend/src/utils/lima-date.ts`, `backend/src/services/liquidation.service.ts`  
**Commit:** [feat(api): add liquidation repository using frozen sale prices and guarded payments](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D3)

#### HU15-T03 · Cálculo automático de bruto, comisión y neto
**Componente:** Backend  
**Qué se hizo:** `computeLiquidation` calcula en el servidor y en **céntimos enteros** (sin errores de punto flotante): IB = Σ precio×cantidad, C = Σ comisión×cantidad, MN = IB − C. Agrupa por (título, precio, comisión): si un título cambió de precio entre ventas, cada precio conserva su línea. `GET /liquidations/preview` calcula sin guardar para revisar con el distribuidor.  
**Archivos:** `backend/src/services/liquidation.service.ts`, `backend/src/utils/money.ts`  
**Commit:** [feat(api): add liquidation and collection services, controller and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D4)

#### HU15-T04 · Registro de liquidaciones y sus detalles
**Componente:** BD / Backend  
**Qué se hizo:** Tablas `liquidations` (cabecera, totales, estado, vencimiento), `liquidation_items` (desglose congelado con título y código) y `liquidation_sales` (ventas incluidas). `POST /liquidations` guarda todo en **una transacción** y genera el código `LIQ-AAAA-NNNN`. Una liquidación conserva sus valores aunque después cambie el catálogo.  
**Archivos:** `backend/src/db/schema.sql`, `backend/src/repositories/liquidation.repository.ts`, `backend/src/services/liquidation.service.ts`  
**Commit:** [feat(db): add liquidations, items, sales link and payments tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D1)

#### HU15-T05 · Interfaz para seleccionar distribuidora, fechas y generar
**Componente:** Frontend  
**Qué se hizo:** Nueva pestaña **Liquidaciones** (solo Logística/Admin) con el generador: distribuidora, desde/hasta (no futuras, inicio ≤ fin), botón **Calcular** y, tras revisar, **Generar liquidación** con confirmación.  
**Archivos:** `frontend/src/components/liquidations/LiquidationGenerator.tsx`, `frontend/src/views/liquidations/LiquidationsView.tsx`, `frontend/src/components/common/Navbar.tsx`, `frontend/src/App.tsx`  
**Commit:** [feat(ui): add Liquidaciones and Cobranzas views and navigation tab](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D9)

#### HU15-T06 · Desglose por título
**Componente:** Frontend  
**Qué se hizo:** Tarjetas de Ingreso bruto / Comisiones / Neto a entregar a QSY y tabla por título: unidades, precio, comisión unitaria, subtotal de ventas y subtotal de comisión (en el cálculo previo y en el detalle guardado). Muestra cuántas ventas ya liquidadas se excluyeron.  
**Archivos:** `frontend/src/components/liquidations/LiquidationGenerator.tsx`, `frontend/src/components/liquidations/LiquidationDetailModal.tsx`  
**Commit:** [feat(ui): add liquidation generator, table, status badge and detail modal](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D8)

#### HU15-T07 · Evitar liquidaciones duplicadas
**Componente:** Backend  
**Qué se hizo:** Cuatro capas: (1) las consultas excluyen ventas ya liquidadas, por lo que **períodos solapados no duplican**; (2) `liquidation_sales.sale_id` es PRIMARY KEY, la BD rechaza la duplicación aunque falle el código; (3) dos generaciones simultáneas del mismo período producen una sola liquidación; (4) una venta ya liquidada **no puede anularse** (409), porque alteraría un importe ya cobrado. Esto último es el único cambio a lógica existente (3 líneas).  
**Archivos:** `backend/src/db/schema.sql`, `backend/src/repositories/liquidation.repository.ts`, `backend/src/services/sale.service.ts`  
**Commit:** [fix(sales): block annulment of sales already included in a liquidation](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D5)

#### HU15-T08 · Pruebas unitarias y de integración
**Componente:** Testing  
**Qué se hizo:** Unitarias: céntimos, fechas de Lima, agrupación por precio. Integración: escenario 600/100/500, límites de hora Lima, venta anulada excluida, previsualización que no guarda, roles, validaciones, RN-06 (campos de comisión rechazados con 400), duplicados, solapamiento, concurrencia, bloqueo de anulación y cambio de catálogo.  
**Archivos:** `backend/src/test/sprint5.integration.test.ts`  
**Commit:** [test(api): cover HU-15 and HU-16 calculations, duplicates, payments and branch isolation](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D6)

### HU-16 · Registro de cobro de liquidación y saldos pendientes

#### HU16-T01 · Revisión del modelo de liquidaciones
**Componente:** BD / Backend  
**Qué se hizo:** No existía ninguna estructura de pagos ni cobranzas; se crea `liquidation_payments` ligada a `liquidations`.  
**Archivos:** `backend/src/db/schema.sql`  
**Commit:** [feat(db): add liquidations, items, sales link and payments tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D1)

#### HU16-T02 · Registro de pagos
**Componente:** BD / Backend  
**Qué se hizo:** Tabla `liquidation_payments`: monto (> 0), método (`CASH`, `VOUCHER` = constancia/comprobante, `TRANSFER`), fecha, referencia/constancia y usuario. Cada cobro es una fila independiente: **no se sobrescribe ni se elimina nada**. El `id` es ordenable cronológicamente para que el historial salga siempre en orden de registro.  
**Archivos:** `backend/src/db/schema.sql`, `backend/src/repositories/liquidation.repository.ts`  
**Commit:** [feat(db): add liquidations, items, sales link and payments tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D1)

#### HU16-T03 · Servicio de registro de pagos
**Componente:** Backend  
**Qué se hizo:** `POST /liquidations/:id/payments`: rechaza montos ≤ 0, con más de 2 decimales o no numéricos; exige referencia (mín. 3 caracteres) para constancia/transferencia; rechaza fechas futuras; y **rechaza pagos mayores al saldo** (400 `PAYMENT_EXCEEDS_PENDING`, con el saldo en `details`). Solo Logística/Admin. Valida también en pantalla.  
**Archivos:** `backend/src/schemas/liquidation.schema.ts`, `backend/src/services/liquidation.service.ts`, `frontend/src/utils/money.ts`  
**Commit:** [feat(api): add liquidation and collection services, controller and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D4)

#### HU16-T04 · Saldo pendiente y estado
**Componente:** Backend  
**Qué se hizo:** Dentro de la transacción (con `FOR UPDATE` en PostgreSQL) se recalcula el saldo como neto − Σ pagos **desde el historial** y se actualiza el estado: sin pagos → `PENDING`, parcial → `PARTIAL`, saldo 0 → `PAID`. Un pago sobre una liquidación pagada devuelve 409.  
**Archivos:** `backend/src/services/liquidation.service.ts`, `backend/src/repositories/liquidation.repository.ts`  
**Commit:** [feat(api): add liquidation and collection services, controller and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D4)

#### HU16-T05 · Interfaz para consultar liquidaciones y registrar cobros
**Componente:** Frontend  
**Qué se hizo:** Pestaña **Cobranzas** dentro de Liquidaciones y ventana de detalle con el formulario de cobro: monto, método, fecha y referencia, con validación en línea.  
**Archivos:** `frontend/src/components/liquidations/LiquidationDetailModal.tsx`, `frontend/src/views/liquidations/CollectionsView.tsx`  
**Commit:** [feat(ui): add liquidation generator, table, status badge and detail modal](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D8)

#### HU16-T06 · Pagos parciales e historial
**Componente:** Frontend / Backend  
**Qué se hizo:** El detalle muestra el historial completo de cobros (fecha, método, referencia, monto, quién registró) y el formulario sigue disponible mientras haya saldo.  
**Archivos:** `frontend/src/components/liquidations/LiquidationDetailModal.tsx`, `backend/src/services/liquidation.service.ts`  
**Commit:** [feat(ui): add liquidation generator, table, status badge and detail modal](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D8)

#### HU16-T07 · Panel de deudas por distribuidora
**Componente:** Frontend  
**Qué se hizo:** `GET /liquidations/debts` + panel: Total por cobrar, Total recibido, Vencido, y una tarjeta por distribuidora (*Deuda pendiente* / *Al día*, liquidado, pagado, pendiente, borde y aviso rojo si tiene liquidaciones vencidas). Pulsar una tarjeta filtra la tabla.  
**Archivos:** `frontend/src/views/liquidations/CollectionsView.tsx`, `backend/src/services/liquidation.service.ts`  
**Commit:** [feat(ui): add Liquidaciones and Cobranzas views and navigation tab](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D9)

#### HU16-T08 · Filtros por distribuidora, estado y período
**Componente:** Frontend / Backend  
**Qué se hizo:** `GET /liquidations?branch_id&status&from&to&overdue=true` y controles equivalentes en pantalla (incluye *Solo vencidas* y *Limpiar filtros*).  
**Archivos:** `frontend/src/views/liquidations/CollectionsView.tsx`, `backend/src/repositories/liquidation.repository.ts`  
**Commit:** [feat(ui): add Liquidaciones and Cobranzas views and navigation tab](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D9)

#### HU16-T09 · Pruebas de pagos completos, parciales y saldos
**Componente:** Testing  
**Qué se hizo:** Escenario del informe (S/ 500 → S/ 200 = Parcial/deuda 300 → +S/ 100 = deuda 200 → +S/ 200 = Pagada), exceso, 0/negativos/decimales, referencia obligatoria, centavos exactos (3×8.33 + 0.01 = 25.00), pago sobre liquidación pagada, panel de deudas, filtros, vencidas y aislamiento RN-05.  
**Archivos:** `backend/src/test/sprint5.integration.test.ts`  
**Commit:** [test(api): cover HU-15 and HU-16 calculations, duplicates, payments and branch isolation](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D6)

## 7. Commits sugeridos (orden de aplicación)

Cada commit compila por sí solo. Aplícalos **después** de los commits de HU-13/HU-14.

### D1 · [feat(db): add liquidations, items, sales link and payments tables](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D1)
**Tareas:** HU15-T01, T04, T07 · HU16-T01, T02  
```bash
git add backend/src/db/schema.sql \
        SCRUM/docs/schemes/schema.sql
git commit -m "feat(db): add liquidations, items, sales link and payments tables"
```

### D2 · [feat(api): add money and Lima-date utilities, liquidation schemas and domain types](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D2)
**Tareas:** HU15-T03 · HU16-T03  
```bash
git add backend/src/utils/money.ts \
        backend/src/utils/lima-date.ts \
        backend/src/schemas/liquidation.schema.ts \
        backend/src/types/domain.ts \
        backend/src/config/env.ts \
        backend/.env.example
git commit -m "feat(api): add money and Lima-date utilities, liquidation schemas and domain types"
```

### D3 · [feat(api): add liquidation repository using frozen sale prices and guarded payments](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D3)
**Tareas:** HU15-T02, T04, T07 · HU16-T02, T04, T08  
```bash
git add backend/src/repositories/liquidation.repository.ts
git commit -m "feat(api): add liquidation repository using frozen sale prices and guarded payments"
```

### D4 · [feat(api): add liquidation and collection services, controller and routes](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D4)
**Tareas:** HU15-T02, T03, T04, T07 · HU16-T03, T04, T06, T07, T08  
```bash
git add backend/src/services/liquidation.service.ts \
        backend/src/controllers/liquidation.controller.ts \
        backend/src/routes/liquidation.routes.ts \
        backend/src/routes/index.ts
git commit -m "feat(api): add liquidation and collection services, controller and routes"
```

### D5 · [fix(sales): block annulment of sales already included in a liquidation](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D5)
**Tareas:** HU15-T07  
```bash
git add backend/src/services/sale.service.ts
git commit -m "fix(sales): block annulment of sales already included in a liquidation"
```

### D6 · [test(api): cover HU-15 and HU-16 calculations, duplicates, payments and branch isolation](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D6)
**Tareas:** HU15-T08 · HU16-T09  
```bash
git add backend/src/test/sprint5.integration.test.ts \
        backend/package.json
git commit -m "test(api): cover HU-15 and HU-16 calculations, duplicates, payments and branch isolation"
```

### D7 · [feat(ui): add liquidation and collection API client, types and money helpers](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D7)
**Tareas:** HU15-T05 · HU16-T03 (validación en pantalla)  
```bash
git add frontend/src/types/index.ts \
        frontend/src/services/api.ts \
        frontend/src/utils/money.ts
git commit -m "feat(ui): add liquidation and collection API client, types and money helpers"
```

### D8 · [feat(ui): add liquidation generator, table, status badge and detail modal](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D8)
**Tareas:** HU15-T05, T06 · HU16-T05, T06  
```bash
git add frontend/src/components/liquidations/LiquidationStatusBadge.tsx \
        frontend/src/components/liquidations/LiquidationTable.tsx \
        frontend/src/components/liquidations/LiquidationGenerator.tsx \
        frontend/src/components/liquidations/LiquidationDetailModal.tsx
git commit -m "feat(ui): add liquidation generator, table, status badge and detail modal"
```

### D9 · [feat(ui): add Liquidaciones and Cobranzas views and navigation tab](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D9)
**Tareas:** HU15-T05 · HU16-T05, T07, T08  
```bash
git add frontend/src/views/liquidations/LiquidationsView.tsx \
        frontend/src/views/liquidations/CollectionsView.tsx \
        frontend/src/components/common/Navbar.tsx \
        frontend/src/App.tsx
git commit -m "feat(ui): add Liquidaciones and Cobranzas views and navigation tab"
```

### D10 · [docs(scrum): document liquidation tables and close HU-15 and HU-16 tasks](https://github.com/yhuayhuahi/LAB_GPS/commit/SHA_PENDIENTE_D10)
**Tareas:** Documentación de HU-15 y HU-16  
```bash
git add SCRUM/docs/schemes/01-diccionario-y-relaciones.md \
        SCRUM/product-backlog/HU-15.md \
        SCRUM/product-backlog/HU-16.md \
        INFORME_CAMBIOS_HU15_HU16.md
git commit -m "docs(scrum): document liquidation tables and close HU-15 and HU-16 tasks"
```

Todos de una vez, desde la raíz del repositorio: `bash aplicar-commits-hu15-hu16.sh` (luego puedes borrarlo).

## 8. Cómo ejecutar y probar

```bash
cd backend
npm install
npm run db:migrate      # crea las 4 tablas nuevas sin perder datos
npm run db:seed         # opcional (usuarios y stock de demostración)
npm test                # 86 pruebas; ejecútelas con una BD de desarrollo, escriben datos
npm run dev

cd ../frontend && npm install && npm run dev
```

**Recorrido manual sugerido** (clave de demo `Admin123!`)
1. `distribuidor.trilce@editorialqsy.com` → *Vender*: registra 2 o 3 ventas.
2. `logistica@editorialqsy.com` → **Liquidaciones**: elige *Distribuidora Trilce*, período que incluya hoy → **Calcular**: revisa bruto, comisión, neto y desglose → **Generar liquidación**.
3. Vuelve a calcular el mismo período: no hay ventas pendientes (no se duplica).
4. En el detalle, registra un cobro parcial (efectivo) y otro con constancia: observa el saldo, el estado *Parcial* y el historial.
5. Intenta cobrar `0`, `-5`, `10.555` o más que el saldo: debe bloquear. Cobra el saldo exacto → *Pagada*.
6. Pestaña **Cobranzas**: totales, tarjetas por distribuidora, filtros. Para ver *Vencida*, genera una liquidación de un período con fin hace más de 7 días (puedes ajustar fechas de ventas en la BD de desarrollo).
7. Con el distribuidor, intenta anular una venta ya liquidada: debe responder que no es posible.

## 9. Observaciones y pendientes

- **Code Review** pendiente (HU-15/16 quedaron en `estado: review`).
- Las pruebas fijan fechas de 2025 con `UPDATE sales SET created_at` para controlar los períodos; no usan datos reales.
- `created_at` se guarda en UTC con `CURRENT_TIMESTAMP`; la conversión a Lima asume UTC-5 fijo (Perú no tiene horario de verano).
- En PostgreSQL se usa `FOR UPDATE` al cobrar; no se pudo probar ese motor aquí.
- Sigue vigente lo señalado en el informe anterior sobre `node_modules` de Windows y el aviso de `tsconfig`.
