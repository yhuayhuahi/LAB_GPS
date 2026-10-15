# ADR-01: Selección del Stack Tecnológico Base, Estrategia de Persistencia Dual y Arquitectura de Ejecución

* **Estado:** Aceptado
* **Fecha:** 2026-10-14
* **Autor:** Yourdyy (Scrum Master / Arquitecto de Software)
* **Proyecto:** Sistema de Gestión Comercial y Control de Inventarios — Editorial QSY
* **Componente:** Arquitectura Base / Scaffolding

---

## 1. Contexto y Planteamiento del Problema

La editorial **QSY** (Arequipa) es una MYPE especializada en la producción y distribución de textos educativos y especializados en lengua quechua (~10 títulos activos). Sus operaciones comerciales se canalizan exclusivamente a través de tres librerías/distribuidoras aliadas físicas (Trilce, Siglo XX y Jerusalén) ubicadas en puntos céntricos de Arequipa (confirmado en Pregunta 98 de la entrevista).

Durante el levantamiento de requisitos e inspección técnica de campo se identificaron las siguientes restricciones críticas del entorno:
1. **Infraestructura de telecomunicaciones precaria:** Dos de las tres distribuidoras carecen de conexión a internet fija cableada; los vendedores operan con planes de datos móviles propios en zonas con blindaje estructural y señal intermitente.
2. **Restricción de costos e infraestructura:** El cliente no dispone de presupuesto para servicios cloud elásticos de tarificación variable. Sin embargo, cuenta con un servidor VPS contratado  actualmente subutilizado.
3. **Necesidad de agilidad y robustez técnica:** El equipo de desarrollo está conformado por 4 ingenieros que deben coordinar actividades con tipado estático estricto, facilitando la integración continua y minimizando errores en tiempo de ejecución.
4. **Experiencia de usuario móvil sin sobrecostos:** Los vendedores atienden exclusivamente con sus teléfonos móviles personales en mostradores pequeños, exigiendo tiempos de registro de venta inferiores a 2 minutos sin incurrir en los altos costos de desarrollar y publicar aplicaciones móviles nativas para Android (Play Store) e iOS (App Store).

---

## 2. Decisión Tomada

Se decide adoptar una arquitectura basada en **Servicios REST desacoplados y Aplicación Web Responsiva (Mobile-First SPA)**, con contenedorización en Docker y una estrategia de persistencia relacional dual. Las especificaciones técnicas se detallan a continuación:

### 2.1. Entorno de ejecución y contenedorización
* **Runtime:** **Node.js v26.x** sobre imágenes oficiales ligeras basadas en **Linux Alpine** (`node:26-alpine`).
* **Orquestación Local y Producción:** **Docker** y **Docker Compose**. Esto garantiza paridad estricta entre los entornos de desarrollo de los 4 integrantes del equipo y el entorno de despliegue en el VPS, eliminando el problema de *"en mi máquina sí funciona"*.

### 2.2. Backend y Servicios de API
* **Framework Web:** **Express.js** estructurado con **TypeScript (TS)** bajo configuración estricta (`strict: true`, target `ES2022`).
* **Patrón de Arquitectura:** Arquitectura modular por capas limpias (*Clean Layered Architecture*):
  * `controllers/`: Manejo de peticiones HTTP, extracción de parámetros y orquestación de respuestas.
  * `services/`: Encapsulamiento de la lógica de negocio y reglas transaccionales.
  * `middlewares/`: Autenticación JWT, verificación de roles RBAC, validación de esquemas y manejo centralizado de excepciones.
  * `config/`: Variables de entorno tipadas y configuración de conexiones a bases de datos.
* **Validación de Datos:** **Zod** para validación tipada y segura en tiempo de ejecución de todas las cargas útiles entrantes (*payloads*).

### 2.3. Persistencia Relacional Dual (PostgreSQL y SQLite)
Para conciliar la velocidad de desarrollo local con la robustez requerida en producción, se adopta una estrategia dual:
* **Entorno de Producción y Staging (VPS / Docker):** **PostgreSQL 16**. Proporciona transaccionalidad ACID total, control de concurrencia multiversión (MVCC), integridad referencial robusta y respaldo de auditoría comercial.
* **Entorno de Desarrollo Local y Testing Ágil:** **SQLite 3**. Permite a los desarrolladores y al área de QA ejecutar la suite completa de pruebas unitarias y de integración de forma instantánea sin requerir un demonio de base de datos pesado en memoria.
* **Abstracción:** Se implementa un esquema SQL ANSI unificado con compatibilidad garantizada en tipos de datos primarios (enteros, textos, timestamps numéricos e índices relacionales) conmutable vía variable de entorno `DATABASE_URL`.

