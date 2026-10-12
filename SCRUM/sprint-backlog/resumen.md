---
tipo: sprint-summary
sprint: Sprint 1
duracion: 2 semanas
story_points: 20
estado: in-progress
periodo: Semanas 06 - 07
tags:
  - sprint-summary
  - sprint-1
---

# Resumen del Sprint 1: Arquitectura Base, Roles y Gestión de Sucursales / Catálogo

## 1. Objetivo del Sprint (Sprint Goal)
Establecer los cimientos arquitectónicos, el modelo de datos relacional y el sistema de seguridad basado en roles (RBAC) para la editorial **QSY**, permitiendo al Administrador registrar los puntos de venta distribuidores, configurar el catálogo oficial de publicaciones con sus precios y comisiones fijas inmutables, y habilitar el mecanismo de confirmación digital de recepción de libros en consignación.

---

## 2. Parámetros de Planificación
* **Duración:** 2 semanas (Semanas 06 y 07 del calendario de desarrollo).
* **Capacidad del Equipo:** 115 horas-hombre / semana = **230 horas-hombre totales** (1 Analista/Scrum Master, 2 Desarrolladores Full-Stack, 1 QA Tester).
* **Carga de Trabajo Comprometida:** **20 Story Points (SP)** (perfectamente calibrado frente a la velocidad de crucero de 22 SP/sprint).
* **Entregable / Hito 1:** Plataforma base con base de datos relacional configurada en entorno local, autenticación operativa con RBAC, gestión de sedes aliadas y catálogo de productos.

---

## 3. Historias de Usuario Asignadas al Sprint 1

| ID | Título | Módulo | Rol | Story Points | Prioridad MoSCoW | Estado |
|---|---|---|---|---|---|---|
| `[[HU-01]]` | Autenticación y control de acceso basado en roles (RBAC) | M8 - Administración | Administrador | **8 SP** | Must Have | `sprint-backlog` |
| `[[HU-02]]` | Registro y administración de distribuidores | M8 - Administración | Administrador | **5 SP** | Must Have | `sprint-backlog` |
| `[[HU-03]]` | Catálogo de libros y gestión de precios | M8 - Administración | Administrador | **5 SP** | Must Have | `sprint-backlog` |
| `[[HU-05]]` | Confirmación de recepción de libros por distribuidora | M1 - Distribución | Distribuidor / Logística | **2 SP** | Must Have | `sprint-backlog` |
| **TOTAL** | **4 Historias de Usuario Comprometidas** | — | — | **20 SP** | — | — |

---

## 4. Breve Descripción y Justificación de cada Historia en este Sprint

### 🔹 [[HU-01]]: Autenticación y control de acceso basado en roles (RBAC) — 8 SP
* **¿Qué hace?:** Permite el inicio de sesión seguro y restringe el acceso a las funciones según el rol del usuario (Administrador, Encargado de Logística, Distribuidor/Vendedor y Sucursal Virtual/Soporte).
* **¿Por qué en este Sprint?:** Es la **historia habilitadora técnica (*Enabler*)** fundamental. Sobre ella recae la inicialización del entorno de desarrollo local, la configuración del framework, el diseño del esquema DDL inicial de la base de datos relacional y la seguridad JWT. Resuelve la regla de negocio innegociable de la entrevista: **aislamiento estricto de datos**, garantizando que ningún distribuidor pueda acceder a información de otros locales o ver paneles gerenciales.

### 🔹 [[HU-02]]: Registro y administración de distribuidores — 5 SP
* **¿Qué hace?:** Permite al Administrador dar de alta, modificar y gestionar los locales comerciales aliados (actualmente las 3 sedes céntricas de Arequipa), asociando dirección, correo, teléfono y encargados responsables.
* **¿Por qué en este Sprint?:** Las sedes son la entidad organizativa primaria de QSY; es indispensable tener el padrón de distribuidoras persistido para luego poder asignarles usuarios vendedores, despachos en consignación y stock en los siguientes sprints.

### 🔹 [[HU-03]]: Catálogo de libros y gestión de precios — 5 SP
* **¿Qué hace?:** Administra el catálogo de publicaciones educativas y especializadas (quechua básico, intermedio, avanzado, quechua médico y diccionarios), definiendo su precio de venta al público y la comisión fija monetaria por unidad vendida.
* **¿Por qué en este Sprint?:** Cumple la regla de negocio pactada con la gerencia: los precios y comisiones son inmutables por parte de los vendedores. Sin catálogo de productos activos, los sprints futuros no podrían registrar despachos de inventario ni ventas presenciales.

### 🔹 [[HU-05]]: Confirmación de recepción de libros por la distribuidora — 2 SP
* **¿Qué hace?:** Provee la interfaz para que el vendedor, al recibir físicamente un lote de libros en su local, registre su confirmación conforme en el sistema o reporte discrepancias de cantidades.
* **¿Por qué en este Sprint?:** Sustituye las constancias manuales en cuadernos duplicados. Permite cerrar el circuito administrativo inicial de traspaso de custodia de mercadería entre Logística y el punto de venta.

---

## 5. Próximo Paso Operativo
Descomponer estas 4 historias en sus correspondientes **tareas técnicas de ingeniería** (ADRs de arquitectura, scripts DDL/migraciones de base de datos, endpoints de API REST, vistas web/móviles y casos de prueba QA) para ser ubicadas en la carpeta `sprint-backlog/tasks/`.
