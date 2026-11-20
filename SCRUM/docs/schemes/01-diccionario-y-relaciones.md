# Especificación del Modelo Relacional y Diccionario de Datos

* **Módulo:** Arquitectura de Datos / Persistencia Relacional
* **Fecha:** 2026-10-14 (Actualizado según retroalimentación de alcance)
* **Autor:** Yourdyy (Scrum Master / Arquitecto de Software)
* **Script SQL Ejecutable:** [`schema.sql`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/docs/schemes/schema.sql)
* **Compatibilidad:** PostgreSQL 14+ / SQLite 3 (ANSI SQL Estándar)

---

## 1. Diagrama Entidad-Relación (Mermaid ERD)

A continuación se presenta el modelo relacional del sistema de información para **Editorial QSY**, estructurado en Tercera Forma Normal (3FN), con sus 10 tablas, cardinalidades y claves foráneas:

```mermaid
erDiagram
    ROLES ||--o{ USERS : "asigna rol a"
    BRANCHES ||--o{ USERS : "emplea a"
    BRANCHES ||--o{ BRANCH_STOCK : "custodia existencias en"
    PRODUCTS ||--o{ BRANCH_STOCK : "contabilizado en"
    
    BRANCHES ||--o{ CONSIGNMENTS : "recibe en (destino)"
    USERS ||--o{ CONSIGNMENTS : "despacha"
    USERS ||--o{ CONSIGNMENTS : "recepciona"
    CONSIGNMENTS ||--|{ CONSIGNMENT_ITEMS : "desglosa lotes"
    PRODUCTS ||--o{ CONSIGNMENT_ITEMS : "item despachado"
    
    BRANCHES ||--o{ SALES : "punto de venta de"
    USERS ||--o{ SALES : "atendida por"
    SALES ||--|{ SALE_ITEMS : "detalle de libros"
    PRODUCTS ||--o{ SALE_ITEMS : "item vendido"
    
    BRANCHES ||--o{ DAILY_SETTLEMENTS : "cierre diario de"
    USERS ||--o{ DAILY_SETTLEMENTS : "balance liquidado por"

    ROLES {
        varchar id PK
        varchar name UK
        varchar description
        timestamp created_at
    }

    BRANCHES {
        varchar id PK
        varchar code UK
        varchar name
        varchar address
        varchar phone
        varchar manager_name
        text observations
        boolean is_active
        timestamp created_at
    }

    USERS {
        varchar id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role_id FK
        varchar branch_id FK
        text observations
        boolean is_active
        timestamp created_at
    }

    PRODUCTS {
        varchar id PK
        varchar code UK
        varchar title
        varchar education_level
        varchar isbn
        numeric public_price
        numeric fixed_commission
        text observations
        boolean is_active
        timestamp created_at
    }

    BRANCH_STOCK {
        varchar id PK
        varchar branch_id FK
        varchar product_id FK
        integer received_quantity
        integer sold_quantity
        integer available_quantity
        timestamp updated_at
    }

    CONSIGNMENTS {
        varchar id PK
        varchar dispatch_code UK
        varchar target_branch_id FK
        varchar dispatcher_user_id FK
        varchar receiver_user_id FK
        varchar status
        text notes
        timestamp created_at
        timestamp received_at
    }

    CONSIGNMENT_ITEMS {
        varchar id PK
        varchar consignment_id FK
        varchar product_id FK
        integer dispatched_quantity
        integer received_quantity
        varchar discrepancy_notes
    }

    SALES {
        varchar id PK
        varchar client_sale_uuid UK
        varchar branch_id FK
        varchar seller_user_id FK
        varchar physical_receipt_number
        varchar customer_dni
        varchar customer_name
        varchar payment_method
        numeric total_amount
        numeric total_commission
        varchar status
        boolean is_offline_sync
        text observations
        timestamp created_at
        timestamp synced_at
    }

    SALE_ITEMS {
        varchar id PK
        varchar sale_id FK
        varchar product_id FK
        integer quantity
        numeric unit_price
        numeric unit_commission
        numeric subtotal
        numeric subtotal_commission
    }

    DAILY_SETTLEMENTS {
        varchar id PK
        varchar branch_id FK
        varchar settler_user_id FK
        date settlement_date
        integer total_sales_count
        numeric total_gross_income
        numeric total_distributor_commission
        numeric total_net_for_editorial
        varchar status
        text observations
        timestamp created_at
    }
```

