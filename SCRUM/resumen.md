## PARTE PREVIA: La Lógica del Negocio de Editorial QSY 
### 1. El Contexto Comercial Real (Entrevista con Don Walter)
Editorial QSY es una editorial arequipeña especializada en la enseñanza del idioma quechua (libros de nivel Básico, Intermedio, Avanzado, Quechua Médico y Diccionarios).

- **Modelo de Consignación:** La editorial no vende directamente al público en una tienda propia grande; opera mediante 3 distribuidoras aliadas físicas céntricas en Arequipa (Trilce en San Juan de Dios, Siglo XX y Jerusalén).

- Mecánica de Tarifas y Comisiones:
	- El precio de venta al público (PVP) es fijo e inmutable (ej. S/ 35.00). No hay descuentos discrecionales en mostrador (RN-03).
	- La comisión del distribuidor es un monto fijo monetario por unidad vendida (ej. S/ 5.00 en efectivo por libro vendido, no un porcentaje).
	- Margen Neto QSY: Precio Público - Comisión Fija = Ingreso Editorial (ej. 35.00 - 5.00 = S/ 30.00).
	
- **Problema Crítico de Conectividad:** Los locales están en casonas y sótanos del Centro Histórico de Arequipa con señal móvil precaria. El sistema debe operar en mostrador incluso sin internet (diseño Mobile-First / Capacitor) y sincronizarse cuando regrese la señal.

---

### 2. Entidades principales y Propiedades clave

