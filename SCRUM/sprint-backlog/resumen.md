---
tipo: sprint-summary
sprint: Sprint 1
duracion: 2 semanas
story_points: 18
estado: in-progress
periodo: Semanas 06 - 07
tags:
  - sprint-summary
  - sprint-1
---

# Resumen del Sprint 1: Arquitectura Base, Roles y Gestión de Sucursales / Catálogo

## 1. Objetivo del Sprint (Sprint Goal)
Establecer los cimientos arquitectónicos, el modelo de datos relacional y el sistema de seguridad basado en roles (RBAC) para la editorial **QSY**, permitiendo al Administrador registrar los puntos de venta distribuidores y configurar el catálogo oficial de publicaciones con sus precios y comisiones fijas inmutables.

---

## 2. Parámetros de Planificación
* **Duración:** 2 semanas (Semanas 06 y 07 del calendario de desarrollo).
* **Capacidad del Equipo:** 115 horas-hombre / semana = **230 horas-hombre totales** (1 Analista/Scrum Master, 2 Desarrolladores Full-Stack, 1 QA Tester).
* **Carga de Trabajo Comprometida:** **18 Story Points (SP)**.
* **Entregable / Hito 1:** Plataforma base con base de datos relacional configurada en entorno local, autenticación operativa con RBAC, gestión de sedes aliadas y catálogo de productos.

---

## 3. Historias de Usuario Asignadas al Sprint 1

| ID | Título | Módulo | Rol | Story Points | Prioridad MoSCoW | Estado |
|---|---|---|---|---|---|---|
| `[[HU-01]]` | Autenticación y control de acceso basado en roles (RBAC) | M1 - Administración y Seguridad | Administrador | **8 SP** | Must Have | `in-progress` |
| `[[HU-02]]` | Gestión del padrón de locales distribuidores | M1 - Administración y Seguridad | Administrador | **5 SP** | Must Have | `in-progress` |
| `[[HU-03]]` | Catálogo de libros, precios y comisiones fijas | M1 - Administración y Seguridad | Administrador | **5 SP** | Must Have | `in-progress` |
| **TOTAL** | **3 Historias de Usuario Comprometidas** | — | — | **18 SP** | — | — |

---

## 4. Breve Descripción y Justificación de cada Historia en este Sprint

### 🔹 [[HU-01]]: Autenticación y control de acceso basado en roles (RBAC) — 8 SP
* **¿Qué hace?:** Permite el inicio de sesión seguro y restringe el acceso según el rol (Administrador, Encargado de Logística, Distribuidor/Vendedor).
* **¿Por qué en este Sprint?:** Es la **historia habilitadora técnica (*Enabler*)** fundamental. Absorbe la inicialización del entorno de desarrollo local, la configuración del framework, el diseño del esquema DDL inicial de la base de datos relacional y la seguridad JWT. Resuelve la regla de negocio innegociable de la entrevista: **aislamiento estricto de datos**, garantizando que ningún distribuidor pueda acceder a información de otros locales o ver paneles gerenciales.

### 🔹 [[HU-02]]: Gestión del padrón de locales distribuidores — 5 SP
* **¿Qué hace?:** Permite al Administrador dar de alta, modificar y gestionar los locales comerciales aliados (las 3 sedes céntricas de Arequipa), asociando dirección, correo, teléfono y encargados responsables.
* **¿Por qué en este Sprint?:** Las sedes son la entidad organizativa primaria de QSY; es indispensable tener el padrón de distribuidoras persistido para luego poder asignarles usuarios vendedores, despachos en consignación y stock en los siguientes sprints.

### 🔹 [[HU-03]]: Catálogo de libros, precios y comisiones fijas — 5 SP
* **¿Qué hace?:** Administra el catálogo de publicaciones educativas y especializadas (quechua básico, intermedio, avanzado, quechua médico y diccionarios), definiendo su precio de venta al público y la comisión fija monetaria por unidad vendida.
* **¿Por qué en este Sprint?:** Cumple la regla de negocio pactada con la gerencia: los precios y comisiones son inmutables por parte de los vendedores. Sin catálogo de productos activos, los sprints futuros no podrían registrar despachos de inventario ni ventas presenciales.

---

## 5. Próximo Paso Operativo
Descomponer estas 3 historias en sus correspondientes **tareas técnicas de ingeniería** (ADRs de arquitectura, scripts DDL/migraciones de base de datos relacional, endpoints de API REST, vistas web/móviles y casos de prueba QA) para ser ubicadas en la carpeta `sprint-backlog/tasks/`.