---

## 2. Aclaraciones de Alcance y Lógica de Relaciones

### 2.1. Padrón Dinámico de Distribuidoras y Empleados (Cero Hardcoding)
* Históricamente la editorial ha operado con tres librerías aliadas en Arequipa (Trilce, Siglo XX y Jerusalén).
* Sin embargo, para garantizar la máxima escalabilidad y no amarrar el sistema a datos fijos que no poseemos formalmente (contratos, direcciones legales o personal de turno):
  * **La tabla `branches` inicia vacía:** El Administrador General crea y parametriza las distribuidoras desde la interfaz web (`HU-02`), pudiendo añadir nuevas sedes en cualquier momento.
  * **La tabla `users` (vendedores/personal) inicia vacía (excepto el Super-Admin inicial):** El Administrador o Logística dan de alta a los empleados, asignándoles credenciales y vinculándolos a su respectiva sede (`HU-01`).

### 2.2. Alta de Libros por el Administrador (Tabla `products` vacía por diseño)
* Los títulos de libros no vienen precreados ni estáticos en base de datos.
* La tabla `products` inicia **completamente vacía**, cumpliendo con la historia de usuario `HU-03` (*"Como Administrador, quiero dar de alta títulos de libros, fijar precios de venta y establecer la comisión fija..."*). Es el propio Administrador General quien registrará y gestionará los títulos mediante la interfaz web administrativa.

### 2.3. Naturaleza de las Comisiones y Logística Operativa de Consignación
* **¿Qué es la comisión?** Las distribuidoras son aliadas comerciales independientes (librerías terceras). La comisión es la ganancia fija en soles que la distribuidora retiene por prestar su vitrina y mostrador al vender cada ejemplar.
* **Autocálculo:** Al congelar la comisión en cada ítem de venta (`sale_items`), el balance de liquidación diario (`daily_settlements`) computa de forma automática en 10 segundos el ingreso bruto menos las comisiones retenidas.
* **Rol de Logística:** Es el encargado del almacén central que custodia los lotes provenientes de imprenta, despacha las remisiones físicas (`consignments`) y atiende las solicitudes de reposición de las sucursales.

### 2.4. Modalidad de Pago Única en Mostrador (Efectivo Regularizado)
* Las transferencias bancarias y pasarelas de pago externas están **completamente deshabilitadas** en el sistema.
* En mostrador, cuando un estudiante decide transferir por Yape/Plin, lo hace directamente al número de teléfono personal del vendedor aliado. Por ende, para la editorial, **el dinero siempre se rinde y regulariza en efectivo físico** al momento del cuadre.
* Por esta razón, el campo `payment_method` en la tabla `sales` queda fijado por defecto en `'EFECTIVO'`, y la tabla `daily_settlements` unifica la recaudación en un único flujo de caja en efectivo:
  $$\text{total\_net\_for\_editorial} = \text{total\_gross\_income} - \text{total\_distributor\_commission}$$

### 2.5. Extensibilidad y Manejo de Imprevistos (`observations`)
* Para evitar bloqueos operativos ante situaciones atípicas (descuentos especiales, ejemplares con falla de imprenta, turnos especiales de personal, horarios restringidos), las entidades maestras y transaccionales incorporan el campo de texto libre `observations` / `notes`.

---

## 3. Diccionario de Datos Exhaustivo Campo por Campo

### 3.1. Tabla: `roles`
Catálogo de perfiles para el control de acceso RBAC.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador único del rol (ej. `'role-01'`). |
| `name` | `VARCHAR(50)` | NO | UNIQUE | Nombre del rol: `'ADMIN'`, `'LOGISTICS'`, `'DISTRIBUTOR'`. |
| `description` | `VARCHAR(255)` | NO | — | Explicación del ámbito de permisos. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha y hora de creación. |

