// ==============================================================================
// CONTENIDO DE LA PRESENTACIÓN (TYPST) - LABORATORIO 04
// Proyecto: Sistema de Gestión Comercial y Existencias · Editorial QSY
// Duración estimada de exposición: 5 Minutos (8 Diapositivas)
// ==============================================================================

#import "palette.typ": *
#import "theme.typ": *

// ------------------------------------------------------------------------------
// 1. PORTADA
// ------------------------------------------------------------------------------
#title-slide(
  tags: ("SCRUM", "PRODUCT-BACKLOG", "SPRINT-1", "EPIS-UNSA")
)

// ------------------------------------------------------------------------------
// 2. CONTEXTO Y PROBLEMÁTICA DEL NEGOCIO (EDITORIAL QSY)
// ------------------------------------------------------------------------------
#slide(
  title: "Contexto del Negocio y Problemática",
  subtitle: "Operación comercial y deficiencias en el Centro Histórico de Arequipa",
  section: "00. CONTEXTO",
)[
  #columns-2(
    [
      *El Negocio de Editorial QSY:*
      - Producción y comercialización de libros en lengua quechua (10 publicaciones base).
      - *Venta en consignación* en 3 sedes aliadas céntricas: Trilce, Siglo XX y Jerusalén.
      - Tarifas fijas oficiales y comisiones en soles por unidad vendida (*RN-03*).

      #v(6pt)
      #info-box(title: "Falla de Infraestructura")[
        2 de los 3 locales carecen de internet fijo por cable; dependen de planes móviles con señal inestable en sótanos y casonas.
      ]
    ],
    [
      #alert-box(title: "Puntos de Dolor Críticos")[
        - Ventas registradas a mano en cuadernos y boletas físicas de talonario.
        - Arqueo de caja diario manual demoraba *más de 1 hora*.
        - Riesgo latente de fuga de datos comerciales entre distribuidores rivales (*RN-05*).
      ]

      #v(6pt)
      #tip-box(title: "Solución de Ingeniería")[
        SPA Web Mobile-First (< 2 min por venta) con soporte offline en *IndexedDB* y base de datos relacional RBAC aislada.
      ]
    ],
    ratio: (1.05fr, 0.95fr),
    gutter: 14pt,
  )
]

// ------------------------------------------------------------------------------
// 3. PARTE 1: PRODUCT BACKLOG Y CRITERIOS BDD
// ------------------------------------------------------------------------------
#slide(
  title: "Parte 1: Product Backlog Integral",
  subtitle: "18 Historias de Usuario / 93 SP / 5 Módulos del Ciclo de Valor",
  section: "01. PRODUCT BACKLOG",
)[
  #columns-2(
    [
      *Estructura Modular (Priorización MoSCoW):*
      - *M1: Sedes y Roles (HU-01 a 06):* RBAC, sedes físicas, catálogo fijo y despachos de stock central.
      - *M2: Ventas en Mostrador (HU-07 a 11):* Venta táctil rápida, offline `IndexedDB` y ticket PDF.
      - *M3: Reabastecimiento (HU-12 a 14):* Solicitud digital y entradas de lotes desde imprenta.
      - *M4: Liquidación y Caja (HU-15 a 17):* Cuadre diario automático y pago de comisiones fijas.
      - *M5: Trazabilidad y Gerencia (HU-18 a 19):* Búsqueda por DNI para garantías y paneles KPI.
    ],
    [
      #card(title: "Estándar Ágil Connextra", icon: "󰈙", accent: latte.mauve)[
        *Como* [rol] *quiero* [acción] *para* [beneficio].
        #v(2pt)
        Enfoca cada requerimiento en el valor real para el negocio, evitando sesgos de diseño técnico prematuro.
      ]

      #v(8pt)
      #card(title: "Criterios de Aceptación BDD (Gherkin)", icon: "󰄳", accent: latte.teal)[
        *Dado que... Cuando... Entonces...*
        #v(2pt)
        Especificación ejecutable en lenguaje natural que enlaza requerimientos de negocio con pruebas de QA.
      ]
    ],
    ratio: (1.1fr, 0.9fr),
    gutter: 14pt,
  )
]

