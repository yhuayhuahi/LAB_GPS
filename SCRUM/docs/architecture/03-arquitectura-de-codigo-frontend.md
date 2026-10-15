# Especificación de Arquitectura de Código: Frontend (React + Vite + Capacitor)

* **Módulo:** Arquitectura de Software / Frontend
* **Fecha:** 2026-10-14
* **Autor:** Yourdyy (Scrum Master / Arquitecto de Software)
* **Stack:** React, Vite, TypeScript, Tailwind CSS, Capacitor (Android APK), IndexedDB (`idb`), jsPDF
* **Tareas Relacionadas:** [`TASK-01-01`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/sprint-backlog/tasks/TASK-01-01.md), [`TASK-01-05`](file:///home/tooboe/Documentos/AcademicProjects/Lab_GPS/SCRUM/sprint-backlog/tasks/TASK-01-05.md)

---

## 1. Patrón Arquitectónico del Frontend

El frontend se diseña bajo un patrón de **Componentes Modulares Desacoplados y Manejo de Estado por Contextos**, con un enfoque estrictamente **Mobile-First** para los distribuidores en mostrador y responsivo para el panel administrativo de escritorio:

```mermaid
flowchart TD
    subgraph UI_LAYER ["1. Capa de Vistas y Componentes Visuales"]
        VentasView["Punto de Venta / POS (Móvil)"]
        ArqueoView["Cierre Diario / Liquidación (Móvil)"]
        AdminView["Panel Administrativo: Sedes & Libros (PC)"]
        SharedUI["Componentes Reutilizables (Modal, Button, Input, OfflineBanner)"]
    end

    subgraph STATE_LAYER ["2. Capa de Estado y Contextos Globales"]
        AuthCtx["AuthContext: Sesión, JWT, Rol y Sede"]
        NetworkCtx["NetworkContext: Estado de Conexión (Online/Offline)"]
        CartCtx["CartContext: Carrito de Venta y Autocálculo de Comisiones"]
    end

    subgraph PERSISTENCE_LAYER ["3. Capa de Persistencia Local (IndexedDB)"]
        IDBAdapter["idb Adapter: Conexión asíncrona a IndexedDB"]
        OutboxStore["ObjectStore: sales_outbox (Ventas pendientes de subir)"]
        CatalogStore["ObjectStore: cached_products (Catálogo y comisiones offline)"]
        StockStore["ObjectStore: cached_stock (Existencias locales)"]
        
        IDBAdapter --> OutboxStore
        IDBAdapter --> CatalogStore
        IDBAdapter --> StockStore
    end

    subgraph SYNC_LAYER ["4. Capa de Servicios y Sincronización"]
        SyncWorker["SyncWorker: Monitor de reconexión y despacho por lotes"]
        APIClient["API Client (Axios / Fetch con interceptor JWT)"]
        PDFGen["PDFGenerator (jsPDF): Ticket interno de venta en mostrador"]
    end

    VentasView --> CartCtx
    VentasView --> PDFGen
    UI_LAYER --> AuthCtx
    UI_LAYER --> NetworkCtx
    
    CartCtx --> IDBAdapter
    NetworkCtx --> SyncWorker
    SyncWorker --> OutboxStore
    SyncWorker --> APIClient
```

---

## 2. Estructura de Directorios del Frontend (`frontend/`)

```
frontend/
├── capacitor.config.ts         # Configuración del paquete móvil (App ID: com.editorialqsy.ventas)
├── android/                    # Proyecto nativo generado por Capacitor (para compilar el APK)
├── index.html                  # Punto de montaje con viewport para móviles (user-scalable=no)
├── package.json                # Dependencias (React, Tailwind, Capacitor, idb, jsPDF)
├── tsconfig.json               # Configuración estricta de TypeScript
├── vite.config.ts              # Bundler ultrarrápido con salida a 'dist/'
└── src/
    ├── main.tsx                # Entrada de la aplicación y renderizado en DOM
    ├── App.tsx                 # Enrutador principal (React Router) y proveedores de contexto
    │
    ├── assets/                 # Logotipo institucional QSY e iconos SVG optimizados
    │
    ├── components/             # Componentes visuales atómicos reutilizables
    │   ├── common/
    │   │   ├── Button.tsx      # Botón táctil grande optimizado para dedos (mín. 48px de alto)
    │   │   ├── Input.tsx       # Campo de texto con validación y teclado numérico para DNI
    │   │   ├── Modal.tsx       # Ventana modal accesible para confirmación de ventas
    │   │   ├── Badge.tsx       # Etiquetas de estado (Pendiente, Sincronizado, Anulado)
    │   │   └── OfflineBanner.tsx # Indicador visual fijo: "Modo Offline (Sin señal)"
    │   └── layout/
    │       ├── MobileLayout.tsx# Layout sin scroll horizontal para celulares (360px-420px)
    │       └── DesktopLayout.tsx # Layout con barra lateral para administradores en PC
    │
    ├── views/                  # Vistas o Pantallas de la aplicación
    │   ├── auth/
    │   │   └── LoginView.tsx   # Inicio de sesión táctil con selección de sede
    │   ├── pos/
    │   │   ├── PosSalesView.tsx # Terminal de venta rápida (< 2 min) con selector de libros
    │   │   └── TicketModal.tsx # Previsualización y descarga del ticket en PDF
    │   ├── settlements/
    │   │   └── DailySettlementView.tsx # Cuadre de caja diario y balance en efectivo
    │   ├── admin/
    │   │   ├── BranchesView.tsx   # Gestión de distribuidoras aliadas (HU-02)
    │   │   ├── ProductsView.tsx   # Catálogo y fijación de comisiones fijas (HU-03)
    │   │   └── UsersView.tsx      # Asignación de colaboradores y roles (HU-01)
    │   └── logistics/
    │       └── ConsignmentsView.tsx # Despachos de imprenta y remisiones
    │
    ├── context/                # Estado reactivo global
    │   ├── AuthContext.tsx     # Almacena token JWT, datos del usuario y rol activo
    │   ├── NetworkContext.tsx  # Escucha eventos 'online' y 'offline' de la API de red
    │   └── CartContext.tsx     # Carrito de venta, cálculo automático de total y comisiones
    │
    ├── offline/                # Motor de persistencia local y sincronización
    │   ├── db.ts               # Conexión a IndexedDB (esquemas de tiendas de objetos)
    │   ├── outboxQueue.ts      # Encolado de ventas offline con UUID idempotente
    │   ├── syncWorker.ts       # Despacho en segundo plano al recuperar señal
    │   └── ticketPdf.ts        # Renderizado cliente del comprobante interno en PDF
    │
    ├── services/               # Comunicación HTTP con el backend de Node 26
    │   ├── apiClient.ts        # Instancia centralizada con interceptor de cabecera Bearer
    │   ├── authService.ts      # Login y renovación de sesión
    │   ├── salesService.ts     # Envío de ventas individuales y lotes de sincronización
    │   └── catalogService.ts   # Descarga del catálogo para cachear en IndexedDB
    │
    ├── hooks/                  # Custom hooks para desacoplar lógica de la vista
    │   ├── useNetwork.ts       # Hook de estado de conectividad en tiempo real
    │   ├── useOfflineSales.ts  # Hook para registrar ventas directamente en IndexedDB
    │   └── useCart.ts          # Hook de manipulación del carrito
    │
    └── types/                  # Modelos de datos del cliente
        ├── domain.ts           # Product, Sale, Branch, User, Settlement
        └── offline.ts          # OutboxSale, SyncStatus, OfflinePayload
```

---

## 3. Esquema de Persistencia Local en `IndexedDB`

La base de datos local del dispositivo móvil se denomina `qsy_pos_db` (versión 1) y contiene tres tiendas de objetos (*object stores*):

```mermaid
erDiagram
    SALES_OUTBOX {
        string clientSaleUuid PK "UUID v4 generado en el móvil"
        string branchId "Identificador de la distribuidora"
        string sellerUserId "Identificador del vendedor"
        string customerDni "DNI del estudiante comprador"
        string customerName "Nombre del estudiante"
        numeric totalAmount "Importe total en S/"
        numeric totalCommission "Comisión fija devengada en S/"
        string syncStatus "pending_sync | synced | error"
        timestamp createdAt "Hora de registro en el dispositivo"
        json items "Array de {productId, title, quantity, price, commission}"
    }

    CACHED_PRODUCTS {
        string id PK "Identificador del libro"
        string code "Código del producto (ej. QSY-BAS-01)"
        string title "Título del libro"
        numeric publicPrice "Precio fijo de mostrador"
        numeric fixedCommission "Comisión fija por ejemplar"
    }

    CACHED_STOCK {
        string productId PK "Identificador del libro"
        integer availableQuantity "Existencias físicas remanentes"
        timestamp updatedAt "Última sincronización con servidor"
    }
```

---

## 4. Flujo de Empaquetado a Android APK con Capacitor

El flujo para compilar el archivo instalable `.apk` a partir de la web de React se ejecuta mediante scripts automatizados en `package.json`:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Desarrollador / CI
    participant Vite as Vite Bundler
    participant Dist as Carpeta dist/
    participant Cap as Capacitor CLI
    participant Gradle as Gradle (Android SDK)
    participant APK as Archivo app-debug.apk

    Dev->>Vite: npm run build
    Vite->>Dist: Minifica y compila HTML, JS (~250 KB) y CSS
    Dev->>Cap: npx cap sync android
    Cap->>Dist: Copia archivos de dist/ a android/app/src/main/assets/public/
    Cap->>Gradle: Actualiza plugins y configuraciones nativas
    Dev->>Gradle: cd android && ./gradlew assembleDebug
    Gradle->>APK: Genera binario instalable (.apk)
    Note over Dev,APK: El APK se envía directamente a los vendedores.<br/>Cero costos de Play Store y funciona 100% offline.
```

---

## 5. Scripts de Compilación y Ejecución en `package.json`

```json
{
  "name": "qsy-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "cap:sync": "npm run build && npx cap sync android",
    "cap:open": "npx cap open android",
    "cap:build-apk": "npm run build && npx cap sync android && cd android && ./gradlew assembleDebug"
  }
}
```
Con el comando `npm run cap:build-apk`, en un solo paso se compila la versión web de producción, se sincroniza con el proyecto Android y se emite el archivo `app-debug.apk` listo para su distribución en mostrador.