---

### 3.2. Tabla: `branches`
Padrón maestro de distribuidoras aliadas físicas (poblado dinámicamente por el Admin).

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador único de la sede (ej. `'branch-01'`). |
| `code` | `VARCHAR(20)` | NO | UNIQUE | Código de sede asignado por el admin (ej. `'SEDE-TRILCE'`, `'SEDE-SIGLOXX'`). |
| `name` | `VARCHAR(100)` | NO | — | Nombre comercial de la distribuidora aliada. |
| `address` | `VARCHAR(200)` | NO | — | Dirección física del local comercial en Arequipa. |
| `phone` | `VARCHAR(30)` | SÍ | — | Teléfono o celular de contacto de la tienda. |
| `manager_name` | `VARCHAR(100)` | SÍ | — | Nombre del distribuidor aliado titular. |
| `observations` | `TEXT` | SÍ | — | Notas u observaciones sobre el local (horarios especiales, acuerdos, etc.). |
| `is_active` | `BOOLEAN` | NO | DEFAULT TRUE | Estado operativo (permite suspender locales sin borrar historial). |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha de alta en el sistema. |

---

### 3.3. Tabla: `users`
Cuentas de acceso con aislamiento obligatorio por sede para vendedores.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador único del usuario. |
| `email` | `VARCHAR(120)` | NO | UNIQUE | Correo electrónico de inicio de sesión. |
| `password_hash`| `VARCHAR(255)` | NO | — | Hash bcrypt de la contraseña. |
| `full_name` | `VARCHAR(120)` | NO | — | Nombres y apellidos completos del operador. |
| `role_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `roles.id` | Rol asignado (permisos RBAC). |
| `branch_id` | `VARCHAR(36)` | SÍ | FK $\rightarrow$ `branches.id`| Sede a la que pertenece. **Obligatoria para Distribuidores; nula para Administrador y Logística**. |
| `observations` | `TEXT` | SÍ | — | Comentarios u observaciones del colaborador. |
| `is_active` | `BOOLEAN` | NO | DEFAULT TRUE | Estado de habilitación de acceso. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha de creación. |

---

### 3.4. Tabla: `products`
Catálogo de publicaciones y tarifas parametrizadas por el Administrador.

| Campo              | Tipo SQL        | Nulo | Restricción     | Descripción y Propósito de Negocio                                      |
| ------------------ | --------------- | ---- | --------------- | ----------------------------------------------------------------------- |
| `id`               | `VARCHAR(36)`   | NO   | PK              | Identificador único del libro.                                          |
| `code`             | `VARCHAR(30)`   | NO   | UNIQUE          | Código editorial asignado por el admin (ej. `'QSY-BAS-01'`).            |
| `title`            | `VARCHAR(150)`  | NO   | —               | Título del libro creado por el administrador.                           |
| `education_level`  | `VARCHAR(50)`   | NO   | —               | Nivel pedagógico (`'Básico'`, `'Intermedio'`, `'Avanzado'`).            |
| `isbn`             | `VARCHAR(30)`   | SÍ   | —               | Código ISBN (opcional).                                                 |
| `public_price`     | `NUMERIC(10,2)` | NO   | CHECK ($> 0$)   | **Precio oficial de venta al público en S/** (fijado por el admin).     |
| `fixed_commission` | `NUMERIC(10,2)` | NO   | CHECK ($\ge 0$) | **Comisión fija unitaria en S/** para el distribuidor.                  |
| `observations`     | `TEXT`          | SÍ   | —               | Comentarios editoriales (fe de erratas, material complementario, etc.). |
| `is_active`        | `BOOLEAN`       | NO   | DEFAULT TRUE    | Habilitado para despacho y venta.                                       |
| `created_at`       | `TIMESTAMP`     | NO   | DEFAULT NOW     | Fecha de registro.                                                      |

---

### 3.5. Tabla: `branch_stock`
Balance de inventario físico en tiempo real por distribuidora y título.

| Campo                | Tipo SQL      | Nulo | Restricción                    | Descripción y Propósito de Negocio                                     |
| -------------------- | ------------- | ---- | ------------------------------ | ---------------------------------------------------------------------- |
| `id`                 | `VARCHAR(36)` | NO   | PK                             | Identificador único del registro de saldo.                             |
| `branch_id`          | `VARCHAR(36)` | NO   | FK $\rightarrow$ `branches.id` | Distribuidora física aliada.                                           |
| `product_id`         | `VARCHAR(36)` | NO   | FK $\rightarrow$ `products.id` | Libro en consignación.                                                 |
| `received_quantity`  | `INTEGER`     | NO   | CHECK ($\ge 0$)                | Unidades totales recibidas desde almacén.                              |
| `sold_quantity`      | `INTEGER`     | NO   | CHECK ($\ge 0$)                | Unidades totales vendidas en mostrador.                                |
| `available_quantity` | `INTEGER`     | NO   | CHECK ($\ge 0$)                | **Saldo disponible en mostrador** ($= \text{received} - \text{sold}$). |
| `updated_at`         | `TIMESTAMP`   | NO   | DEFAULT NOW                    | Última actualización por venta o despacho.                             |

*Restricción de unicidad:* `UNIQUE (branch_id, product_id)`.

---

### 3.6. Tabla: `consignments`
Cabecera de remisión de lotes de libros en consignación hacia las sucursales.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador del despacho. |
| `dispatch_code`| `VARCHAR(30)` | NO | UNIQUE | Código de remisión (ej. `'DESP-2026-0001'`). |
| `target_branch_id`| `VARCHAR(36)`| NO | FK $\rightarrow$ `branches.id`| Distribuidora aliada de destino. |
| `dispatcher_user_id`| `VARCHAR(36)`| NO | FK $\rightarrow$ `users.id` | Encargado de Logística que emite el lote. |
| `receiver_user_id`| `VARCHAR(36)`| SÍ | FK $\rightarrow$ `users.id` | Distribuidor que confirma la recepción física. |
| `status` | `VARCHAR(30)` | NO | DEFAULT `'PENDING'`| Estado: `'PENDING'`, `'RECEIVED'`, `'OBSERVED'`. |
| `notes` | `TEXT` | SÍ | — | Notas de empaque o traslado. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha de envío. |
| `received_at` | `TIMESTAMP` | SÍ | — | Fecha de conformidad en tienda. |

---

### 3.7. Tabla: `consignment_items`
Partidas de libros comprendidas en cada despacho.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador de la partida. |
| `consignment_id`| `VARCHAR(36)`| NO | FK $\rightarrow$ `consignments.id`| Despacho asociado. |
| `product_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `products.id`| Título de libro despachado. |
| `dispatched_quantity`| `INTEGER` | NO | CHECK ($> 0$) | Cantidad enviada por Logística. |
| `received_quantity`| `INTEGER` | SÍ | CHECK ($\ge 0$) | Cantidad contada y recibida por el distribuidor. |
| `discrepancy_notes`| `VARCHAR(255)`| SÍ | — | Detalle de faltantes o discrepancias. |

