-- ==============================================================================
-- SCRIPT DDL: SISTEMA DE GESTIÓN COMERCIAL Y CONTROL DE EXISTENCIAS (QSY)
-- Compatibilidad: PostgreSQL 14+ / SQLite 3 (Sintaxis Estándar ANSI SQL)
-- Autor: Yourdyy (Scrum Master / Arquitecto de Software)
-- Sprint 1 + Sprint 2: Control de Inventario Central y Despachos en Consignación
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: ROLES (Catálogo de Perfiles RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,          -- 'ADMIN', 'LOGISTICS', 'DISTRIBUTOR'
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: BRANCHES (Padrón de las 3 Distribuidoras Aliadas Físicas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,          -- 'SEDE-TRILCE', 'SEDE-SIGLOXX', etc.
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    manager_name VARCHAR(100),                 -- Nombre del distribuidor aliado titular
    observations TEXT,                         -- Comentarios u observaciones libres
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: USERS (Cuentas de Acceso con Asociación de Rol y Sede)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,       -- Hash bcrypt (mínimo 10 rondas de salt)
    full_name VARCHAR(120) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36),                     -- NULL para el Administrador Global / Logística; obligatorio para Distribuidores
    observations TEXT,                         -- Comentarios u observaciones del colaborador
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: PRODUCTS (Catálogo de Libros y Tarifas - Poblado por el Admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,          -- Código asignado por el admin (ej. 'QSY-BAS-01')
    title VARCHAR(150) NOT NULL,
    education_level VARCHAR(50) NOT NULL,      -- 'Básico', 'Intermedio', 'Avanzado', 'Especializado', etc.
    isbn VARCHAR(30),
    public_price NUMERIC(10, 2) NOT NULL CHECK (public_price > 0),       -- Precio fijo de venta en S/
    fixed_commission NUMERIC(10, 2) NOT NULL CHECK (fixed_commission >= 0), -- Comisión fija por unidad en S/
    observations TEXT,                         -- Comentarios u observaciones editoriales
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4.1. TABLA: CENTRAL_STOCK (Existencias en Almacén Central de la Editorial)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS central_stock (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL UNIQUE,
    current_quantity INTEGER NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    min_critical_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_critical_stock >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 4.2. TABLA: NON_COMMERCIAL_EXITS (Kardex de Salidas Especiales, Muestras y Mermas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS non_commercial_exits (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    source_type VARCHAR(20) NOT NULL,           -- 'CENTRAL', 'BRANCH'
    branch_id VARCHAR(36),                      -- NULL si origen es Almacén Central
    movement_type VARCHAR(50) NOT NULL,         -- 'MUESTRA_DOCENTE', 'CORTESIA', 'PROMOCION', 'SORTEO', 'MERMA_DANO', 'AJUSTE'
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    justification TEXT NOT NULL,                -- RN-07: Justificación obligatoria
    authorized_by_user_id VARCHAR(36) NOT NULL, -- Usuario que autoriza el egreso
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (authorized_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: BRANCH_STOCK (Existencias por Distribuidora y Libro)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branch_stock (
    id VARCHAR(36) PRIMARY KEY,
    branch_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
    available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    UNIQUE (branch_id, product_id)
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: CONSIGNMENTS (Cabecera de Despachos en Consignación a Locales)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consignments (
    id VARCHAR(36) PRIMARY KEY,
    dispatch_code VARCHAR(30) NOT NULL UNIQUE, -- 'DESP-2026-0001'
    target_branch_id VARCHAR(36) NOT NULL,     -- Distribuidora aliada que recibe
    dispatcher_user_id VARCHAR(36) NOT NULL,   -- Encargado de Logística que envía
    receiver_user_id VARCHAR(36),              -- Distribuidor que confirma recepción física
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RECEIVED', 'OBSERVED'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    FOREIGN KEY (target_branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (dispatcher_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 7. TABLA: CONSIGNMENT_ITEMS (Detalle de Ejemplares por Despacho)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consignment_items (
    id VARCHAR(36) PRIMARY KEY,
    consignment_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    dispatched_quantity INTEGER NOT NULL CHECK (dispatched_quantity > 0),
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
    discrepancy_notes VARCHAR(255),
    FOREIGN KEY (consignment_id) REFERENCES consignments(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 8. TABLA: SALES (Ventas en Ventanilla - Pago en Efectivo Regularizado)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(36) PRIMARY KEY,
    client_sale_uuid VARCHAR(36) NOT NULL UNIQUE, -- UUID para idempotencia en sincronización offline
    branch_id VARCHAR(36) NOT NULL,
    seller_user_id VARCHAR(36) NOT NULL,
    physical_receipt_number VARCHAR(50),          -- N° de boleta física manual (si la pide el alumno)
    customer_dni VARCHAR(15) NOT NULL,            -- DNI del alumno para garantía y accesos web
    customer_name VARCHAR(120) NOT NULL,          -- Nombre completo del estudiante
    payment_method VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO', -- Todo se regulariza en efectivo de mostrador
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    total_commission NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_commission >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'ANNULLED'
    is_offline_sync BOOLEAN DEFAULT FALSE,
    observations TEXT,                            -- Comentarios u observaciones adicionales
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: SALE_ITEMS (Detalle de Títulos y Comisiones Fijas Congeladas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    unit_commission NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (unit_commission >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal > 0),
    subtotal_commission NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal_commission >= 0),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 10. TABLA: DAILY_SETTLEMENTS (Liquidaciones y Arqueos Diarios en Efectivo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_settlements (
    id VARCHAR(36) PRIMARY KEY,
    branch_id VARCHAR(36) NOT NULL,
    settler_user_id VARCHAR(36) NOT NULL,         -- Distribuidor que genera el balance
    settlement_date DATE NOT NULL,
    total_sales_count INTEGER NOT NULL DEFAULT 0,
    total_gross_income NUMERIC(10, 2) NOT NULL DEFAULT 0,       -- Total recaudado en mostrador
    total_distributor_commission NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Comisión fija retenida por el distribuidor
    total_net_for_editorial NUMERIC(10, 2) NOT NULL DEFAULT 0,      -- Neto en efectivo a entregar a QSY
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'VERIFIED_BY_ADMIN'
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (settler_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE (branch_id, settlement_date)
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO Y AISLAMIENTO DE DATOS MULTI-SEDE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_central_stock_product ON central_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_non_comm_exits_prod ON non_commercial_exits(product_id);
CREATE INDEX IF NOT EXISTS idx_non_comm_exits_branch ON non_commercial_exits(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_lookup ON branch_stock(branch_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_date ON sales(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_dni ON sales(customer_dni);
CREATE INDEX IF NOT EXISTS idx_sales_sync_uuid ON sales(client_sale_uuid);
CREATE INDEX IF NOT EXISTS idx_consignments_branch ON consignments(target_branch_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_branch_date ON daily_settlements(branch_id, settlement_date);

-- ==============================================================================
-- DATOS SEMILLA BASE INICIALES (MÍNIMOS NECESARIOS)
-- ==============================================================================

-- 1. Roles del Sistema (Catálogo Inmutable RBAC)
INSERT INTO roles (id, name, description) VALUES
('role-01', 'ADMIN', 'Administrador General de Editorial QSY con visión global'),
('role-02', 'LOGISTICS', 'Encargado de Logística y Almacén Central de Publicaciones'),
('role-03', 'DISTRIBUTOR', 'Distribuidor / Vendedor en punto de venta aliado presencial')
ON CONFLICT (name) DO NOTHING;

-- 2. Usuario Super-Administrador Inicial
-- Contraseña temporal bcrypt: 'Admin123!' (debe actualizarse en el primer login)
INSERT INTO users (id, email, password_hash, full_name, role_id, branch_id, observations, is_active) VALUES
('user-admin-01', 'admin@editorialqsy.com', '$2b$10$fimOaIiaveBCbnNLzG89KuOw5mY39wJ9hCquAqnLq9EpL/2.iKFb2', 'Administrador General QSY', 'role-01', NULL, 'Cuenta semilla maestra del sistema', TRUE)
ON CONFLICT (email) DO NOTHING;