~~~mermaid
erDiagram
        ROLES ||--o{ USERS : "define perfil"
        BRANCHES ||--o{ USERS : "asigna personal"
        PRODUCTS {
            string id PK
            string code UK
            string title
            string education_level
            numeric public_price
            numeric fixed_commission
            boolean is_active
        }
        BRANCHES {
            string id PK
            string code UK
            string name
            string address
            string phone
            string manager_name
            text observations
            boolean is_active
        }
        USERS {
            string id PK
            string email UK
            string password_hash
            string full_name
            string role_id FK
            string branch_id FK
            boolean is_active
        }
~~~

1. **roles:** Catálogo inmutable de perfiles RBAC.
	- Campos: id, name (ADMIN, LOGISTICS, DISTRIBUTOR), description.

2. **branches:** Padrón físico de las distribuidoras aliadas.
	- Campos: id, code (ej. SEDE-TRILCE), name, address, phone, manager_name, observations (campo de texto libre solicitado por el cliente para horarios y acuerdos especiales), is_active. 

3. **users:** Cuentas de acceso con seguridad y ámbito territorial.
	- Campos: id, email, password_hash (bcrypt), full_name, role_id (FK roles), branch_id (FK branches, obligatorio para distribuidores, nulo para Admin global), observations.

4. **products:** Catálogo maestro de publicaciones educativas y tarifas.
	- Campos: id, code (ej. QSY-BAS-01), title, education_level (Básico, Intermedio, Avanzado, Médico, Diccionario), isbn, public_price (NUMERIC > 0), fixed_commission (NUMERIC >= 0), observations.
	- Restricción Check: fixed_commission < public_price (la comisión nunca puede superar al precio).

---
### 3. Cómo funciona el sistema según cada Rol
1. Administrador General (ADMIN - Don Walter / Gerencia):
	- *Alcance:* Visión 100% global e irrestricta.
	- *Operaciones:* Da de alta y gestiona las distribuidoras (branches), crea usuarios distribuidores y los vincula a una sede, define el catálogo de libros, altera precios y comisiones oficiales. Solo él tiene autorización para mutar tarifas.

2. Encargado de Logística (LOGISTICS):
	- *Alcance:* Control de stock central y despachos.
	- *Operaciones:* Prepara los envíos en consignación de la imprenta hacia los locales. No tiene autorización para alterar precios ni comisiones.

3. Distribuidor / Vendedor en Mostrador (DISTRIBUTOR):
	- *Alcance:* Estrictamente local (RN-05: Aislamiento por Sede).
	- *Operaciones:* Entra desde su celular o PC. El backend detecta su branch_id y le bloquea cualquier intento de consultar datos de otros locales con 403 `Forbidden (BRANCH_ACCESS_DENIED)`. No puede crear libros ni alterar precios; solo puede consultar el catálogo oficial para registrar ventas en mostrador.

## PARTE 1: Cómo descompusimos las tareas y cuáles son exactamente 

Descompusimos las Historias de Usuario bajo un modelo matricial de 4 disciplinas de ingeniería de software, asignando a cada integrante una responsabilidad técnica especializada:
- Arquitectura & Base de Datos: Yourdyy (Scrum Master)
- Backend, APIs & Seguridad: Leonardo
- Frontend Mobile-First & UI: Miguel
- Aseguramiento de Calidad (QA) & Pruebas: Dolly

### Lista Exacta de las 14 Tareas del Sprint 1
| ID Tarea   | Título Técnico                                                         | Responsable | Estimación | Estado |
| ---------- | ---------------------------------------------------------------------- | ----------- | ---------- | ------ |
| TASK-01-01 | Definición de ADR-01 y scaffolding base del backend y frontend         | Yourdyy     | 4 h        | done   |
| TASK-01-02 | Definición de ADR-02, script DDL relacional y datos semilla            | Yourdyy     | 4 h        | done   |
| TASK-01-03 | Implementación de API REST de autenticación (/login, /me) con JWT      | Leonardo    | 6 h        | done   |
| TASK-01-04 | Middleware RBAC y aislamiento forzoso por sede (enforceBranchScope)    | Leonardo    | 4 h        | done   |
| TASK-01-05 | Interfaz web móvil (Mobile-First) de Login y gestión de sesión         | Miguel      | 5 h        | done   |
| TASK-01-06 | Pruebas de integración de autenticación, JWT y seguridad RBAC          | Dolly       | 3 h        | done   |
| TASK-02-01 | Migración DDL tabla branches con campo observations                    | Yourdyy     | 3 h        | done   |
| TASK-02-02 | Endpoints REST para gestión de distribuidoras y asignación de personal | Leonardo    | 4 h        | done   |
| TASK-02-03 | Interfaz web para administración del padrón de distribuidoras          | Miguel      | 5 h        | done   |
| TASK-02-04 | Pruebas funcionales de registro de sedes y unicidad de códigos         | Dolly       | 2 h        | done   |
| TASK-03-01 | Migración DDL tabla products y reglas check de comisión fija           | Yourdyy     | 3 h        | done   |
| TASK-03-02 | Endpoints REST catálogo de publicaciones y tarifas inmutables          | Leonardo    | 4 h        | done   |
| TASK-03-03 | Interfaz web de catálogo de libros y cálculo de margen neto (S/)       | Miguel      | 5 h        | done   |
| TASK-03-04 | Pruebas de inmutabilidad de precios (RN-03) y límites de comisión      | Dolly       | 2 h        | done   |

--- 

## PARTE 2: Qué parte exacta del código se implementó en cada Historia 

Para que en la exposición puedas abrir los archivos y mostrarlos con nombre propio:
### HU-01: Autenticación, Roles y Aislamiento por Sede (8 SP)
- **Base de Datos:** Tablas roles y users en schema.sql. Incluye seed del Super-Administrador con hash bcrypt seguro.

- **Backend:**
	- *auth.service.ts y auth.controller.ts:* Login con validación Zod, comparación segura bcrypt y firma de JWT (con user_id, role y branch_id).
	- *auth.middleware.ts:* Decodificación de Bearer Token y validación de expiración.
	- *rbac.middleware.ts:* Función enforceBranchScope que compara la sede solicitada en la petición con la sede del token del distribuidor; si intenta mirar otra sede, lanza `AppError.forbidden('BRANCH_ACCESS_DENIED').`

- **Frontend:**
	- *AuthContext.tsx:* Manejo global del estado de sesión, persistencia de token en localStorage y verificación inicial con /auth/me.
	- *LoginView.tsx:* Vista Mobile-First táctil con inputs accesibles, mensajes de error visuales y botón demo para evaluación rápida.

- **QA & Tests:** Suite en integration.test.ts que valida login exitoso (200), contraseña incorrecta (401), token falsificado (401) y aislamiento estricto de sede (403).

--- 

### HU-02: Gestión del Padrón de Distribuidoras y Personal (5 SP)

- **Base de Datos:** Tabla branches en schema.sql con clave foránea en users.branch_id.

- **Backend:**
      • branch.repository.ts y user.repository.ts: Consultas SQL estándar con findByBranchId.
      • branch.service.ts y branch.routes.ts: Endpoints GET /branches, POST /branches (código único), GET /branches/:id/users y POST /branches/:id/users para
      registrar y asociar vendedores a cada local.

- **Frontend:**
      • BranchesView.tsx: Padrón con buscador en tiempo real, badges de estado Activo/Inactivo, modal de alta de nueva sede con validaciones y modal de gestión de
      personal asignado a la sede.

- **QA & Tests:** Pruebas de alta de sucursal (201), rechazo ante código duplicado (409), asignación de vendedor y listado de personal en integration.test.ts.

---
### HU-03: Catálogo Maestro de Libros y Tarifas Inmutables (5 SP)

- **Base de Datos:** Tabla products en schema.sql con tipos NUMERIC(10,2) para precisión financiera y restricción CHECK (fixed_commission < public_price).

- **Backend:**
	- *product.schema.ts:* Esquema Zod con regla .refine(data => data.fixed_commission < data.public_price).
	- *product.routes.ts y product.service.ts:* POST y PUT protegidos exclusivamente con requireRoles('ADMIN'); el Distribuidor solo tiene permitido el método GET /products.

- **Frontend:**
	- *ProductsView.tsx:* Catálogo con filtros por nivel educativo (Básico, Intermedio, Avanzado, Médico), formateo en moneda peruana (S/ 0.00), modal de alta con cálculo automático y visual del margen neto (Precio - Comisión) e impedimento de guardar si la comisión supera el precio.

- **QA & Tests:** Pruebas que validan creación de libros (201), bloqueo ante comisión mayor o igual al precio (400), bloqueo cuando un distribuidor intenta modificar un precio (403) y lectura correcta del catálogo.




---

## PARTE 3: Sprint 2 - Inventario Central, Despacho en Consignación y Alertas (21 SP)

El Sprint 2 consolida el flujo completo de abastecimiento y custodia de existencias de Editorial QSY:

### Lista de las 17 Tareas del Sprint 2
| ID Tarea   | Título Técnico                                                             | Responsable | Estimación | Estado |
| ---------- | -------------------------------------------------------------------------- | ----------- | ---------- | ------ |
| TASK-04-01 | Script DDL para central_stock y tablas de consignación                     | Yourdyy     | 3 h        | done   |
| TASK-04-02 | Endpoints REST de despacho en consignación y validación RN-01              | Leonardo    | 5 h        | done   |
| TASK-04-03 | Interfaz web de preparación y emisión de despachos                         | Miguel      | 5 h        | done   |
| TASK-04-04 | Pruebas de integración de despacho y validación de stock central           | Dolly       | 3 h        | done   |
| TASK-05-01 | Endpoints REST de recepción de lotes y acreditación en branch_stock        | Leonardo    | 4 h        | done   |
| TASK-05-02 | Interfaz web móvil (Mobile-First) de confirmación y reporte de discrepancias | Miguel      | 4 h        | done   |
| TASK-05-03 | Pruebas funcionales de recepción conforme y aislamiento por sede (RN-05)   | Dolly       | 2 h        | done   |
| TASK-06-01 | Endpoints REST de matriz de balance consolidado y restricción territorial  | Leonardo    | 4 h        | done   |
| TASK-06-02 | Interfaz web de matriz de inventario y vista de mostrador por sede         | Miguel      | 5 h        | done   |
| TASK-06-03 | Pruebas de visibilidad cruzada para Admin y restricción para Distribuidor | Dolly       | 3 h        | done   |
| TASK-07-01 | Script DDL tabla non_commercial_exits y modelo de kardex de bajas          | Yourdyy     | 3 h        | done   |
| TASK-07-02 | Endpoints REST de salidas especiales con validación de justificación (RN-07) | Leonardo    | 4 h        | done   |
| TASK-07-03 | Interfaz web modal para registro de muestras docentes y mermas             | Miguel      | 4 h        | done   |
| TASK-07-04 | Pruebas de validación estricta de motivo (RN-07) y descuento en kardex     | Dolly       | 2 h        | done   |
| TASK-08-01 | Servicio y endpoints REST de detección de stock crítico y umbrales         | Leonardo    | 3 h        | done   |
| TASK-08-02 | Componente visual de alertas dinámicas con insignias y resaltado en rojo   | Miguel      | 4 h        | done   |
| TASK-08-03 | Pruebas de activación y normalización automática de alertas ante reposición | Dolly       | 2 h        | done   |

### Qué parte exacta del código se implementó en cada Historia del Sprint 2:
- **HU-04 (Despacho en Consignación - 5 SP):**
  - *Base de datos:* Tablas `central_stock`, `consignments`, `consignment_items` en `schema.sql`.
  - *Backend:* `consignment.service.ts` (`createDispatch`), validación de existencias centrales (RN-01), descuento automático y numeración correlativa `DESP-YYYY-XXXX`.
  - *Frontend:* Modal en `ConsignmentsView.tsx` con selección de sede y adición dinámica de títulos.
  - *QA:* Suite en `sprint2.integration.test.ts` que valida alta en central, emisión y bloqueo por sobreventa (400).
- **HU-05 (Confirmación Digital de Recepción - 3 SP):**
  - *Backend:* `consignment.service.ts` (`confirmReception`), acreditación automática en `branch_stock` y restricción RN-05 (403 si un distribuidor intenta confirmar otra sede).
  - *Frontend:* Botones en `ConsignmentsView.tsx` para "Conforme" directo o "Observar Faltante" con reporte de daños.
  - *QA:* Pruebas de recepción conforme y con discrepancia (status `OBSERVED`).
- **HU-06 (Consulta de Stock Central y Multisede - 5 SP):**
  - *Backend:* `inventory.service.ts` (`getInventoryBalance`), matriz consolidada para Logística/Admin y filtro territorial estricto para Distribuidores.
  - *Frontend:* `InventoryView.tsx` con tabla matriz multisede y vista resumida de mostrador.
  - *QA:* Verificación de visibilidad global para Administrador y aislamiento de cifras para distribuidores.
- **HU-07 (Salidas No Comerciales y Mermas Justificadas - 5 SP):**
  - *Base de datos:* Tabla `non_commercial_exits` con tipo, origen, cantidad y justificación.
  - *Backend:* `inventory.service.ts` (`registerNonCommercialExit`), validación Zod de motivo $\ge 5$ caracteres (RN-07) y descuento atómico.
  - *Frontend:* Modal de egreso y kardex histórico en `InventoryView.tsx`.
  - *QA:* Pruebas de rechazo sin motivo (400) y verificación de auditoría.
- **HU-08 (Alertas de Stock Crítico - 3 SP):**
  - *Backend:* `inventory.service.ts` (`getCriticalAlerts`) con umbral $\le 3$ unidades por sede.
  - *Frontend:* Badge contador con animación de pulso en `Navbar.tsx` y banner en `InventoryView.tsx`.
  - *QA:* Pruebas de detonación de alerta roja y normalización automática tras reposición.