---

### 3.8. Tabla: `sales`
Registro de ventas presenciales en ventanilla (efectivo regularizado).

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador de la venta. |
| `client_sale_uuid`| `VARCHAR(36)`| NO | UNIQUE | **UUID generado en el navegador cliente** (idempotencia en sincronización offline). |
| `branch_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `branches.id`| Local donde se realizó la venta. |
| `seller_user_id`| `VARCHAR(36)` | NO | FK $\rightarrow$ `users.id` | Distribuidor que atendió la transacción. |
| `physical_receipt_number`| `VARCHAR(50)`| SÍ | — | N° de boleta física manual (si la pide el alumno). |
| `customer_dni` | `VARCHAR(15)` | NO | — | **DNI del alumno** (clave para validar garantías y recursos virtuales). |
| `customer_name`| `VARCHAR(120)`| NO | — | Nombre del estudiante comprador. |
| `payment_method`| `VARCHAR(30)` | NO | DEFAULT `'EFECTIVO'`| Modalidad de cobro regularizada en mostrador. |
| `total_amount` | `NUMERIC(10,2)`| NO | CHECK ($> 0$) | Total cobrado al alumno en S/. |
| `total_commission`| `NUMERIC(10,2)`| NO | CHECK ($\ge 0$)| Comisión monetaria fija devengada para el distribuidor. |
| `status` | `VARCHAR(30)` | NO | DEFAULT `'CONFIRMED'`| Estado (`'CONFIRMED'`, `'ANNULLED'`). |
| `is_offline_sync`| `BOOLEAN` | NO | DEFAULT FALSE | Marca de origen offline (IndexedDB). |
| `observations` | `TEXT` | SÍ | — | Notas u observaciones sobre la venta o reclamos de mostrador. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha y hora en el dispositivo vendedor. |
| `synced_at` | `TIMESTAMP` | SÍ | — | Fecha y hora de impacto en el servidor central. |

---

### 3.9. Tabla: `sale_items`
Líneas de venta con precio y comisión unitaria congelados en la transacción.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador de partida. |
| `sale_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `sales.id` | Venta asociada. |
| `product_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `products.id`| Título vendido. |
| `quantity` | `INTEGER` | NO | CHECK ($> 0$) | Ejemplares vendidos. |
| `unit_price` | `NUMERIC(10,2)`| NO | CHECK ($> 0$) | Precio unitario congelado. |
| `unit_commission`| `NUMERIC(10,2)`| NO | CHECK ($\ge 0$)| Comisión unitaria congelada. |
| `subtotal` | `NUMERIC(10,2)`| NO | CHECK ($> 0$) | Total bruto ($= \text{quantity} \times \text{unit\_price}$). |
| `subtotal_commission`| `NUMERIC(10,2)`| NO | CHECK ($\ge 0$)| Comisión total ($= \text{quantity} \times \text{unit\_commission}$). |

---

### 3.10. Tabla: `daily_settlements`
Balances diarios automáticos de rendición de cuentas por distribuidora.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador del arqueo. |
| `branch_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `branches.id`| Distribuidora que liquida. |
| `settler_user_id`| `VARCHAR(36)`| NO | FK $\rightarrow$ `users.id` | Distribuidor responsable. |
| `settlement_date`| `DATE` | NO | — | Fecha contable del cierre. |
| `total_sales_count`| `INTEGER` | NO | DEFAULT 0 | Cantidad de ventas realizadas en el día. |
| `total_gross_income`| `NUMERIC(10,2)`| NO | DEFAULT 0 | Ingreso bruto total en ventanilla (S/). |
| `total_distributor_commission`| `NUMERIC(10,2)`| NO | DEFAULT 0 | Comisión fija total que retiene el distribuidor. |
| `total_net_for_editorial`| `NUMERIC(10,2)`| NO | DEFAULT 0 | **Efectivo neto a rendir a QSY** ($= \text{gross} - \text{commission}$). |
| `status` | `VARCHAR(30)` | NO | DEFAULT `'SUBMITTED'`| Estado: `'SUBMITTED'`, `'VERIFIED_BY_ADMIN'`. |
| `observations` | `TEXT` | SÍ | — | Notas explicativas de la jornada. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha y hora de generación del balance. |

