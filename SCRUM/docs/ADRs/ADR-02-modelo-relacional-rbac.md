# ADR-02: Diseño del Modelo Relacional, Control de Acceso RBAC y Aislamiento Multi-Sucursal

* **Estado:** Aceptado
* **Fecha:** 2026-10-14
* **Autor:** Yourdyy (Scrum Master / Arquitecto de Software)
* **Proyecto:** Sistema de Gestión Comercial y Control de Inventarios — Editorial QSY
* **Componente:** Base de Datos / Modelo Relacional / Seguridad

---

## 1. Contexto y Planteamiento del Problema

El modelo operativo de la editorial **QSY** se fundamenta en la consignación de ejemplares impresos hacia locales aliados comerciales independientes en la ciudad de Arequipa: las tres distribuidoras oficiales **Trilce**, **Siglo XX** y **Jerusalén**.

El sistema de información debe responder a cuatro imperativos estrictos de negocio:
1. **Aislamiento Multi-Sede Innegociable (RN-05):** Cada distribuidora aliada compite indirectamente por ubicación céntrica. Bajo ninguna circunstancia un vendedor de una sede puede visualizar el stock remanente, las ventas diarias, los montos de liquidación o los pedidos de reposición de otra distribuidora.
2. **Inmutabilidad de Tarifas y Comisiones (RN-03):** El catálogo de libros cuenta con precios de venta al público y comisiones fijas monetarias (en soles) por ejemplar vendido. Estos valores son dados de alta y parametrizados exclusivamente por el Administrador General; los vendedores en ventanilla tienen estrictamente vedada la alteración de precios o la aplicación de descuentos discrecionales.
3. **Trazabilidad de Ventas para Garantías y Recursos Virtuales (RN-06):** Para atender reclamos de hojas falladas de imprenta y habilitar claves de acceso a plataformas virtuales de aprendizaje quechua, cada venta debe capturar obligatoriamente el DNI y nombre del estudiante comprador.
4. **Liquidación Diaria y Rendición de Cuentas (RN-04):** El cierre diario exige conciliar las unidades vendidas, el saldo en efectivo físico (donde cualquier transferencia personal por Yape al vendedor es regularizada en efectivo por este) y la deducción automática de la comisión fija pactada por libro.

Frente a estas condiciones, se requería definir el paradigma de base de datos (Relacional SQL vs. NoSQL orientada a documentos) y la estructura de tablas para garantizar consistencia transaccional y seguridad por diseño.

---

## 2. Decisión Tomada

Se decide diseñar e implementar un **Modelo de Datos Relacional normalizado en Tercera Forma Normal (3FN)** soportado sobre **PostgreSQL 16** (y compatible con **SQLite 3** para desarrollo local y pruebas). Se descarta el paradigma NoSQL debido a la naturaleza estrictamente transaccional, contable y auditable de los procesos de inventario y ventas en consignación.

### 2.1. Arquitectura de Esquemas y Modularidad
El modelo relacional se organiza en tres capas conceptuales que evolucionan armónicamente con los Sprints del proyecto:

1. **Capa Nuclear Fundacional (Sprint 1 - M1):**
   * `roles`: Catálogo inmutable de perfiles y roles del sistema (`ADMIN`, `LOGISTICS`, `DISTRIBUTOR`).
   * `branches`: Padrón de distribuidoras aliadas físicas (la tabla inicia vacía para que el Administrador las dé de alta dinámicamente vía `HU-02` sin hardcoding, escalando libremente si la red crece).
   * `users`: Cuentas de acceso creadas por la administración (inicia únicamente con el Super-Admin semilla), con credenciales hasheadas (`bcrypt`), rol asignado y aislamiento obligatorio por sede (`branch_id`).
   * `products`: Catálogo oficial de títulos, creado y gestionado exclusivamente por el Administrador (la tabla inicia vacía por diseño para habilitar la administración dinámica de publicaciones y comisiones vía `HU-03`).
   * **Extensibilidad (`observations`):** Inclusión de campos de texto libre en entidades maestras y transaccionales para absorber casuísticas operativas imprevistas.

2. **Capa Operativa de Existencias y Consignaciones (Sprint 2 y 4 - M1 / M3):**
   * `consignments` y `consignment_items`: Registro formal de remisiones físicas desde el almacén central hacia las distribuidoras aliadas.
   * `branch_stock`: Tabla de saldos en tiempo real por tupla `(branch_id, product_id)`, manteniendo cantidades consignadas, vendidas y saldo físico disponible.
   * `restock_requests`: Solicitudes digitales de reposición emitidas por los distribuidores.

3. **Capa Transaccional de Ventas y Liquidación (Sprint 3 y 5 - M2 / M4 / M5):**
   * `sales` y `sale_items`: Transacciones de mostrador en efectivo regularizado, vinculando boleta manual física, DNI del alumno y hash de sincronización offline.
   * `daily_settlements`: Balances de cierre diario automatizados con arqueo de efectivo y comisiones retenidas.

### 2.2. Mecanismos de Aislamiento y Seguridad RBAC
* **Particionamiento Lógico en Consultas:** Toda tabla transaccional (`sales`, `branch_stock`, `consignments`, `daily_settlements`) contiene una columna obligatoria `branch_id REFERENCES branches(id)`.
* **Filtro Forzoso en Backend:** Los servicios de la API REST interceptan el token JWT del usuario; si el rol es `DISTRIBUTOR`, se inyecta automáticamente el predicado `WHERE branch_id = $jwt.branch_id` en el constructor de consultas, haciendo imposible que un usuario consulte datos ajenos incluso manipulando URLs o parámetros de petición.

### 2.3. Políticas de Integridad y Restricciones
* **Restricción de Eliminación Referencial (`ON DELETE RESTRICT`):** Ninguna sede, producto o usuario que posea ventas o despachos históricos puede ser eliminado de la base de datos física, preservando la inmutabilidad de la auditoría comercial durante al menos dos años.
* **Restricciones de Dominio (`CHECK`):**
  * `products.public_price > 0`: Todo libro debe tener precio positivo.
  * `products.fixed_commission >= 0`: La comisión no puede ser negativa.
  * `sale_items.quantity > 0`: No se permiten renglones de venta en cero o negativos.
  * `branch_stock.available_quantity >= 0`: El inventario disponible nunca puede caer en números rojos (prevención de sobreventa).

---

## 3. Consecuencias

### 3.1. Consecuencias Positivas
* **Consistencia Transaccional ACID:** Toda venta reduce atómicamente el stock en `branch_stock` e inserta la cabecera y detalle en `sales`, asegurando que no existan descuadres entre mostrador y almacén.
* **Consultas Rápidas Indexadas:** La inclusión de índices compuestos B-Tree sobre `(branch_id, created_at)` garantiza que las consultas de liquidación diaria respondan en menos de 100 milisegundos.
* **Auditoría Transparente:** La persistencia del DNI del estudiante y el número de boleta física permite resolver cualquier reclamo de garantía o discrepancia de liquidación de forma inmediata.

### 3.2. Consecuencias Negativas y Mitigaciones
* **Normalización estricta que exige sentencias JOIN:**
  * *Mitigación:* Se implementan índices relacionales en todas las claves foráneas para que los JOINs de reportes diarios operen en memoria sin escaneo secuencial de tablas.
