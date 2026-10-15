# Especificación de Arquitectura del Sistema: Niveles Físico, Lógico y Red

* **Módulo:** Arquitectura de Solución
* **Fecha:** 2026-10-14
* **Autor:** Yourdyy (Scrum Master / Arquitecto de Software)
* **ADRs Relacionados:** [`ADR-01`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/docs/ADRs/ADR-01-stack-tecnologico.md), [`ADR-02`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/docs/ADRs/ADR-02-modelo-relacional-rbac.md)

---

## 1. Visión General de la Arquitectura en Dos Niveles

Para responder a las restricciones de infraestructura de **Editorial QSY** (servidor VPS y ausencia de internet por cable en puntos de venta), el sistema se estructura bajo una **Arquitectura en Dos Niveles Desacoplados (Cliente Híbrido - Servidor Centralizado)**:

```mermaid
flowchart TD
    subgraph NIVEL_1 ["NIVEL 1: CLIENTES Y DISPOSITIVOS DE USUARIO"]
        direction TB
        subgraph Terminales_Moviles ["Terminales de Distribuidores (Puntos de Venta Físicos)"]
            APK["App Android APK (Capacitor)"]
            IDB["IndexedDB Local (Outbox de Ventas & Stock Offline)"]
            APK <--> IDB
        end

        subgraph Terminales_Escritorio ["Terminales Administrativas (Oficina / Remoto)"]
            WebSPA["Navegador Web (Chrome / Edge / Firefox)"]
            AdminUI["Web SPA React (Módulos Admin y Logística)"]
            WebSPA --- AdminUI
        end
    end

    subgraph RED ["CANAL DE COMUNICACIÓN"]
        Internet["Internet Público / Datos Móviles 3G-4G"]
        OfflineQueue["Tolerancia a Cortes: Cola de Sincronización Diferida"]
    end

    subgraph NIVEL_2 ["NIVEL 2: SERVIDOR CENTRAL Y PERSISTENCIA (VPS HOSTINGER)"]
        direction TB
        Nginx["Proxy Inverso Nginx / SSL (Certbot)"]
        
        subgraph Docker_Compose ["Entorno Contenedorizado Docker"]
            API["Backend Node.js 26 + Express + TypeScript"]
            AuthMod["Módulo RBAC & Auth JWT"]
            SalesMod["Módulo Comercial & Liquidaciones"]
            StockMod["Módulo Inventario & Consignaciones"]
            
            API --> AuthMod
            API --> SalesMod
            API --> StockMod
        end

        subgraph Persistencia ["Capa de Persistencia Relacional"]
            PG[("PostgreSQL 16 (Producción / VPS)")]
            SQLITE[("SQLite 3 (Desarrollo Local & Testing)")]
        end
    end

    Terminales_Moviles <==>|HTTPS / REST API con reintentos| Nginx
    Terminales_Escritorio <==>|HTTPS / REST API estándar| Nginx
    Nginx -->|Proxy Pass :3000| API
    API -->|Pool de Conexiones TCP| PG
    API -.->|Conmutable en Desarrollo| SQLITE
```

---

## 2. Nivel 1: Clientes y Dispositivos de Usuario

El nivel cliente resuelve la interacción humana diferenciada por rol y contexto operativo:

### 2.1. Terminal Móvil para Distribuidores (App Android APK con Capacitor)
* **Destinatarios:** Vendedores presenciales en ventanilla de librerías aliadas (Trilce, Siglo XX, Jerusalén).
* **Entorno de Ejecución:** Aplicación Android compilada directamente a `.apk` mediante **Capacitor**, sin necesidad de publicación en Google Play Store (*sideloading* directo).
* **Mitigación de Errores de Usuario:**
  * Al no correr en la pestaña de un navegador, no existe barra de direcciones URL ni botones de retroceso o recarga accidental (*pull-to-refresh*).
  * Si el vendedor cierra la app, la pantalla se apaga o el celular se reinicia sin internet, la aplicación abre instantáneamente desde los archivos empaquetados en el almacenamiento interno (`android_asset/public/`).
* **Operación Tolerante a Desconexión (`IndexedDB`):**
  * Almacena el catálogo de productos y el saldo de stock disponible para permitir ventas inmediatas ($< 2$ minutos).
  * Guarda las ventas offline en la tienda de objetos `sales_outbox` con UUID idempotente generado en el dispositivo.
  * Genera el comprobante interno de venta en formato PDF localmente para entrega inmediata al estudiante comprador.

### 2.2. Terminal de Escritorio para Administración y Logística (Web SPA)
* **Destinatarios:** Administrador General de QSY y Encargado de Logística / Almacén Central.
* **Entorno de Ejecución:** Aplicación Web de Página Única (SPA) ejecutada en cualquier navegador de escritorio moderno sobre laptops o PCs de oficina.
* **Funciones:**
  * Alta y gestión de distribuidoras aliadas ([`HU-02`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/sprint-backlog/user-stories/HU-02.md)).
  * Parametrización del catálogo de libros, niveles, precios y comisiones fijas ([`HU-03`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/sprint-backlog/user-stories/HU-03.md)).
  * Emisión de remisiones de consignación y confirmación de lotes de imprenta.
  * Supervisión analítica consolidada y validación de liquidaciones diarias.