*Restricción de unicidad:* `UNIQUE (branch_id, settlement_date)`.

---

### 3.11. Tabla: `replenishment_requests` (Sprint 4 · HU-13)
Cabecera de la solicitud formal de reabastecimiento enviada por el distribuidor a Logística.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador de la solicitud. |
| `request_code` | `VARCHAR(30)` | NO | UNIQUE | Código legible (ej. `'REP-2026-0001'`). |
| `branch_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `branches.id` | Sede solicitante, tomada del token del usuario (**RN-05**). |
| `requested_by_user_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `users.id` | Distribuidor que envía el pedido. |
| `status` | `VARCHAR(30)` | NO | DEFAULT `'PENDING'`, CHECK | `'PENDING'` (Pendiente) o `'COMPLETED'` (Completada). |
| `notes` | `TEXT` | SÍ | — | Observaciones del pedido y de la entrega. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha de registro. |
| `completed_at` | `TIMESTAMP` | SÍ | — | Fecha de entrega registrada por Logística. |
| `completed_by_user_id` | `VARCHAR(36)` | SÍ | FK $\rightarrow$ `users.id` | Logística que registró la entrega (HU-14). |

---

### 3.12. Tabla: `replenishment_request_items` (Sprint 4 · HU-13 / HU-14)
Detalle por título de cada solicitud.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador de la línea. |
| `request_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `replenishment_requests.id` | Solicitud asociada. |
| `product_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `products.id` | Libro solicitado. |
| `requested_quantity` | `INTEGER` | NO | CHECK ($> 0$) | Cantidad solicitada (entero mayor que cero). |
| `delivered_quantity` | `INTEGER` | NO | DEFAULT 0, CHECK ($\ge 0$) | Cantidad realmente entregada (HU-14). |