// ------------------------------------------------------------------------------
// 4. PARTE 2: SPRINT 1 - ALCANCE, CAPACIDAD Y SPRINT GOAL
// ------------------------------------------------------------------------------
#slide(
  title: "Parte 2: Planificación del Sprint 1",
  subtitle: "Capacidad del equipo, compromiso cuantitativo y Sprint Goal",
  section: "02. SPRINT BACKLOG",
)[
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 10pt,
    stat-card(value: "2 Semanas", label: "Duración Fija", icon: "󰅐", color: latte.mauve, description: "10 días laborables"),
    stat-card(value: "96 h-h", label: "Capacidad Neta", icon: "󰒋", color: latte.blue, description: "4 ing. x 15h x factor foco 0.8"),
    stat-card(value: "18 SP", label: "Carga Asignada", icon: "󰓅", color: latte.green, description: "54 h de desarrollo (44% holgura)"),
  )

  #v(8pt)
  #columns-2(
    [
      #info-box(title: "Sprint Goal (Compromiso Oficial)")[
        ``Establecer los cimientos arquitectónicos, el modelo relacional y la seguridad RBAC, permitiendo registrar las distribuidoras aliadas y el catálogo oficial con tarifas fijas inmutables''.
      ]
    ],
    [
      *Historias Comprometidas en el Sprint 1:*
      - *HU-01 (8 SP):* Autenticación JWT y aislamiento por sede (*RN-05*).
      - *HU-02 (5 SP):* Padrón de distribuidoras y asignación de personal.
      - *HU-03 (5 SP):* Catálogo de libros y comisiones fijas inmutables (*RN-03*).
    ],
    ratio: (1.1fr, 0.9fr),
    gutter: 12pt,
  )
]

// ------------------------------------------------------------------------------
// 5. PARTE 2: DESCOMPOSICIÓN TÉCNICA Y DEPENDENCIAS
// ------------------------------------------------------------------------------
#slide(
  title: "Parte 2: Descomposición en 14 Tareas",
  subtitle: "Especialización por disciplina y red de dependencias técnicas",
  section: "02. SPRINT BACKLOG",
)[
  #grid(
    columns: (1fr, 1fr),
    gutter: 10pt,
    [
      #card(title: "Yourdyy · Arquitectura & Base de Datos (14 h)", icon: "󰈙", accent: latte.mauve)[
        - *TASK-01-01 / 01-02:* ADR-01, Scaffolding backend/frontend y DDL de roles y usuarios.
        - *TASK-02-01 / 03-01:* DDL tablas `branches` y `products` (check `comisión < precio`).
        #text(size: 8.5pt, fill: latte.green, weight: "bold")[#badge("FUNDACIONAL BLOQUEANTE", color: latte.green)]
      ]
      #v(8pt)
      #card(title: "Leonardo · Backend & Seguridad (18 h)", icon: "󰒋", accent: latte.blue)[
        - *TASK-01-03 / 01-04:* API Auth JWT, bcrypt y middleware `enforceBranchScope`.
        - *TASK-02-02 / 03-02:* Endpoints CRUD sedes, asignación de personal y catálogo.
      ]
    ],
    [
      #card(title: "Miguel · Frontend Mobile-First (15 h)", icon: "󰙨", accent: latte.peach)[
        - *TASK-01-05:* Interfaz táctil de Login y persistencia de sesión JWT.
        - *TASK-02-03 / 03-03:* UI de sedes, asignación y catálogo con margen en tiempo real.
      ]
      #v(8pt)
      #card(title: "Dolly · QA & Pruebas Automatizadas (7 h)", icon: "󰄳", accent: latte.teal)[
        - *TASK-01-06 / 02-04 / 03-04:* Matrices BDD Gherkin y suites de integración.
        - Validación formal de aislamiento multi-sede y límites de tarifas.
      ]
    ]
  )
]