---

## 3. Nivel 2: Servidor Central y Persistencia (VPS)

El nivel servidor se ejecuta en el servidor VPS contratado por la empresa (2 vCPU, 8 GB RAM, Ubuntu Server 22.04 LTS), orquestado íntegramente mediante **Docker Compose**:

### 3.1. Proxy Inverso y Terminación SSL (Nginx)
* Atiende tráfico seguro en el puerto `443` con certificado TLS/SSL gratuito emitido por Let's Encrypt / Certbot.
* Aplica compresión Brotli / Gzip para respuestas JSON y assets estáticos.
* Aplica limitador de tasa de peticiones (*Rate Limiting*) para proteger los endpoints de autenticación contra ataques de fuerza bruta.
* Redirige las peticiones al contenedor de backend en el puerto interno `3000`.

### 3.2. Contenedor de Servicios API (Node.js 26 Alpine)
* Ejecuta el servidor Express compilado con TypeScript bajo configuración estricta.
* Expone la interfaz de programación RESTful bajo el prefijo `/api/v1/`.
* Aplica arquitectura en capas limpias (*Clean Layered Architecture*): Controladores, Servicios, Repositorios y Validadores Zod.
* Gestiona el aislamiento de datos multi-sucursal inyectando `branch_id` en las consultas de los usuarios con rol `DISTRIBUTOR`.

### 3.3. Contenedor de Base de Datos (PostgreSQL 16)
* Motor relacional transaccional ACID con volumen persistente en disco (`pgdata_volume`).
* Aislamiento por restricciones de clave foránea e índices compuestos B-Tree optimizados para consultas de cuadre y reportes.
* Respaldo diario automatizado mediante tarea cron en el sistema operativo del host hacia un directorio seguro.

---

## 4. Ciclo de Vida de Sincronización Offline (Patrón Outbox)

El siguiente diagrama detalla cómo viaja una venta realizada en un punto de venta con mala señal:

```mermaid
sequenceDiagram
    autonumber
    actor Alumno as Estudiante Comprador
    actor Vendedor as Distribuidor (Ventanilla)
    participant App as App Móvil (Capacitor)
    participant IDB as IndexedDB (Local)
    participant API as Backend REST (VPS)
    participant DB as PostgreSQL 16

    Alumno->>Vendedor: Solicita libro y paga en efectivo (S/ 50.00)
    Vendedor->>App: Digita DNI, Nombre y selecciona título
    App->>App: Valida stock local y calcula comisión fija (ej. S/ 8.00)
    
    alt Dispositivo SIN Internet (Modo Offline)
        App->>IDB: Guarda venta en "sales_outbox" (status: pending_sync, UUID generado)
        App->>IDB: Descuenta 1 unidad de stock local disponible
        App->>Vendedor: Emite comprobante PDF interno y confirma en pantalla
        Vendedor->>Alumno: Entrega libro y boleta física
        Note over App,IDB: La venta queda resguardada localmente
    else Recuperación de Conexión (Datos móviles activos)
        App->>App: Network Status Listener detecta conexión activa
        App->>IDB: Lee registros en "sales_outbox" con status "pending_sync"
        App->>API: POST /api/v1/sales/sync (Lote de ventas con UUIDs)
        API->>DB: Inicia Transacción ACID
        API->>DB: INSERT INTO sales / sale_items (ON CONFLICT DO NOTHING por UUID)
        API->>DB: Actualiza branch_stock en servidor central
        API->>DB: Commit Transacción
        API-->>App: HTTP 200 OK (Array de UUIDs sincronizados con éxito)
        App->>IDB: Actualiza status a "synced" en IndexedDB local
    end
```

---

## 5. Matriz de Parámetros de Red y Configuración

| Parámetro | Valor Producción (VPS) | Valor Desarrollo Local | Propósito |
|---|---|---|---|
| `PORT` | `3000` (interno) / `443` (externo) | `3000` | Puerto de escucha HTTP de Express |
| `DATABASE_URL` | `postgresql://qsy:pass@postgres:5432/qsy_db` | `file:./local.db` | Cadena de conexión conmutable |
| `JWT_SECRET` | Clave criptográfica 256 bits | `local_dev_secret_key_123!` | Firma digital de tokens JWT |
| `JWT_EXPIRES_IN` | `8h` (jornada laboral) | `24h` | Ventana de validez de la sesión |
| `CORS_ORIGIN` | `https://admin.editorialqsy.com, capacitor://localhost` | `*` o `http://localhost:5173` | Orígenes web y móviles autorizados |