*Restricción de unicidad:* `UNIQUE (request_id, product_id)`.

---

### 3.13. Tabla: `inventory_movements` (Sprint 4 · HU-14)
Trazabilidad de la reposición: cada entrega genera una **salida** del Almacén Central y una **entrada** a la sede.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador del movimiento. |
| `product_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `products.id` | Libro movido. |
| `movement_type` | `VARCHAR(30)` | NO | CHECK | `'REPLENISHMENT_OUT'` o `'REPLENISHMENT_IN'`. |
| `location_type` | `VARCHAR(20)` | NO | CHECK | `'CENTRAL'` o `'BRANCH'`. |
| `branch_id` | `VARCHAR(36)` | SÍ | FK $\rightarrow$ `branches.id` | Sede (NULL si la ubicación es el Almacén Central). |
| `quantity` | `INTEGER` | NO | CHECK ($> 0$) | Ejemplares movidos. |
| `replenishment_request_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `replenishment_requests.id` | Solicitud que originó el movimiento. |
| `performed_by_user_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `users.id` | Responsable de la operación. |
| `created_at` | `TIMESTAMP` | NO | DEFAULT NOW | Fecha del movimiento. |

---

### 3.14. Tabla: `notifications` (Sprint 4 · HU-13)
Notificaciones internas simples del MVP (sin servicios externos).

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador. |
| `target_role` | `VARCHAR(30)` | NO | — | Rol destinatario (`'LOGISTICS'`, `'DISTRIBUTOR'`). |
| `target_branch_id` | `VARCHAR(36)` | SÍ | FK $\rightarrow$ `branches.id` | Sede destinataria (los distribuidores solo ven la suya, **RN-05**). |
| `type` | `VARCHAR(40)` | NO | — | `'REPLENISHMENT_REQUESTED'` o `'REPLENISHMENT_COMPLETED'`. |
| `title` / `message` | `VARCHAR(150)` / `TEXT` | NO | — | Texto mostrado en la campana. |
| `replenishment_request_id` | `VARCHAR(36)` | SÍ | FK $\rightarrow$ `replenishment_requests.id` | Solicitud relacionada. |
| `is_read` / `read_at` | `BOOLEAN` / `TIMESTAMP` | NO / SÍ | DEFAULT FALSE | Estado de lectura. |

---

### 3.15. Tabla: `liquidations` (Sprint 4 · HU-15 / HU-16)
Liquidación de una distribuidora por período: lo que debe entregar a QSY (**Bruto − Comisión = Neto**). Los importes se congelan al generarse. El estado de cobro (HU-16) se deriva de `liquidation_payments`.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador. |
| `liquidation_code` | `VARCHAR(30)` | NO | UNIQUE | Código legible (`'LIQ-2026-0001'`). |
| `branch_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `branches.id` | Distribuidora liquidada. |
| `period_start` / `period_end` | `DATE` | NO | CHECK (`end >= start`) | Período (días completos, hora de Lima). |
| `sales_count` | `INTEGER` | NO | — | Ventas incluidas. |
| `gross_amount` | `NUMERIC(12,2)` | NO | CHECK ($\ge 0$) | Ingreso bruto = $\sum$ precio × cantidad. |
| `commission_amount` | `NUMERIC(12,2)` | NO | CHECK ($\ge 0$) | Comisión fija total = $\sum$ comisión × cantidad (**RN-06**). |
| `net_amount` | `NUMERIC(12,2)` | NO | CHECK ($\ge 0$) | Neto a entregar a QSY. |
| `paid_amount` / `pending_amount` | `NUMERIC(12,2)` | NO | CHECK ($\ge 0$) | Cobrado y saldo pendiente (HU-16). |
| `status` | `VARCHAR(20)` | NO | CHECK | `'PENDING'`, `'PARTIAL'`, `'PAID'`. |
| `due_date` | `DATE` | NO | — | Vencimiento = `period_end` + `LIQUIDATION_DUE_DAYS` (7 por defecto). |
| `notes` | `TEXT` | SÍ | — | Observaciones. |
| `created_by_user_id` / `created_at` | `VARCHAR(36)` / `TIMESTAMP` | NO | FK $\rightarrow$ `users.id` | Quién y cuándo generó la liquidación. |