// ------------------------------------------------------------------------------
// 6. PARTE 3: PLANIFICACIÓN ÁGIL, ESTIMACIÓN Y KANBAN
// ------------------------------------------------------------------------------
#slide(
  title: "Parte 3: Planificación Ágil y Kanban",
  subtitle: "Estimación en dos niveles, límites WIP y políticas de calidad",
  section: "03. PLANIFICACIÓN",
)[
  #columns-2(
    [
      *Estimación en Dos Niveles:*
      - *Nivel Estratégico:* Historias en *Story Points* mediante Planning Poker y Fibonacci ($1, 2, 3, 5, 8, 13$), evaluando Complejidad + Incertidumbre + Volumen.
      - *Nivel Operativo:* Tareas en *Horas-Hombre* directas (2 a 6 h) para control diario.

      #v(6pt)
      #tip-box(title: "Límites WIP en Tablero Kanban")[
        - *In Progress <= 3 tareas:* Evita la multitarea ineficiente (*``Dejar de empezar, comenzar a terminar''*).
        - *In Review <= 2 tareas:* Previene cuellos de botella en QA.
      ]
    ],
    [
      #card(title: "Definition of Ready (DoR - Preparado)", icon: "󰌠", accent: latte.sapphire)[
        1. Formato Connextra estandarizado.
        2. Criterios de aceptación BDD en Gherkin.
        3. Dependencias de arquitectura resueltas.
        4. Estimación consensuada en Story Points.
      ]

      #v(8pt)
      #card(title: "Definition of Done (DoD - Terminado)", icon: "󰄳", accent: latte.green)[
        1. Código versionado en Git sin conflictos.
        2. Compilación y linter limpios (0 errores).
        3. Pruebas de integración aprobadas por QA.
        4. Pull Request aprobado por Arquitectura.
      ]
    ],
    ratio: (1.05fr, 0.95fr),
    gutter: 14pt,
  )
]

// ------------------------------------------------------------------------------
// 7. PARTE 4: VIABILIDAD DEL PRODUCTO MÍNIMO VIABLE (PMV)
// ------------------------------------------------------------------------------
#slide(
  title: "Parte 4: Viabilidad Multidimensional del PMV",
  subtitle: "18 Historias de Usuario / 93 SP distribuidas a lo largo de 5 Sprints (10 semanas)",
  section: "04. PMV",
)[
  #grid(
    columns: (1fr, 1fr),
    gutter: 10pt,
    [
      #card(title: "1. Viabilidad Técnica", icon: "󰒋", accent: latte.blue)[
        - SPA Mobile-First (React + Capacitor) sin duplicar código nativo.
        - Resiliencia ante caídas de red mediante almacenamiento local en `IndexedDB`.
        - Aislamiento relacional RBAC con respuesta < 2s.
      ]
      #v(8pt)
      #card(title: "3. Viabilidad Económica", icon: "󰓅", accent: latte.peach)[
        - Despliegue sobre VPS Hostinger ya contratado (S/ 0 en hardware adicional).
        - Presupuesto de S/ 31,500 amortizable al erradicar mermas y pérdidas de inventario.
      ]
    ],
    [
      #card(title: "2. Viabilidad Operativa", icon: "󰅐", accent: latte.green)[
        - Venta en mostrador en < 2 minutos (flujo táctil intuitivo de 3 toques).
        - *Arqueo de caja diario reducido de más de 1 hora a menos de 10 segundos*.
      ]
      #v(8pt)
      #card(title: "4. Viabilidad de Negocio", icon: "󰄳", accent: latte.mauve)[
        - Precios inmutables y comisiones fijas en soles aplicadas sin alteraciones (*RN-03*).
        - Trazabilidad por DNI de estudiante para validación de garantías y aula virtual.
      ]
    ]
  )
]

// ------------------------------------------------------------------------------
// 8. RESULTADOS DEL SPRINT 1 Y CONCLUSIONES
// ------------------------------------------------------------------------------
#slide(
  title: "Resultados Tangibles y Conclusiones",
  subtitle: "Incremento funcional verificado al 100% de la meta del Sprint 1",
  section: "05. CONCLUSIONES",
)[
  #grid(
    columns: (1fr, 1fr, 1fr, 1fr),
    gutter: 8pt,
    stat-card(value: "100%", label: "Sprint 1", icon: "󰄳", color: latte.green, description: "14/14 tareas cerradas"),
    stat-card(value: "18 SP", label: "Velocidad", icon: "󰓅", color: latte.mauve, description: "3 HUs en Done"),
    stat-card(value: "23/23", label: "Tests en Verde", icon: "󰙨", color: latte.blue, description: "100% pase QA"),
    stat-card(value: "< 10 s", label: "Liquidación", icon: "󰅐", color: latte.teal, description: "De 1h a segundos"),
  )

  #v(10pt)
  #tip-box(title: "Incremento Potencialmente Desplegable")[
    Se implementó y verificó con éxito la arquitectura base: Backend en Node 26 + TypeScript en Docker, modelo relacional ANSI SQL con aislamiento territorial estricto (*RN-05*), suite de pruebas automatizadas y cliente Frontend Mobile-First con autenticación segura, gestión de sucursales y catálogo de publicaciones con margen neto en tiempo real.
  ]
]