### 2.4. Frontend Unificado y Estrategia de Distribución Dual (Web SPA + APK Capacitor)
* **Base Tecnológica Única:** **React** inicializado con **Vite** y **TypeScript**, estilizado mediante **CSS vanilla** bajo enfoque rigurosamente **Mobile-First**. Todo el código cliente se escribe en un único repositorio frontend compartido.
* **Distribución Dual según Perfil y Dispositivo:**
  1. **Administración General y Logística (PC / Laptop):** Se accede vía **Web SPA** tradicional desde cualquier navegador estándar (Chrome, Firefox, Edge).
  2. **Distribuidores en Mostrador (Móviles Android):** La carpeta compilada (`dist/`) se empaqueta mediante **Capacitor** (`@capacitor/android`) para generar un instalable nativo **Android APK**.
     * **Blindaje contra Errores de Usuario:** Al ejecutarse como aplicación instalada, se eliminan la barra de navegación del navegador, los deslizamientos accidentales de recarga (*pull-to-refresh*) y el cierre involuntario de pestañas en momentos de desconexión.
     * **Distribución Directa (*Sideloading*):** Se entrega el archivo `.apk` directamente a los vendedores (vía WhatsApp, USB o descarga directa desde el panel web), prescindiendo al 100% de la tarifa de registro de Google Play Developer ($25 USD) y de las demoras de aprobación de tiendas de aplicaciones.
* **Persistencia Local para Tolerancia a Desconexión (`IndexedDB`):**
  * Tanto los navegadores web modernos como el WebView interno de Capacitor implementan el estándar **`IndexedDB`** de forma nativa. Se utiliza mediante la librería ergonómica `idb`.
  * Se descarta `localStorage` (por su límite estricto de 5 MB y su comportamiento síncrono bloqueante del hilo de renderizado).
* **Patrón Outbox / Cola de Sincronización:**
  * Al registrar una venta sin red, la transacción se almacena en `IndexedDB` con estado `pending_sync`.
  * La aplicación emite inmediatamente el ticket de venta interno en PDF para el alumno.
  * Un monitor de red (*Network Status Listener*) detecta el restablecimiento de los datos móviles o Wi-Fi y despacha las ventas encoladas en lotes atómicos hacia el endpoint `POST /api/sales/sync`.

### 2.5. Seguridad y Aislamiento por Sede (RBAC)
* **Autenticación:** Tokens **JSON Web Tokens (JWT)** firmados criptográficamente mediante algoritmo HMAC-SHA256, con tiempo de expiración acotado (8 horas, equivalente a una jornada laboral).
* **Control de Acceso Basado en Roles (RBAC):** Tres roles claramente tipados:
  * `ADMIN`: Acceso irrestricto global a todas las distribuidoras, costos, comisiones y configuración del sistema.
  * `LOGISTICS`: Acceso a gestión de almacén central, inventario general, lotes de imprenta y autorización de despachos.
  * `DISTRIBUTOR`: Acceso restringido exclusivamente a las operaciones de venta, consulta de stock local y liquidación de su propia sede.
* **Aislamiento Multi-Sucursal en Base de Datos:** Todo usuario con rol `DISTRIBUTOR` tiene asignado obligatoriamente un `branch_id`. Los middlewares de backend inyectan dicho identificador de forma forzosa en cada consulta SQL (`WHERE branch_id = $token.branch_id`), impidiendo cualquier fuga de datos entre locales comerciales.

---

## 3. Consecuencias

### 3.1. Consecuencias Positivas
* **Cero Costo de Licenciamiento, Cloud o App Stores:** Se aprovecha íntegramente el VPS contratado por QSY y se distribuye el APK sin pasar por Google Play.
* **Experiencia de Usuario Inmune a Cortes de Red:** El APK de Capacitor arranca desde el almacenamiento local del teléfono; los vendedores nunca verán una pantalla en blanco ni el dinosaurio de "Sin conexión".
* **Alta Eficiencia en Recursos:** El backend en Node.js 26 y Express consume menos de 120 MB de memoria RAM en reposo, permitiendo coexistir con PostgreSQL dentro de los 8 GB del VPS sin degradación.
* **Unificación de Código y Lenguaje:** Todo el equipo programa en TypeScript de extremo a extremo. El mismo código de React alimenta la versión web y la app móvil.

### 3.2. Consecuencias Negativas y Mitigaciones
* **Disparidad potencial entre SQLite y PostgreSQL:**
  * *Mitigación:* Se escriben scripts DDL estándar en ANSI SQL y se configuran pruebas de integración que corren sobre contenedores PostgreSQL en la canalización de Git.
* **Riesgo de colisión en sincronización diferida offline:**
  * *Mitigación:* Se generan identificadores únicos basados en UUID v4 en el cliente para cada venta, garantizando idempotencia en el servidor ante reintentos de envío.
* **Actualización manual de APKs distribuidos fuera de Play Store:**
  * *Mitigación:* Al ser un proyecto pequeño el mismo cliente debe distribuir la app entre todos sus empleados