---

### 3.16. Tabla: `liquidation_items` (Sprint 4 · HU-15)
Desglose por título con **precio y comisión congelados** (una línea por título + precio + comisión).

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador. |
| `liquidation_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `liquidations.id` | Liquidación. |
| `product_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `products.id` | Libro. |
| `title_snapshot` / `code_snapshot` | `VARCHAR` | NO | — | Título y código al momento de liquidar. |
| `quantity` | `INTEGER` | NO | CHECK ($> 0$) | Unidades vendidas. |
| `unit_price` / `unit_commission` | `NUMERIC(10,2)` | NO | CHECK | Precio y comisión unitarios aplicados en las ventas. |
| `gross_subtotal` / `commission_subtotal` | `NUMERIC(12,2)` | NO | CHECK ($\ge 0$) | Subtotales de ventas y de comisión. |

---

### 3.17. Tabla: `liquidation_sales` (Sprint 4 · HU-15)
Ventas incluidas en cada liquidación. **`sale_id` es PRIMARY KEY**: la base de datos impide liquidar una venta dos veces.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `sale_id` | `VARCHAR(36)` | NO | PK, FK $\rightarrow$ `sales.id` | Venta liquidada. |
| `liquidation_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `liquidations.id` | Liquidación que la contiene. |

---

### 3.18. Tabla: `liquidation_payments` (Sprint 4 · HU-16)
Cada cobro es un movimiento independiente; no se sobrescribe ni elimina.

| Campo | Tipo SQL | Nulo | Restricción | Descripción y Propósito de Negocio |
|---|---|---|---|---|
| `id` | `VARCHAR(36)` | NO | PK | Identificador (ordenable por fecha de registro). |
| `liquidation_id` | `VARCHAR(36)` | NO | FK $\rightarrow$ `liquidations.id` | Liquidación cobrada. |
| `amount` | `NUMERIC(12,2)` | NO | CHECK ($> 0$) | Monto recibido (máx. 2 decimales, nunca mayor al saldo). |
| `payment_method` | `VARCHAR(20)` | NO | CHECK | `'CASH'`, `'VOUCHER'` (constancia/comprobante), `'TRANSFER'`. |
| `payment_date` | `DATE` | NO | — | Fecha del pago (no futura). |
| `evidence` | `TEXT` | SÍ | — | N° de constancia / referencia (obligatoria si no es efectivo). |
| `registered_by_user_id` / `created_at` | `VARCHAR(36)` / `TIMESTAMP` | NO | FK $\rightarrow$ `users.id` | Quién y cuándo registró el cobro. |
