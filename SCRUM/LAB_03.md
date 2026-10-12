# INFORME DE LABORATORIO — PRÁCTICA N.° 03

**UNIVERSIDAD NACIONAL DE SAN AGUSTÍN**  
**FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS**  
**ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS**  

| Formato | Aprobación | Código |
|---|---|---|
| Guía de Práctica de Laboratorio / Talleres / Centros de Simulación | 2022/03/01 | GUIA-PRLE-001 |

---

## INFORMACIÓN BÁSICA

| Campo | Detalle |
|---|---|
| **Asignatura** | Gestión de Proyectos de Software |
| **Título de la práctica** | Mapeo de Procesos de Negocio, Gestión de Interesados y Planificación Ágil |
| **Número de práctica** | 03 |
| **Año lectivo** | 2026 - B |
| **N.° Semestre** | VIII |
| **Fecha de presentación** | 01/10/2026 |
| **Hora de presentación** | 11:59 pm |
| **Nota** | — |
| **Docente** | Mg. Diego Alonso Iquira Becerra |

**Integrantes:**

- Alvarez Choque Miguel Angel
- Arce Mayhua Leonardo Ruben
- Huayhua Hillpa, Yourdyy Yossimar
- Mollo Chuquicaña Dolly Yadhira

---

## I. SOLUCIÓN DE EJERCICIOS/PROBLEMAS

### Resumen Ejecutivo

El presente informe aborda el modelado y la planificación del **Sistema de Gestión Administrativo** para la editorial **QSY**, una MYPE de la ciudad de Arequipa dedicada a la publicación de material académico y médico en lengua quechua. La empresa comercializa sus libros mediante tres distribuidoras aliadas en puntos céntricos de la ciudad y atiende pedidos interregionales a través de su Sucursal Virtual (Soporte).

A partir de la entrevista a profundidad con la gerencia, se determinó que los procesos críticos de venta presencial, control de existencias en consignación, conciliación de liquidaciones y reposición operan bajo esquemas físicos manuales en cuaderno y talonarios de boletas. Esta práctica modela la situación actual (**AS-IS**) identificando cuellos de botella e ineficiencias, diseña la propuesta optimizada (**TO-BE**), gestiona a los interesados mediante la matriz Poder vs. Interés y formula la planificación ágil bajo el marco **Scrum**. Se establece un **Product Backlog** priorizado bajo la técnica MoSCoW y estimado en Puntos de Historia, garantizando la viabilidad de un Producto Mínimo Viable (MVP) ejecutable en un cronograma académico de 10 semanas (5 Sprints) con su respectiva estructura de costos.

**ENLACE DEL VIDEO REALIZADO:** 📹 **[VIDEO GPS - EXPLICACIÓN DE PRÁCTICA 03](https://drive.google.com/drive/folders/1YIlri1xpQWsCfIQiI95nADYoOUAmM8s-?usp=sharing)**

---

## Punto 3: Mapeo de Procesos de Negocio

### 3.1. Definición del alcance operativo

El alcance del mapeo de procesos se concentra en el **ciclo operativo principal de comercialización en consignación**: comienza con la entrega de lotes de libros y talonarios a una distribuidora, continúa con la venta presencial al estudiante y concluye con la conciliación periódica de dinero (liquidación) y el reabastecimiento de existencias. Este ciclo concentra los mayores riesgos operacionales: contabilidad duplicada en cuadernos, emisión manual de comprobantes, demoras de hasta una hora en liquidaciones y dependencia de recuentos físicos para deducir las ventas por diferencia.

Como **proceso complementario**, se modela la **compra virtual con envío a provincia**. Este canal presenta un flujo diferenciado: el estudiante solicita el libro por WhatsApp a la Sucursal Virtual (Soporte), remite el comprobante de transferencia (Yape) y datos de destino; Soporte valida el pago, empaqueta el producto, emite la boleta y entrega el bulto a la empresa de transportes (principalmente Shalom).

**Procesos fuera del alcance:** Quedan formalmente excluidos el proceso industrial de impresión y encuadernación (subcontratado a un proveedor externo de imprenta) y la redefinición matemática de la comisión de las distribuidoras. El cliente estableció como restricción innegociable mantener la comisión fija monetaria por ejemplar vendido; por tanto, el software automatiza su deducción, pero respeta la regla de negocio existente.

---

### 3.2. Proceso actual (AS-IS)

En la situación actual, QSY entrega libros en consignación y talonarios de boletas físicas (dos talonarios de 100 boletas por tanda) a cada distribuidora según estimaciones empíricas. La cantidad entregada se registra manualmente por duplicado en cuadernos independientes (uno en custodia de la distribuidora y otro de Logística).

Cuando un estudiante acude a comprar, el vendedor (1 o 2 personas por punto) consulta mentalmente o en su cuaderno si dispone de ejemplares, cobra en efectivo o mediante Yape personal, anota el nombre del comprador, nivel y precio, y llena manualmente una boleta física. Esta tarea toma entre 3 y 5 minutos. Debido a la alta concurrencia de estudiantes, los vendedores con frecuencia omiten llenar la boleta o la llenan con datos incompletos. Asimismo, los estudiantes suelen extraviar el comprobante físico, imposibilitando la verificación de garantías o cambios.

QSY no dispone de visibilidad en tiempo real de las ventas. Cuando el stock disminuye o al cumplirse el ciclo mensual, el distribuidor solicita libros por llamada o WhatsApp. El encargado de Logística se desplaza físicamente al local, cuenta los libros restantes y deduce las ventas restando el stock físico del saldo entregado. Con base en esta diferencia, calcula la liquidación quincenal o mensual descontando la comisión pactada.

```
+----------------------------------------------------------------------------------------------------+
|                                    PROCESO ACTUAL: AS-IS                                           |
+----------------------------------------------------------------------------------------------------+
| 1. Entrega empírica de libros en consignación y 2 talonarios físicos (cuaderno duplicado).         |
| 2. Venta presencial: consulta manual de stock, cobro en efectivo/Yape, llenado manual de boleta.    |
| 3. Registro manual en cuaderno del distribuidor; QSY sin información en tiempo real.              |
| 4. Quiebre de stock: distribuidor solicita reposición por WhatsApp o llamada telefónica.          |
| 5. Traslado físico de Logística al local (2 a 4 horas entre transporte y cuentas).                 |
| 6. Conteo físico manual de libros restantes -> Deducción de ventas por diferencia aritmética.       |
| 7. Liquidación manual quincenal/mensual calculando comisión fija por título (1 hora por local).    |
+----------------------------------------------------------------------------------------------------+
```

#### Cuellos de botella e ineficiencias identificadas:
1. **Descentralización del inventario:** Cada distribuidora mantiene un cuaderno aislado; QSY ignora las existencias reales hasta que realiza una visita física.
2. **Reconstrucción empírica de ventas:** Las ventas se calculan por diferencia entre lo entregado y lo que sobra en el mostrador; un error en el conteo físico distorsiona el cálculo financiero y genera discrepancias.
3. **Emisión física lenta y propensa a extravíos:** El llenado de la boleta toma hasta 2 minutos; los estudiantes pierden el comprobante y el negocio no puede identificar qué vendedor emitió un boletero específico.
4. **Liquidación manual prolongada:** La revisión de cuadernos y cálculo de comisiones por producto toma aproximadamente 1 hora por distribuidora, catalogado como el proceso que más tiempo hace perder.
5. **Reabastecimientos imprevistos y costosos:** La reposición empírica genera viajes no programados de hasta 4 horas (transporte y cuadre), interrumpiendo las actividades del encargado de Logística.
6. **Salidas no registradas:** Las mermas, ejemplares dañados, cortesías a docentes o promociones no registran motivo ni responsable, encubriendo posibles pérdidas.
7. **Conectividad móvil inestable:** Los locales operan en zonas céntricas donde la señal de datos en teléfonos móviles presenta cortes temporales frecuentes.

---

### 3.3. Proceso propuesto (TO-BE)

El proceso **TO-BE** preserva la estructura comercial de QSY, pero sustituye los registros manuales por un único repositorio transaccional centralizado y accesible desde la nube. Logística registra las entregas en el sistema, cargando el stock directamente a la distribuidora receptora.

Durante la venta presencial, el distribuidor interactúa desde su teléfono móvil con una interfaz web responsiva y optimizada (mobile-first). Al registrar la compra, ingresa el DNI y nombre del estudiante, selecciona el producto y confirma el pago; el sistema valida el stock local, descuenta la unidad en tiempo real, asocia el correlativo del comprobante y registra de manera inmutable la fecha, hora exacta y vendedor responsable.

Para mitigar la inestabilidad de la señal móvil, la arquitectura incorpora **soporte offline** mediante almacenamiento local en el navegador (IndexedDB / LocalStorage). Si la red se interrumpe, el vendedor continúa registrando ventas en su terminal; en cuanto la conectividad se restablece, el sistema sincroniza las transacciones automáticamente con el servidor central.

Para el reabastecimiento y la liquidación, el sistema provee información instantánea: Logística consulta en su panel el inventario disponible y el histórico de ventas de cada local antes de salir del almacén central, preparando exactamente los ejemplares necesarios. La liquidación se consolida automáticamente calculando el importe recaudado y deduciendo la comisión fija por producto, reduciendo el proceso de 1 hora a solo 10 minutos.

```
+----------------------------------------------------------------------------------------------------+
|                                   PROCESO PROPUESTO: TO-BE                                         |
+----------------------------------------------------------------------------------------------------+
| 1. Logística registra entrega de libros y asignación de boletas en el sistema central.            |
| 2. Distribuidor vende desde celular (< 2 min): validación de stock, registro de DNI del alumno.     |
| 3. Descuento automático de inventario y generación/asociación de boleta electrónica digital.       |
| 4. Tolerancia a red inestable: registro local offline y sincronización automática al volver señal.  |
| 5. Reabastecimiento asistido: distribuidor solicita por web; Logística revisa stock antes de ir.  |
| 6. Liquidación automatizada: sistema calcula venta total, comisión pactada y saldo a entregar.     |
| 7. Dashboard gerencial: Administrador monitorea ventas del día, ranking de sedes y stock crítico.  |
+----------------------------------------------------------------------------------------------------+
```

---

### 3.4. Proceso complementario: Envíos a provincia

En el flujo actual, los envíos interregionales sufren constantes demoras por desorganización en los chats de WhatsApp: los clientes tardan en enviar sus datos completos, remiten tarde las capturas de transferencias de Yape y desconocen la dirección exacta de la agencia de encomiendas de Shalom. Soporte no cuenta con una bitácora para registrar números de guía ni estados de envío.

En el proceso TO-BE, Soporte registra el pedido en el módulo especializado de compras virtuales:
1. Se valida el depósito de Yape y se asocian los datos del cliente (DNI, nombres, celular, departamento y agencia Shalom de destino).
2. Se emite la boleta electrónica correspondiente.
3. Se reserva la unidad del inventario central en estado "En preparación".
4. Una vez despachado el paquete en la agencia, Soporte registra el número de guía de Shalom y actualiza el estado a "En tránsito", remitiendo automáticamente el comprobante digital y la guía al WhatsApp del cliente. Esto otorga trazabilidad completa ante cualquier reclamo o pérdida durante el transporte.

---

### 3.5. Comparación de tiempos y eficiencia esperada (AS-IS vs. TO-BE)

La línea base corresponde a los tiempos reales reportados por el cliente durante la entrevista de levantamiento. Los tiempos del estado TO-BE corresponden a la optimización alcanzada mediante la digitalización y automatización de validaciones.

| Actividad Operativa | Tiempo Actual (AS-IS) | Tiempo Esperado (TO-BE)* | Mejora y Eficiencia Esperada |
|---|---|---|---|
| **Verificación de stock disponible** | 1 min | < 10 s | Consulta digital inmediata del stock asignado al local antes de confirmar la venta. |
| **Registro de venta en mostrador** | 5 min | ≈ 2 min | Interfaz móvil simplificada (4 toques) con validaciones y captura de DNI y nombres. |
| **Emisión y llenado de boleta** | 2 min | < 30 s | Comprobante digital generado y vinculado automáticamente a la transacción. |
| **Consulta de ventas por distribuidora** | 30 min | < 1 min | Información consolidada al instante sin depender de conteos manuales de existencias. |
| **Liquidación periódica por distribuidora** | 1 h | ≈ 10 min | El sistema calcula importes y comisiones fijas; Logística solo valida excepciones y depósitos. |
| **Reabastecimiento de punto de venta** | 2 a 4 h | ≈ 1 a 2 h | Se planifica con datos reales antes del viaje; se optimiza el viaje manteniendo el tiempo de traslado físico. |
| **Preparación de envío a provincia** | 40 min a 1 h | ≈ 20 min | Formulario estructurado con captura de guía Shalom y emisión digital de comprobante. |

> \* *Nota metodológica: Las reducciones de tiempo aplican a las actividades administrativas y transaccionales de captura y cálculo. En actividades que involucran transporte físico hacia distribuidoras o agencias de transporte, el tiempo de traslado se mantiene.*

---

## Punto 4: Gestión de Interesados (Stakeholders)

### 4.1. Identificación de interesados

Se identificaron 10 interesados clave para el proyecto de software de la editorial QSY:

| N.° | Interesado (Stakeholder) | Tipo | Rol en el Proyecto | Interés Principal y Expectativas |
|---|---|---|---|---|
| **1** | **Administrador / Gerente QSY** | Interno | Patrocinador y Decisor Final | Acceso total, dashboard con ventas diarias/mensuales, control de precios y catálogo, consulta por DNI de clientes y control de liquidaciones. |
| **2** | **Encargado de Logística** | Interno | Usuario Clave / Operador Principal | Control del inventario central, entregas en consignación, reabastecimiento asistido, registro de salidas especiales y verificación de liquidaciones. |
| **3** | **Sucursal Virtual (Soporte)** | Interno | Usuario Clave Operativo | Registro ágil de ventas en línea, atención de pedidos a provincia vía Shalom, emisión de comprobantes digitales y gestión de reclamos. |
| **4** | **Distribuidores (3 locales)** | Externo / Aliado | Usuario Final Operativo | Registrar ventas desde celular de forma rápida y sencilla, operar sin internet ante señal inestable, consultar su stock asignado y pedir libros sin llamar. |
| **5** | **Estudiantes / Clientes** | Externo | Beneficiario Final | Compra rápida sin colas, recepción oportuna de boleta digital y atención eficaz de reclamos sobre ejemplares adquiridos. |
| **6** | **Proveedor de Imprenta** | Externo | Proveedor de Producción | Recepción oportuna de requerimientos de impresión y entrega de lotes de libros. |
| **7** | **Empresa de Transporte (Shalom)** | Externo | Proveedor Logístico | Recepción de paquetes correctamente rotulados y entrega interregional en agencia. |
| **8** | **Pasarela de Pagos / Yape (BCP)** | Externo | Proveedor Tecnológico | Canal de recaudación electrónica para compras presenciales y de provincia. |
| **9** | **Equipo de Desarrollo GPS** | Interno | Ejecutor Técnico | Requisitos claros, Product Backlog priorizado, Definition of Ready definida y cumplimiento del cronograma ágil. |
| **10** | **Área de Soporte TI / Servidores** | Interno | Soporte de Infraestructura | Mantenimiento de los 3 VPS del cliente, dominio web, certificados SSL y respaldos. |

---

### 4.2. Matriz Poder vs. Interés

```
    ALTO PODER
         |
         |   [MANTENER SATISFECHO]                 [GESTIONAR DE CERCA]
         |   • Proveedor de Imprenta               • Administrador / Gerente QSY
         |   • Shalom                              • Encargado de Logística
         |   • Yape / Pasarela                     • Distribuidores (3 locales)
         |
         +-----------------------------------------------------------------
         |
         |   [MONITOREAR]                          [MANTENER INFORMADO]
         |   • Soporte TI (VPS)                    • Sucursal Virtual (Soporte)
         |   • Equipo de Desarrollo                • Estudiantes / Clientes
         |
    BAJO PODER -------------------------------------------------------->
                   BAJO INTERÉS                           ALTO INTERÉS
```

#### Justificación analítica de los cuadrantes:
- **Gestionar de Cerca (Alto Poder / Alto Interés):**
  - *Administrador/Gerente:* Tiene poder de veto, fija el alcance y financia el proyecto.
  - *Encargado de Logística:* Su operación diaria alimenta y concilia el inventario.
  - *Distribuidores:* Aunque son aliados comerciales externos, poseen un poder de adopción crítico: si el sistema en el celular les resulta engorroso o falla sin internet, continuarán utilizando cuadernos físicos y el proyecto fracasará.
- **Mantener Satisfecho (Alto Poder / Bajo Interés):** Shalom, la imprenta y Yape condicionan la continuidad física y de pagos; deben cumplirse sus estándares sin involucrarlos en el diseño de software.
- **Mantener Informado (Bajo Poder / Alto Interés):** Soporte y los estudiantes dependen de la agilidad del servicio pero no definen la arquitectura técnica del sistema.
- **Monitorear (Bajo Poder / Bajo Interés):** Soporte TI y el equipo ejecutor operan bajo pautas técnicas establecidas.

---

### 4.3. Matriz de estrategia de gestión de interesados

| Interesado | Clasificación | Expectativas Críticas | Nivel Impacto | Estrategia de Participación y Comunicación |
|---|---|---|---|---|
| **Administrador / Gerente** | Gestionar de Cerca | Control de ingresos, dashboard de ventas, trazabilidad por DNI, precios inmutables. | Alto | Reuniones de demostración quincenales al cierre de cada Sprint (Sprint Review); aprobación formal de cambios de alcance. |
| **Encargado de Logística** | Gestionar de Cerca | Facilidad para registrar lotes de imprenta, entregas, traslados, alertas de stock y liquidación rápida. | Alto | Sesiones semanales de validación de prototipos; pruebas funcionales de conciliación y capacitación en módulo de almacén. |
| **Distribuidores (3 locales)** | Gestionar de Cerca | Venta móvil rápida, operación offline garantizada, visualización clara de sus libros asignados. | Alto | Talleres prácticos en celular; diseño mobile-first; pruebas de desconexión de red; canal de retroalimentación directa. |
| **Sucursal Virtual (Soporte)** | Mantener Informado | Registro ordenado de compras de provincia, captura de guía Shalom, emisión ágil de boletas. | Medio | Inducción operativa previa al despliegue; entrega de manuales rápidos para registro de envíos y atención de reclamos. |
| **Estudiantes / Clientes** | Mantener Informado | Recepción de boleta electrónica vía WhatsApp/correo, solución rápida de reclamos con DNI. | Medio | Comunicación gráfica en los puntos de venta sobre la entrega del comprobante electrónico; validación de satisfacción. |
| **Proveedor de Imprenta** | Mantener Satisfecho | Solicitudes claras de tiradas con tiempos suficientes. | Bajo | Coordinación mensual a través del encargado de Logística. |
| **Empresa Shalom** | Mantener Satisfecho | Rótulos legibles y cumplimiento de normativas de carga. | Bajo | Emisión de datos normalizados para facilitar la admisión de encomiendas. |
| **Yape / BCP** | Mantener Satisfecho | Transacciones válidas y conciliación regular. | Bajo | Auditoría y registro de números de operación en ventas virtuales. |
| **Soporte TI** | Monitorear | Estabilidad de los 3 servidores VPS, dominio y certificados SSL. | Medio | Reportes mensuales de rendimiento y verificación de respaldos automáticos. |
| **Equipo de Desarrollo** | Monitorear | Definición clara de requisitos, DoR validado y backlog priorizado. | Alto | Reuniones diarias (Daily Standups), planificación de Sprint y retrospectivas. |

---

## Punto 5: Estimación de Tiempos y Cronograma Ágil

### 5.1. Capacidad del equipo y velocidad estimada

El proyecto se planifica bajo el marco de trabajo **Scrum**, estructurado en **5 Sprints de 2 semanas de duración** (10 semanas de desarrollo efectivo, abarcando de la **Semana 06 a la Semana 15** del semestre académico).

- **Composición del equipo:**
  - 1 Analista de Requisitos / Scrum Master (20 horas/semana)
  - 2 Desarrolladores Full-Stack (40 horas/semana cada uno = 80 h/sem)
  - 1 QA Tester / Aseguramiento de Calidad (15 horas/semana)
- **Capacidad semanal total:** 115 horas-hombre / semana.
- **Total de horas-hombre del proyecto:** 115 h/sem × 10 semanas = **1,150 horas-hombre**.
- **Alcance planificado para el MVP (Release 1):** **110 Puntos de Historia (SP)**, seleccionados estrictamente de las historias de usuario indispensables (*Must Have*) del sistema.
- **Velocidad promedio estimada del equipo:** **22 SP por Sprint**.

---

### 5.2. Distribución de Sprints (Release 1 - MVP de 110 SP)

La asignación de Historias de Usuario para los 5 Sprints cubre la totalidad del alcance crítico (*Must Have*):

| Sprint | Alcance Funcional / Módulos Cubiertos | Historias Asignadas | Story Points | Duración |
|---|---|---|---|---|
| **Sprint 1** | **Arquitectura Base, Roles y Gestión de Sucursales / Catálogo** | HU-01 (8), HU-02 (5), HU-03 (5), HU-05 (2) | **20 SP** | Semanas 06 - 07 |
| **Sprint 2** | **Control de Inventario Central y Distribución en Consignación** | HU-04 (8), HU-06 (5), HU-15 (6), HU-16 (5) | **24 SP** | Semanas 08 - 09 |
| **Sprint 3** | **Punto de Venta Móvil (POS) y Resiliencia Offline** | HU-07 (8), HU-08 (8), HU-09 (3), HU-10 (3) | **22 SP** | Semanas 10 - 11 |
| **Sprint 4** | **Reabastecimiento Asistido, Control de Boletas y Stock Local** | HU-11 (5), HU-12 (4), HU-13 (5), HU-14 (5), HU-22 (5) | **24 SP** | Semanas 12 - 13 |
| **Sprint 5** | **Liquidación de Comisiones, Dashboard Gerencial y Despliegue** | HU-19 (5), HU-23 (3), HU-26 (4), HU-27 (4), HU-28 (4) | **20 SP** | Semanas 14 - 15 |
| **TOTAL** | **Alcance Completo del MVP (Release 1)** | **22 Historias Must Have** | **110 SP** | **10 semanas** |

---

### 5.3. Cronograma de hitos y entregables

| Hito | Entregable Clave | Criterio de Aceptación del Hito | Semana Límite |
|---|---|---|---|
| **Hito 1** | Plataforma base, modelo de seguridad RBAC y gestión de distribuidores | Base de datos relacional configurada en entorno de desarrollo local; autenticación con roles operativos; CRUD de sedes y catálogo de productos con precios y comisiones fijas. | **Semana 07** |
| **Hito 2** | Módulo de inventario central y entregas en consignación | Kardex operativo; registro de lotes de imprenta; transferencias a distribuidoras con confirmación; alertas automáticas de stock mínimo. | **Semana 09** |
| **Hito 3** | Terminal de venta móvil (POS) con sincronización offline | Venta en menos de 2 minutos desde celular; captura de DNI; almacenamiento local en IndexedDB ante corte de red y sincronización bidireccional al reconectar. | **Semana 11** |
| **Hito 4** | Reabastecimiento asistido y trazabilidad de talonarios de boletas | Solicitud web de reposición; cálculo previo de ventas por Logística; asociación y validación estricta de correlativos de boletas físicas asignadas. | **Semana 13** |
| **Hito 5** | Liquidación automática, dashboard gerencial y puesta en producción | Cálculo instantáneo de liquidación con deducción de comisión fija; gráficos de ventas diarias/mensuales; pruebas UAT con la gerencia y despliegue en VPS. | **Semana 15** |

---

## Punto 6: Presupuesto y Estructura de Costos del Proyecto

### 6.1. Costos directos (Personal / Horas-Hombre)

El equipo de desarrollo se valoriza con base en tarifas estándar de mercado para desarrollo de software júnior/intermedio en el contexto local:

| Rol Profesional | Dedicación Semanal | Horas Totales (10 sem) | Tarifa por Hora | Costo Total (S/) |
|---|---|---|---|---|
| **Analista de Requisitos / Scrum Master** | 20 h/sem | 200 h | S/ 35.00 | S/ 7,000.00 |
| **Desarrollador Full-Stack 1 (Backend/Cloud)** | 40 h/sem | 400 h | S/ 25.00 | S/ 10,000.00 |
| **Desarrollador Full-Stack 2 (Frontend/Mobile)** | 40 h/sem | 400 h | S/ 25.00 | S/ 10,000.00 |
| **QA Tester / Aseguramiento de Calidad** | 15 h/sem | 150 h | S/ 20.00 | S/ 3,000.00 |
| **Subtotal Costos Directos (CD)** | **115 h/sem** | **1,150 h** | — | **S/ 30,000.00** |

---

### 6.2. Costos indirectos (Infraestructura, Licencias y Servicios)

Se optimizan costos aprovechando la infraestructura tecnológica con la que ya cuenta la editorial QSY:

| Concepto / Rubro | Detalle y Justificación Técnica | Costo Total (S/) |
|---|---|---|
| **Servidor Cloud (VPS)** | Se utilizará uno de los 3 VPS propiedad del cliente (Linux Ubuntu Server, 50 GB SSD). | S/ 0.00 |
| **Dominio Web y Certificados SSL** | Dominio corporativo vigente del cliente; certificados SSL gratuitos mediante Let's Encrypt. | S/ 0.00 |
| **Servicio API de Comprobantes SUNAT** | Suscripción a plan básico de API de facturación electrónica (PSE/OSE) para pruebas e integración (2.5 meses). | S/ 150.00 |
| **Herramientas de Colaboración y CI/CD** | GitHub, Jira/Trello y Docker bajo planes de uso educativo/gratuitos. | S/ 0.00 |
| **Subtotal Costos Indirectos (CI)** | — | **S/ 150.00** |

---

### 6.3. Presupuesto consolidado (Línea Base de Costos)

| Categoría Financiera | Base de Cálculo | Monto Total (S/) |
|---|---|---|
| **Costos Directos (Personal)** | Planilla de 1,150 horas-hombre | S/ 30,000.00 |
| **Costos Indirectos (Servicios)** | Proveedor de integración fiscal SUNAT | S/ 150.00 |
| **Subtotal Operativo** | CD + CI | S/ 30,150.00 |
| **Reserva de Contingencia (5%)** | 5% de (CD + CI) para riesgos identificados de conectividad/cambios | S/ 1,507.50 |
| **LÍNEA BASE DE COSTOS TOTAL** | **Inversión Total del Proyecto** | **S/ 31,657.50** |

---

## Punto 7: Product Backlog

El Product Backlog se construyó traduciendo los **39 Requisitos Funcionales** y las necesidades operativas de la entrevista en Historias de Usuario bajo el formato estándar:

> Como **\<rol\>**, quiero **\<funcionalidad\>**, para **\<beneficio esperado\>**.

Se aplicó la técnica **MoSCoW** para priorizar y la serie de Fibonacci para la estimación en **Puntos de Historia (SP)**.

### Módulos del sistema y trazabilidad con la arquitectura

Para la gestión ágil, el sistema se divide en **10 módulos operativos** que mapean directamente los 9 módulos de arquitectura y el catálogo de requisitos del LAB_02:

| Código | Módulo Operativo de Scrum | Módulo Arquitectónico LAB_02 | Requisitos Funcionales Trazables | Prioridad General |
|---|---|---|---|---|
| **M1** | Distribución de libros a distribuidoras | Módulo 1 (Sucursales) y Módulo 4 (Inventario) | RF-01, RF-02, RF-14, RF-21 | Must Have |
| **M2** | Registro de ventas en distribuidoras | Módulo 2 (Compra acelerada) y Módulo 3 (Ventas) | RF-05, RF-06, RF-07, RF-08, RF-09, RF-10, RF-11 | Must Have |
| **M3** | Reabastecimiento de puntos de venta | Módulo 4 (Distribución e inventario) | RF-13, RF-15, RF-16 | Must Have |
| **M4** | Control de inventario y almacén central | Módulo 4 (Inventario) y Módulo 6 (Producción/Salidas) | RF-21, RF-22, RF-23, RF-24, RF-25, RF-26 | Must Have |
| **M5** | Liquidación y control de dinero | Módulo 3 (Control ventas) y Módulo 7 (Dashboard) | RF-03, RF-27, RF-31 | Must Have / Should Have |
| **M6** | Boletas y comprobantes de venta | Módulo 8 (Comprobantes) y Módulo 9 (Envío) | RF-32, RF-33, RF-34, RF-35 | Must Have / Should Have |
| **M7** | Dashboard gerencial y reportes | Módulo 7 (Dashboard de control gerencial) | RF-04, RF-27, RF-28, RF-29, RF-30 | Must Have / Should Have |
| **M8** | Administración de usuarios y catálogo | Módulo 1 (Sucursales) y Módulo 6 (Productos) | RF-01, RF-02, RF-21 | Must Have |
| **M9** | Envíos a provincia y ventas virtuales | Módulo 5 (Compras virtuales interregionales) | RF-17, RF-18, RF-19, RF-20 | Could Have (Segunda etapa) |
| **M10** | Reclamos y trazabilidad de clientes | Módulo 3 (Auditoría) y Módulo 9 (Reenvío) | RF-12, RF-38, RF-39 | Should Have / Could Have |

---

### Tabla priorizada del Product Backlog

A continuación se detalla la totalidad de las 35 Historias de Usuario que componen el Product Backlog:

| ID | Mód. | Historia de Usuario | Prioridad MoSCoW | Release | SP |
|---|---|---|---|---|---|
| **HU-01** | M8 | Como Administrador, quiero autenticarme y gestionar usuarios con roles para controlar el acceso al sistema. | Must Have | Release 1 (MVP) | 8 |
| **HU-02** | M8 | Como Administrador, quiero agregar nuevos distribuidores con correo y local para mantener actualizado el padrón. | Must Have | Release 1 (MVP) | 5 |
| **HU-03** | M8 | Como Administrador, quiero agregar nuevos tipos de productos y modificar precios para mantener el catálogo. | Must Have | Release 1 (MVP) | 5 |
| **HU-04** | M1 | Como Logística, quiero registrar la entrega de libros a cada distribuidora con títulos y cantidades para tener trazabilidad. | Must Have | Release 1 (MVP) | 8 |
| **HU-05** | M1 | Como Logística, quiero que el distribuidor confirme la recepción de libros para contar con constancia digital. | Must Have | Release 1 (MVP) | 2 |
| **HU-06** | M1 | Como Logística, quiero consultar cuántos libros conserva cada distribuidora para conocer su stock real asignado. | Must Have | Release 1 (MVP) | 5 |
| **HU-07** | M2 | Como Distribuidor, quiero registrar ventas presenciales con boleta desde mi celular para agilizar la atención. | Must Have | Release 1 (MVP) | 8 |
| **HU-08** | M2 | Como Distribuidor, quiero registrar ventas en modo offline y que sincronicen automáticamente al volver la red. | Must Have | Release 1 (MVP) | 8 |
| **HU-09** | M2 | Como Distribuidor, quiero que el sistema valide existencias antes de vender para no incurrir en sobreventas. | Must Have | Release 1 (MVP) | 3 |
| **HU-10** | M2 | Como Distribuidor, quiero ingresar DNI, nombre del estudiante, fecha y precio para formalizar la venta. | Must Have | Release 1 (MVP) | 3 |
| **HU-11** | M2 | Como Distribuidor, quiero visualizar mis libros vendidos y disponibles para controlar mi stock diario. | Must Have | Release 1 (MVP) | 5 |
| **HU-12** | M3 | Como Distribuidor, quiero solicitar reabastecimiento desde la web para pedir libros sin depender de llamadas. | Must Have | Release 1 (MVP) | 4 |
| **HU-13** | M3 | Como Logística, quiero revisar las ventas desde la entrega previa antes de reabastecer para calcular la reposición. | Must Have | Release 1 (MVP) | 5 |
| **HU-14** | M3 | Como Logística, quiero registrar el reabastecimiento entregado con fecha y cantidades para actualizar saldos. | Must Have | Release 1 (MVP) | 5 |
| **HU-15** | M4 | Como Logística, quiero registrar movimientos especiales (traslados, cortesías, docentes, mermas) con motivo justificado. | Must Have | Release 1 (MVP) | 6 |
| **HU-16** | M4 | Como Logística, quiero recibir alertas visuales automáticas cuando una sucursal tenga stock por debajo del mínimo. | Must Have | Release 1 (MVP) | 5 |
| **HU-17** | M4 | Como Logística, quiero visualizar un ranking de sucursales según volumen de ventas para priorizar la distribución. | Should Have | Release 1.1 | 5 |
| **HU-18** | M4 | Como Logística, quiero registrar lotes de libros recepcionados de la imprenta proveedora para sumar al inventario central. | Should Have | Release 1.1 | 5 |
| **HU-19** | M5 | Como Logística, quiero calcular la liquidación aplicando la comisión fija monetaria por libro para conciliar dinero. | Must Have | Release 1 (MVP) | 5 |
| **HU-20** | M5 | Como Logística, quiero registrar el pago de la liquidación quincenal o mensual para mantener el control financiero. | Should Have | Release 1.1 | 5 |
| **HU-21** | M5 | Como Administrador, quiero visualizar el estado de cuenta (pagado o pendiente) de cada distribuidora. | Should Have | Release 1.1 | 5 |
| **HU-22** | M6 | Como Distribuidor, quiero registrar y validar el correlativo de boleta física utilizada en cada venta. | Must Have | Release 1 (MVP) | 5 |
| **HU-23** | M6 | Como Logística, quiero registrar los rangos de boletas entregadas a cada punto para controlar los talonarios. | Must Have | Release 1 (MVP) | 3 |
| **HU-24** | M6 | Como Administrador, quiero consultar qué distribuidor emitió cada boleta específica para identificar errores. | Should Have | Release 1.1 | 3 |
| **HU-25** | M6 | Como Distribuidor, quiero anular o corregir una venta ingresando una justificación obligatoria con fecha y hora. | Should Have | Release 1.1 | 5 |
| **HU-26** | M7 | Como Administrador, quiero un gráfico con las ventas por sucursal en el panel de inicio para monitorear el negocio. | Must Have | Release 1 (MVP) | 4 |
| **HU-27** | M7 | Como Administrador, quiero consultar el total de libros vendidos en el mes y por día para analizar la demanda. | Must Have | Release 1 (MVP) | 4 |
| **HU-28** | M7 | Como Administrador, quiero identificar las sucursales con menor stock disponible para tomar decisiones de reposición. | Must Have | Release 1 (MVP) | 4 |
| **HU-29** | M7 | Como Administrador, quiero visualizar los títulos más vendidos por categoría y fecha para orientar la producción. | Should Have | Release 1.1 | 5 |
| **HU-30** | M7 | Como Administrador, quiero buscar las compras de un estudiante por su DNI para atender reclamos y auditar. | Should Have | Release 1.1 | 5 |
| **HU-31** | M10 | Como Soporte, quiero buscar una venta por DNI, código de libro o boleta para gestionar garantías y cambios. | Should Have | Release 1.1 | 5 |
| **HU-32** | M10 | Como Soporte, quiero registrar incidencias y reclamos de clientes con seguimiento de estado (Abierto/Cerrado). | Could Have | Release 2.0 | 5 |
| **HU-33** | M9 | Como Soporte, quiero registrar compras interregionales con número de guía Shalom y destino para darles seguimiento. | Could Have | Release 2.0 | 8 |
| **HU-34** | M9 | Como Soporte, quiero emitir boleta electrónica y enviarla por WhatsApp para formalizar la venta a provincia. | Could Have | Release 2.0 | 5 |
| **HU-35** | M5 | Como Administrador, quiero un panel consolidado de finanzas y ganancias para ver ingresos netos y comisiones. | Could Have | Release 2.0 | 7 |

---

### Resumen del Product Backlog por MoSCoW

| Prioridad MoSCoW | Cantidad de HUs | Story Points (SP) | Porcentaje de Esfuerzo | Planificación y Destino |
|---|---|---|---|---|
| **Must Have (Esencial)** | 22 | 110 SP | 61.8% | **Release 1 (MVP):** 5 Sprints (Semanas 06 a 15). Alcance formal del curso. |
| **Should Have (Importante)** | 9 | 43 SP | 24.2% | **Release 1.1:** Fase de optimización y reportería avanzada post-MVP. |
| **Could Have (Deseable)** | 4 | 25 SP | 14.0% | **Release 2.0 (Segunda etapa):** Envíos a provincia, panel de finanzas y reclamos formales. |
| **Won't Have (Descartado)** | 0 | 0 SP | 0.0% | No aplica en la versión inicial. |
| **TOTAL PRODUCT BACKLOG** | **35** | **178 SP** | **100.0%** | **Catálogo Completo del Sistema** |

> *Aclaración metodológica sobre la coherencia entre el Backlog y el Cronograma:*  
> El **Product Backlog** consolida las 35 historias necesarias para la visión integral del software (178 SP). Sin embargo, la **planificación operativa del proyecto académico (Punto 5)** ejecuta estrictamente el **MVP compuesto por las 22 historias Must Have (110 SP)** a lo largo de los **5 Sprints de 2 semanas (10 semanas efectivas)**, con una velocidad promedio de **22 SP/Sprint**. Esto asegura el cumplimiento de la línea base de costos (S/ 31,657.50) y del calendario del semestre, dejando las funcionalidades de segunda etapa (*Should* y *Could*) para el siguiente año comercial, tal como solicitó expresamente el cliente en la entrevista (Preguntas 84, 85 y 123).

---

### Fichas detalladas de Historias de Usuario

A continuación se presentan las fichas técnicas detalladas de las historias de usuario representativas agrupadas por módulos:

---

#### MÓDULO 1: DISTRIBUCIÓN DE LIBROS A DISTRIBUIDORAS

**HU-04: Registro de entrega a distribuidoras**
- **ID:** HU-04
- **Título:** Registro de entrega de libros en consignación
- **Módulo:** M1 — Distribución de libros
- **Prioridad MoSCoW:** Must Have | **SP:** 8 | **Release:** Release 1 (Sprint 2)
- **Estructura:** Como Logística, quiero registrar la entrega de libros a cada distribuidora especificando títulos y cantidades, para mantener la trazabilidad de los ejemplares en consignación.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro exitoso de entrega.  
    *DADO QUE* el encargado de Logística prepara un despacho para una sede,  
    *CUANDO* selecciona la distribuidora receptora, títulos y cantidades e ingresa su confirmación,  
    *ENTONCES* el sistema debe registrar el movimiento con fecha y responsable, descontar las unidades del almacén central y agregarlas al stock en consignación de dicha distribuidora.
  - **Escenario 2:** Intento de despacho con stock insuficiente en almacén central.  
    *DADO QUE* el almacén central no cuenta con existencias suficientes de un título,  
    *CUANDO* Logística intenta registrar la entrega,  
    *ENTONCES* el sistema debe bloquear el registro, emitir una alerta de stock insuficiente y no modificar saldos.
- **Dependencias:** HU-02, HU-06 | **Interesados:** Logística, Distribuidores, Administrador

**HU-05: Confirmación de recepción**
- **ID:** HU-05
- **Título:** Confirmación de recepción por la distribuidora
- **Módulo:** M1 — Distribución de libros
- **Prioridad MoSCoW:** Must Have | **SP:** 2 | **Release:** Release 1 (Sprint 1)
- **Estructura:** Como Logística, quiero que el distribuidor confirme digitalmente la recepción de libros para contar con constancia y cerrar la transferencia.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Confirmación conforme del lote.  
    *DADO QUE* existe una entrega pendiente registrada por Logística,  
    *CUANDO* el distribuidor ingresa a su sesión y presiona "Confirmar Recepción Conforme",  
    *ENTONCES* el sistema debe cambiar el estado del envío a "Recibido", registrando fecha, hora y usuario.
  - **Escenario 2:** Observación por discrepancia física.  
    *DADO QUE* los libros físicos recibidos no coinciden con lo registrado en el sistema,  
    *CUANDO* el distribuidor selecciona "Registrar Observación" e indica las cantidades reales,  
    *ENTONCES* el sistema debe notificar de inmediato a Logística para la corrección de saldos.
- **Dependencias:** HU-04 | **Interesados:** Logística, Distribuidores

**HU-06: Consulta de stock por distribuidora**
- **ID:** HU-06
- **Título:** Consulta centralizada de stock por sede
- **Módulo:** M1 — Distribución de libros
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 2)
- **Estructura:** Como Logística, quiero consultar cuántos libros conserva cada distribuidora para conocer sus existencias reales.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Visualización por sede.  
    *DADO QUE* Logística accede a la gestión de distribuidoras,  
    *CUANDO* selecciona una distribuidora específica,  
    *ENTONCES* el sistema debe listar los títulos, cantidades entregadas, vendidas y saldo disponible actual.
  - **Escenario 2:** Consolidado general.  
    *DADO QUE* se requiere una vista global,  
    *CUANDO* Logística elige la opción "Ver Balance General",  
    *ENTONCES* el sistema debe mostrar una tabla comparativa con los saldos de las tres distribuidoras.
- **Dependencias:** HU-04, HU-07 | **Interesados:** Logística, Administrador

---

#### MÓDULO 2: REGISTRO DE VENTAS EN DISTRIBUIDORAS

**HU-07: Venta presencial con boleta desde celular**
- **ID:** HU-07
- **Título:** Registro ágil de ventas en ventanilla
- **Módulo:** M2 — Registro de ventas
- **Prioridad MoSCoW:** Must Have | **SP:** 8 | **Release:** Release 1 (Sprint 3)
- **Estructura:** Como Distribuidor, quiero registrar ventas presenciales con boleta desde mi celular para agilizar la atención al estudiante en menos de 2 minutos.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro exitoso de venta.  
    *DADO QUE* el vendedor está en el formulario de venta e ingresa DNI, nombre del alumno, libro, método de pago y número de boleta física,  
    *CUANDO* presiona "Confirmar Venta",  
    *ENTONCES* el sistema debe registrar la transacción, descontar una unidad del stock local y mostrar pantalla de venta exitosa en menos de 2 segundos.
  - **Escenario 2:** Validación de datos obligatorios.  
    *DADO QUE* el vendedor omite el DNI o el número de boleta,  
    *CUANDO* intenta confirmar la venta,  
    *ENTONCES* el sistema debe resaltar los campos faltantes y no permitir continuar.
- **Dependencias:** HU-09, HU-22 | **Interesados:** Distribuidor, Logística, Administrador

**HU-08: Venta offline con sincronización diferida**
- **ID:** HU-08
- **Título:** Operación en modo offline ante señal inestable
- **Módulo:** M2 — Registro de ventas
- **Prioridad MoSCoW:** Must Have | **SP:** 8 | **Release:** Release 1 (Sprint 3)
- **Estructura:** Como Distribuidor, quiero registrar ventas sin conexión a internet para continuar atendiendo cuando la señal móvil se interrumpa.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro local sin internet.  
    *DADO QUE* el dispositivo pierde conexión de datos,  
    *CUANDO* el vendedor confirma una venta,  
    *ENTONCES* el sistema debe almacenar la transacción en el almacenamiento local del navegador (IndexedDB), mostrar indicador "Guardado Offline" y permitir seguir vendiendo.
  - **Escenario 2:** Sincronización automática.  
    *DADO QUE* el dispositivo recupera señal de red,  
    *CUANDO* el sistema detecta conectividad,  
    *ENTONCES* debe enviar las transacciones encoladas al servidor central, actualizar los saldos y notificar "Sincronización Completada".
- **Dependencias:** HU-07, HU-09 | **Interesados:** Distribuidor, Logística, Administrador

**HU-09: Validación estricta de stock previo a la venta**
- **ID:** HU-09
- **Título:** Bloqueo preventivo ante quiebre de stock
- **Módulo:** M2 — Registro de ventas
- **Prioridad MoSCoW:** Must Have | **SP:** 3 | **Release:** Release 1 (Sprint 3)
- **Estructura:** Como Distribuidor, quiero que el sistema valide el stock asignado antes de confirmar para evitar sobreventas accidentales.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Stock disponible conforme.  
    *DADO QUE* la cantidad solicitada es menor o igual al saldo local,  
    *CUANDO* el vendedor selecciona el libro,  
    *ENTONCES* el sistema habilita el botón de confirmación.
  - **Escenario 2:** Intento de venta con stock cero.  
    *DADO QUE* el stock local de un libro es cero,  
    *CUANDO* el vendedor intenta seleccionarlo para venta,  
    *ENTONCES* el sistema inhabilita la opción, muestra mensaje de "Agotado en este local" y bloquea la operación.
- **Dependencias:** HU-04, HU-11 | **Interesados:** Distribuidor, Logística

**HU-10: Registro de datos del estudiante**
- **ID:** HU-10
- **Título:** Captura de datos mínimos del cliente
- **Módulo:** M2 — Registro de ventas
- **Prioridad MoSCoW:** Must Have | **SP:** 3 | **Release:** Release 1 (Sprint 3)
- **Estructura:** Como Distribuidor, quiero ingresar DNI y nombres del estudiante comprador para asegurar la trazabilidad de la venta.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** DNI válido ingresado.  
    *DADO QUE* el vendedor ingresa un DNI de 8 dígitos numéricos,  
    *CUANDO* pasa al siguiente campo,  
    *ENTONCES* el sistema valida el formato y permite ingresar los nombres.
  - **Escenario 2:** DNI con formato erróneo.  
    *DADO QUE* el valor ingresado tiene menos de 8 dígitos o caracteres alfabéticos,  
    *CUANDO* se intenta avanzar,  
    *ENTONCES* el sistema muestra la advertencia "DNI inválido" y exige la corrección.
- **Dependencias:** HU-07 | **Interesados:** Distribuidor, Administrador

**HU-11: Visualización de libros vendidos y disponibles**
- **ID:** HU-11
- **Título:** Monitor de inventario del distribuidor
- **Módulo:** M2 — Registro de ventas
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 4)
- **Estructura:** Como Distribuidor, quiero visualizar mis libros vendidos y existencias restantes para controlar mi cuadre diario.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Consulta en tiempo real.  
    *DADO QUE* el distribuidor entra a la sección "Mi Stock",  
    *CUANDO* carga la pantalla,  
    *ENTONCES* el sistema muestra la lista de títulos con unidades iniciales, ventas del día y stock remanente.
  - **Escenario 2:** Aislamiento de datos entre locales.  
    *DADO QUE* el distribuidor está autenticado en su sede,  
    *CUANDO* navega en el sistema,  
    *ENTONCES* bajo ninguna circunstancia se le permite ver las cifras ni existencias de otras distribuidoras.
- **Dependencias:** HU-04, HU-07 | **Interesados:** Distribuidor

---

#### MÓDULO 3: REABASTECIMIENTO

**HU-12: Solicitud de reabastecimiento web**
- **ID:** HU-12
- **Título:** Pedido digital de reposición de existencias
- **Módulo:** M3 — Reabastecimiento
- **Prioridad MoSCoW:** Must Have | **SP:** 4 | **Release:** Release 1 (Sprint 4)
- **Estructura:** Como Distribuidor, quiero solicitar reabastecimiento desde la web para pedir libros sin tener que llamar por teléfono.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Envío de solicitud válida.  
    *DADO QUE* el distribuidor cuenta con pocas unidades en uno o más títulos,  
    *CUANDO* accede a "Solicitar Reposición", indica cantidades requeridas y presiona "Enviar Solicitud",  
    *ENTONCES* el sistema debe registrar el pedido con estado "Pendiente" y generar una notificación a Logística.
  - **Escenario 2:** Validación de cantidades.  
    *DADO QUE* el distribuidor ingresa valores iguales a cero o negativos,  
    *CUANDO* intenta pulsar "Enviar Solicitud",  
    *ENTONCES* el sistema debe bloquear el envío y requerir números enteros positivos válidos.
- **Dependencias:** HU-11, HU-13 | **Interesados:** Distribuidor, Logística

**HU-13: Revisión de ventas previas al reabastecimiento**
- **ID:** HU-13
- **Título:** Cálculo asistido de reposición por Logística
- **Módulo:** M3 — Reabastecimiento
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 4)
- **Estructura:** Como Logística, quiero revisar las ventas registradas desde la última entrega antes de viajar, para calcular con exactitud la cantidad a llevar.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Visualización del consumo de stock.  
    *DADO QUE* Logística evalúa una solicitud de reposición de una sede,  
    *CUANDO* abre el detalle del pedido,  
    *ENTONCES* el sistema calcula y muestra: unidades entregadas previamente, ventas registradas y stock remanente estimado.
  - **Escenario 2:** Sugerencia de despacho óptimo.  
    *DADO QUE* se analizan las ventas del período,  
    *CUANDO* Logística genera la orden de salida,  
    *ENTONCES* el sistema propone una sugerencia de reposición basada en la demanda observada.
- **Dependencias:** HU-06, HU-07, HU-12 | **Interesados:** Logística, Distribuidor

**HU-14: Registro del reabastecimiento efectuado**
- **ID:** HU-14
- **Título:** Confirmación de reabastecimiento entregado
- **Módulo:** M3 — Reabastecimiento
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 4)
- **Estructura:** Como Logística, quiero registrar el reabastecimiento entregado para actualizar el saldo en consignación de la distribuidora.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro exitoso de reposición.  
    *DADO QUE* Logística efectúa la entrega física de libros en el local,  
    *CUANDO* registra los títulos y cantidades entregadas,  
    *ENTONCES* el sistema suma las unidades al stock del local y marca la solicitud previa como "Completada".
  - **Escenario 2:** Historial de reabastecimientos.  
    *DADO QUE* el Administrador consulta el historial,  
    *CUANDO* filtra por distribuidora y rango de fechas,  
    *ENTONCES* el sistema lista todos los reabastecimientos realizados con fechas, unidades y responsables.
- **Dependencias:** HU-04, HU-13 | **Interesados:** Logística, Distribuidor, Administrador

---

#### MÓDULO 4: CONTROL DE INVENTARIO Y ALMACÉN

**HU-15: Movimientos especiales de inventario**
- **ID:** HU-15
- **Título:** Registro de salidas no comerciales justificadas
- **Módulo:** M4 — Control de inventario
- **Prioridad MoSCoW:** Must Have | **SP:** 6 | **Release:** Release 1 (Sprint 2)
- **Estructura:** Como Logística, quiero registrar salidas no comerciales (docentes, sorteos, cortesías, mermas o pérdidas) con justificación obligatoria para justificar las bajas de stock.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro con justificación completa.  
    *DADO QUE* se retira un libro sin generar venta directa,  
    *CUANDO* Logística selecciona el tipo de salida, ingresa el motivo formal detallado y confirma,  
    *ENTONCES* el sistema descuenta la unidad del kardex registrando fecha, hora, motivo y usuario autorizador.
  - **Escenario 2:** Rechazo por motivo ausente.  
    *DADO QUE* el campo "Motivo / Justificación" se encuentra vacío,  
    *CUANDO* se intenta procesar la salida,  
    *ENTONCES* el sistema bloquea la operación y exige ingresar el motivo.
- **Dependencias:** HU-04, HU-16 | **Interesados:** Logística, Administrador

**HU-16: Alertas automáticas de stock crítico**
- **ID:** HU-16
- **Título:** Indicadores visuales de stock mínimo
- **Módulo:** M4 — Control de inventario
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 2)
- **Estructura:** Como Logística, quiero recibir alertas visuales cuando una sucursal baje del umbral mínimo de existencias para anticipar la reposición.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Activación de alerta.  
    *DADO QUE* el stock de un libro en una sede llega a 3 unidades o menos,  
    *CUANDO* el inventario se actualiza,  
    *ENTONCES* el sistema genera una alerta en rojo en el panel de Logística y Administrador.
  - **Escenario 2:** Desactivación tras reposición.  
    *DADO QUE* la distribuidora recibe nuevo stock que supera el umbral mínimo,  
    *CUANDO* se registra la entrega,  
    *ENTONCES* la alerta de stock crítico se desactiva automáticamente.
- **Dependencias:** HU-06, HU-14 | **Interesados:** Logística, Administrador

**HU-17: Ranking de sucursales por ventas**
- **ID:** HU-17
- **Título:** Ranking de sucursales por ventas
- **Módulo:** M4 — Control de inventario
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Logística, quiero visualizar un ranking de sucursales según volumen de ventas para priorizar la distribución y reposición de stock.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Visualización de ranking por período.  
    *DADO QUE* Logística accede a estadísticas de inventario,  
    *CUANDO* selecciona un rango de fechas,  
    *ENTONCES* el sistema muestra la lista de sucursales ordenadas de mayor a menor número de libros vendidos.
  - **Escenario 2:** Detalle por título vendido.  
    *DADO QUE* Logística selecciona una sucursal del ranking,  
    *CUANDO* hace clic en ver detalle,  
    *ENTONCES* el sistema desglosa los títulos y cantidades vendidas en dicha sede.
- **Dependencias:** HU-07, HU-02 | **Interesados:** Logística, Administrador

**HU-18: Registro de lotes recepcionados de imprenta**
- **ID:** HU-18
- **Título:** Registro de producción y entrega de proveedor
- **Módulo:** M4 — Control de inventario
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Logística, quiero registrar los lotes de libros entregados por el proveedor de imprenta para sumar las unidades al inventario del almacén central.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Ingreso exitoso de lote de producción.  
    *DADO QUE* el proveedor de imprenta entrega un nuevo lote de libros,  
    *CUANDO* Logística registra título, cantidad recibida y número de comprobante del proveedor,  
    *ENTONCES* el sistema suma las unidades al inventario central y guarda el registro con fecha y hora.
  - **Escenario 2:** Identificación de ejemplares con defectos.  
    *DADO QUE* se detectan ejemplares con fallas de impresión en el lote recibido,  
    *CUANDO* Logística ingresa la cantidad defectuosa,  
    *ENTONCES* el sistema separa dichas unidades en estado "Merma de recepción" sin cargarlas al stock disponible.
- **Dependencias:** HU-06 | **Interesados:** Logística, Administrador

---

#### MÓDULO 5: LIQUIDACIÓN Y CONTROL DE DINERO

**HU-19: Cálculo de liquidación por comisión fija**
- **ID:** HU-19
- **Título:** Conciliación automática de ventas y comisiones
- **Módulo:** M5 — Liquidación
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 5)
- **Estructura:** Como Logística, quiero que el sistema calcule el monto total a entregar deduciendo la comisión fija monetaria por libro para agilizar la liquidación.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Liquidación automática sin errores.  
    *DADO QUE* existen ventas registradas en un período para una distribuidora,  
    *CUANDO* Logística genera la liquidación quincenal,  
    *ENTONCES* el sistema calcula: Ingresos Brutos = Σ(Precio × Unidades), Comisión Retenida = Σ(Comisión Fija × Unidades), Saldo Neto a Entregar a QSY = Ingresos Brutos − Comisión, desglosado por título.
  - **Escenario 2:** Identificación de diferencias.  
    *DADO QUE* el dinero entregado por el distribuidor no coincide con el saldo calculado por el sistema,  
    *CUANDO* Logística registra el importe recibido,  
    *ENTONCES* el sistema documenta la diferencia (faltante/sobrante) y solicita abrir una incidencia de recuento.
- **Dependencias:** HU-07, HU-22 | **Interesados:** Logística, Administrador, Distribuidor

**HU-20: Registro histórico de liquidación**
- **ID:** HU-20
- **Título:** Registro de liquidación periódica y comprobante de pago
- **Módulo:** M5 — Liquidación
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Logística, quiero registrar el pago de la liquidación quincenal o mensual para mantener el control y cierre financiero de cada sede.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Cierre de liquidación pagada.  
    *DADO QUE* se calculó el saldo a entregar y el distribuidor entrega el dinero o voucher,  
    *CUANDO* Logística ingresa el monto cobrado y confirma el pago,  
    *ENTONCES* el sistema registra la liquidación como "Pagada", asociando fecha, hora y comprobante de depósito.
  - **Escenario 2:** Historial de liquidaciones por sede.  
    *DADO QUE* se consulta el historial financiero de una distribuidora,  
    *CUANDO* se accede a la bitácora de liquidaciones,  
    *ENTONCES* el sistema despliega todas las liquidaciones anteriores con sus estados (Pagado/Pendiente) e importes.
- **Dependencias:** HU-19 | **Interesados:** Logística, Administrador

**HU-21: Estado de cuenta y deudas por libros**
- **ID:** HU-21
- **Título:** Monitoreo de pagos pendientes por libros en consignación
- **Módulo:** M5 — Liquidación
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Administrador, quiero visualizar si una distribuidora ya pagó por los libros vendidos o si mantiene saldos pendientes para controlar cobranzas.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Visualización de saldo deudor.  
    *DADO QUE* el Administrador accede al módulo de liquidaciones,  
    *CUANDO* selecciona una distribuidora con pagos vencidos,  
    *ENTONCES* el sistema muestra el total acumulado pendiente y los días transcurridos desde el corte.
  - **Escenario 2:** Consolidado de cuentas por cobrar.  
    *DADO QUE* el Administrador solicita el resumen global,  
    *CUANDO* aplica el filtro "Cuentas Pendientes",  
    *ENTONCES* el sistema totaliza el monto adeudado a la editorial por el conjunto de distribuidoras.
- **Dependencias:** HU-19, HU-20 | **Interesados:** Administrador

**HU-35: Panel consolidado de finanzas y ganancias**
- **ID:** HU-35
- **Título:** Panel de rentabilidad y comisiones
- **Módulo:** M5 — Liquidación y finanzas
- **Prioridad MoSCoW:** Could Have | **SP:** 7 | **Release:** Release 2.0 (Segunda etapa)
- **Estructura:** Como Administrador, quiero un panel consolidado de finanzas para visualizar ingresos netos de QSY, comisiones pagadas a distribuidoras y márgenes por producto.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Filtro temporal de rentabilidad.  
    *DADO QUE* el Administrador accede a la sección de Finanzas y selecciona un mes,  
    *CUANDO* presiona "Calcular Márgenes",  
    *ENTONCES* el sistema despliega el total facturado, total de comisiones liquidadas y margen neto de la editorial.
  - **Escenario 2:** Comparativa por distribuidora.  
    *DADO QUE* se analizan los locales,  
    *CUANDO* se solicita el desglose por sede,  
    *ENTONCES* el sistema muestra el aporte porcentual de cada distribuidora a los ingresos globales.
- **Dependencias:** HU-19, HU-20 | **Interesados:** Administrador

---

#### MÓDULO 6: BOLETAS Y COMPROBANTES

**HU-22: Registro de número de boleta por venta**
- **ID:** HU-22
- **Título:** Asociación de boleta física correlativa
- **Módulo:** M6 — Boletas y comprobantes
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 4)
- **Estructura:** Como Distribuidor, quiero registrar el número de la boleta física entregada en cada venta para garantizar la correspondencia legal.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Correlativo válido en rango.  
    *DADO QUE* el vendedor ingresa un número de boleta perteneciente al talonario asignado a su sede,  
    *CUANDO* guarda la venta,  
    *ENTONCES* el sistema valida la pertenencia al rango, vincula el comprobante y marca dicho correlativo como utilizado.
  - **Escenario 2:** Correlativo duplicado o fuera de rango.  
    *DADO QUE* el número ingresado ya fue utilizado previamente o pertenece a otro talonario,  
    *CUANDO* se intenta confirmar,  
    *ENTONCES* el sistema bloquea la transacción y muestra el error "Número de boleta no válido o ya registrado".
- **Dependencias:** HU-07, HU-23 | **Interesados:** Distribuidor, Logística, Administrador

**HU-23: Asignación de boleteros a distribuidoras**
- **ID:** HU-23
- **Título:** Control y asignación de rangos de talonarios
- **Módulo:** M6 — Boletas y comprobantes
- **Prioridad MoSCoW:** Must Have | **SP:** 3 | **Release:** Release 1 (Sprint 5)
- **Estructura:** Como Logística, quiero registrar los rangos de boletas entregadas a cada distribuidora (2 talonarios de 100) para controlar el consumo de comprobantes.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro de talonario nuevo.  
    *DADO QUE* Logística entrega talonarios a una sede,  
    *CUANDO* ingresa la distribuidora, serie, número inicial y número final (ej. 0001 al 0200),  
    *ENTONCES* el sistema guarda la asignación y la habilita para su consumo en las ventas de dicha sede.
  - **Escenario 2:** Alerta de talonario por agotarse.  
    *DADO QUE* una distribuidora ha consumido el 90% de sus boletas asignadas,  
    *CUANDO* el distribuidor registra una venta,  
    *ENTONCES* el sistema emite una alerta a Logística notificando "Talonario próximo a agotarse".
- **Dependencias:** HU-02, HU-22 | **Interesados:** Logística, Distribuidor, Administrador

**HU-24: Trazabilidad de boleta por distribuidor**
- **ID:** HU-24
- **Título:** Identificación de distribuidor emisor de comprobante
- **Módulo:** M6 — Boletas y comprobantes
- **Prioridad MoSCoW:** Should Have | **SP:** 3 | **Release:** Release 1.1
- **Estructura:** Como Administrador, quiero consultar qué distribuidor emitió una boleta específica para identificar responsables ante quejas o errores.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Búsqueda por número de boleta.  
    *DADO QUE* se ingresa el número correlativo de una boleta,  
    *CUANDO* se ejecuta la búsqueda,  
    *ENTONCES* el sistema muestra la distribuidora emisora, el vendedor asignado, fecha, hora, estudiante y título vendido.
  - **Escenario 2:** Reporte de boletas por distribuidora.  
    *DADO QUE* se audita a una sede,  
    *CUANDO* se filtra por distribuidor y rango de fechas,  
    *ENTONCES* el sistema lista la totalidad de correlativos emitidos y anulados en dicho período.
- **Dependencias:** HU-22, HU-23 | **Interesados:** Administrador

**HU-25: Corrección o anulación de venta con justificación**
- **ID:** HU-25
- **Título:** Anulación auditada de transacciones
- **Módulo:** M6 — Boletas y comprobantes
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Distribuidor, quiero solicitar la corrección o anulación de una venta registrando una justificación obligatoria con fecha y hora para mantener la integridad contable.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Anulación con justificación válida.  
    *DADO QUE* una venta fue registrada por error de digitación o título equivocado,  
    *CUANDO* el vendedor o Logística selecciona "Anular Venta", redacta el motivo formal y confirma,  
    *ENTONCES* el sistema anula la transacción, reintegra la unidad al inventario local y registra el motivo, usuario y marca de tiempo en el log de auditoría.
  - **Escenario 2:** Bloqueo ante omisión de justificación.  
    *DADO QUE* se intenta anular una venta sin ingresar texto en el campo de justificación,  
    *CUANDO* se pulsa confirmar,  
    *ENTONCES* el sistema bloquea la acción y muestra la advertencia "La justificación es obligatoria según las políticas de QSY".
- **Dependencias:** HU-07, HU-22 | **Interesados:** Distribuidor, Logística, Administrador

---

#### MÓDULO 7: DASHBOARD GERENCIAL Y REPORTES

**HU-26: Dashboard de ventas por sucursal**
- **ID:** HU-26
- **Título:** Gráfico interactivo de ventas por sede
- **Módulo:** M7 — Dashboard
- **Prioridad MoSCoW:** Must Have | **SP:** 4 | **Release:** Release 1 (Sprint 5)
- **Estructura:** Como Administrador, quiero ver un gráfico con las ventas de cada distribuidora al ingresar al sistema para monitorear el desempeño del negocio.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Carga del panel principal.  
    *DADO QUE* el Administrador inicia sesión en el sistema,  
    *CUANDO* ingresa a la vista principal,  
    *ENTONCES* el sistema muestra un gráfico de barras comparativo con el volumen de ventas del mes por cada una de las 3 distribuidoras.
  - **Escenario 2:** Actualización por filtro de fechas.  
    *DADO QUE* el Administrador selecciona un rango específico de fechas,  
    *CUANDO* aplica el filtro,  
    *ENTONCES* los gráficos y métricas del dashboard se recalculan en tiempo real.
- **Dependencias:** HU-07, HU-02 | **Interesados:** Administrador

**HU-27: Total de libros vendidos por mes y por día**
- **ID:** HU-27
- **Título:** Métricas temporales de volumen de ventas
- **Módulo:** M7 — Dashboard
- **Prioridad MoSCoW:** Must Have | **SP:** 4 | **Release:** Release 1 (Sprint 5)
- **Estructura:** Como Administrador, quiero visualizar el total de libros vendidos en el mes y por día para identificar picos de demanda.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Visualización de métricas del día.  
    *DADO QUE* el Administrador consulta el dashboard,  
    *CUANDO* visualiza la tarjeta de métricas clave,  
    *ENTONCES* el sistema muestra el contador exacto de libros vendidos en la jornada actual y el acumulado del mes en curso.
  - **Escenario 2:** Tendencia histórica.  
    *DADO QUE* se requiere analizar tendencias,  
    *CUANDO* el Administrador selecciona "Ver Tendencia Diaria",  
    *ENTONCES* el sistema despliega un gráfico de línea con la evolución de ventas diarias de los últimos 30 días.
- **Dependencias:** HU-07 | **Interesados:** Administrador

**HU-28: Vista de sucursales con menor stock**
- **ID:** HU-28
- **Título:** Panel de monitoreo de sedes en riesgo de desabastecimiento
- **Módulo:** M7 — Dashboard
- **Prioridad MoSCoW:** Must Have | **SP:** 4 | **Release:** Release 1 (Sprint 5)
- **Estructura:** Como Administrador, quiero identificar rápidamente qué distribuidoras cuentan con menos ejemplares para priorizar el reabastecimiento.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Lista de sedes críticas.  
    *DADO QUE* el Administrador visualiza el dashboard,  
    *CUANDO* examina la sección "Disponibilidad por Sede",  
    *ENTONCES* el sistema lista las sucursales ordenadas de menor a mayor disponibilidad total de libros.
  - **Escenario 2:** Detalle por título crítico.  
    *DADO QUE* el Administrador hace clic sobre una distribuidora listada,  
    *CUANDO* se expande el panel,  
    *ENTONCES* el sistema muestra exactamente qué títulos están en nivel crítico en dicho punto de venta.
- **Dependencias:** HU-06, HU-16 | **Interesados:** Administrador, Logística

**HU-29: Libros más vendidos por categoría y fecha**
- **ID:** HU-29
- **Título:** Análisis de rotación de títulos y niveles
- **Módulo:** M7 — Dashboard
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Administrador, quiero visualizar cuáles son los títulos y niveles más vendidos por período para orientar las órdenes de reimpresión.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Ranking de productos.  
    *DADO QUE* el Administrador consulta el módulo de ventas,  
    *CUANDO* selecciona un intervalo mensual,  
    *ENTONCES* el sistema muestra el ranking de libros ordenados por unidades vendidas e ingresos generados.
  - **Escenario 2:** Comparativa por nivel educativo.  
    *DADO QUE* se analiza la demanda,  
    *CUANDO* se filtra por categoría (Básico, Intermedio, Avanzado, Médico),  
    *ENTONCES* el sistema grafica la distribución porcentual de ventas por cada segmento.
- **Dependencias:** HU-07, HU-03 | **Interesados:** Administrador

**HU-30: Búsqueda de compras por DNI del estudiante**
- **ID:** HU-30
- **Título:** Consulta histórica de compras por documento de identidad
- **Módulo:** M7 — Dashboard
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Administrador, quiero buscar las compras de un estudiante mediante su DNI para comprobar la validez de transacciones y atender reclamos.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Búsqueda exitosa con compras previas.  
    *DADO QUE* un cliente solicita atención o duplicado,  
    *CUANDO* el Administrador o Soporte ingresa el DNI del estudiante,  
    *ENTONCES* el sistema despliega el historial completo de sus adquisiciones, mostrando fecha, hora, distribuidora donde compró, título y número de boleta.
  - **Escenario 2:** DNI sin registros.  
    *DADO QUE* se ingresa un DNI que no registra compras en ninguna sede,  
    *CUANDO* se ejecuta la consulta,  
    *ENTONCES* el sistema informa "No se encontraron compras asociadas a este DNI".
- **Dependencias:** HU-07, HU-10 | **Interesados:** Administrador, Soporte

---

#### MÓDULO 8: ADMINISTRACIÓN DE USUARIOS Y CATÁLOGO

**HU-01: Autenticación y control de acceso basado en roles (RBAC)**
- **ID:** HU-01
- **Título:** Seguridad de usuarios y permisos
- **Módulo:** M8 — Administración
- **Prioridad MoSCoW:** Must Have | **SP:** 8 | **Release:** Release 1 (Sprint 1)
- **Estructura:** Como Administrador, quiero autenticar usuarios y asignar roles (Administrador, Logística, Distribuidor, Soporte) para asegurar el acceso controlado a los módulos.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Acceso autorizado por rol.  
    *DADO QUE* un usuario ingresa credenciales válidas correspondientes al rol Distribuidor,  
    *CUANDO* el sistema lo autentica,  
    *ENTONCES* le permite acceder únicamente a los módulos de venta, stock local y pedidos de reposición de su sede, bloqueando dashboards y catálogos de precios.
  - **Escenario 2:** Intento de acceso no autorizado.  
    *DADO QUE* un distribuidor intenta acceder por URL directa al módulo de finanzas o precios,  
    *CUANDO* el sistema verifica permisos,  
    *ENTONCES* deniega el acceso, muestra error 403 ("Acceso Denegado") y registra el evento en el log de seguridad.
- **Dependencias:** Ninguna | **Interesados:** Administrador, Todos

**HU-02: Registro y administración de distribuidores**
- **ID:** HU-02
- **Título:** Gestión del padrón de locales distribuidores
- **Módulo:** M8 — Administración
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 1)
- **Estructura:** Como Administrador, quiero registrar nuevas distribuidoras asociando nombre, dirección, correo y responsables para mantener el padrón actualizado.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Alta de distribuidora conforme.  
    *DADO QUE* el Administrador registra los datos de un nuevo local comercial aliado,  
    *CUANDO* guarda la información,  
    *ENTONCES* el sistema crea la sede, genera su identificador unívoco y permite asignarle usuarios de ventas.
  - **Escenario 2:** Validación de duplicidad.  
    *DADO QUE* se intenta registrar un correo o nombre de sede ya existente,  
    *CUANDO* se presiona guardar,  
    *ENTONCES* el sistema alerta sobre la duplicidad y solicita modificar los datos.
- **Dependencias:** HU-01 | **Interesados:** Administrador, Distribuidores

**HU-03: Catálogo de libros y gestión de precios**
- **ID:** HU-03
- **Título:** Mantenimiento de publicaciones, precios y comisiones
- **Módulo:** M8 — Administración
- **Prioridad MoSCoW:** Must Have | **SP:** 5 | **Release:** Release 1 (Sprint 1)
- **Estructura:** Como Administrador, quiero dar de alta libros y configurar precios de venta al público y comisiones fijas para mantener el catálogo centralizado.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro de nuevo título.  
    *DADO QUE* el Administrador registra un producto (ej. Quechua Médico, Nivel Básico),  
    *CUANDO* ingresa código, título, precio de venta (S/) y comisión fija por unidad (S/) y guarda,  
    *ENTONCES* el libro queda activo e inmediatamente visible para distribución y venta.
  - **Escenario 2:** Modificación de precio con auditoría.  
    *DADO QUE* el Administrador actualiza el precio de un producto,  
    *CUANDO* confirma el cambio,  
    *ENTONCES* el nuevo precio aplica para ventas futuras, sin alterar transacciones ni liquidaciones pasadas, registrando fecha y usuario en el log.
- **Dependencias:** HU-01 | **Interesados:** Administrador

---

#### MÓDULO 9: ENVÍOS A PROVINCIA Y VENTAS VIRTUALES

**HU-33: Registro de envíos a provincia con guía Shalom**
- **ID:** HU-33
- **Título:** Control y seguimiento de compras interregionales
- **Módulo:** M9 — Envíos a provincia
- **Prioridad MoSCoW:** Could Have | **SP:** 8 | **Release:** Release 2.0 (Segunda etapa)
- **Estructura:** Como Soporte, quiero registrar pedidos virtuales con destino a provincia, número de guía de transporte Shalom y destinatario para asegurar su trazabilidad.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Registro completo de envío interregional.  
    *DADO QUE* un cliente de provincia coordinó su compra por WhatsApp,  
    *CUANDO* Soporte ingresa DNI, nombres, celular, departamento, agencia Shalom más cercana, código de depósito Yape y número de guía de transporte,  
    *ENTONCES* el sistema registra el pedido en estado "Enviado", descuenta el libro del inventario central y genera el registro de despacho.
  - **Escenario 2:** Consulta de estado de envío.  
    *DADO QUE* el cliente consulta por el estado de su encomienda,  
    *CUANDO* Soporte busca por DNI o número de guía,  
    *ENTONCES* el sistema despliega el estado actual del envío, fecha de entrega a la agencia y datos de la sucursal de transporte.
- **Dependencias:** HU-07, HU-10 | **Interesados:** Soporte, Administrador, Cliente

**HU-34: Emisión y envío digital de boleta para compras de provincia**
- **ID:** HU-34
- **Título:** Generación de comprobante electrónico para compras virtuales
- **Módulo:** M9 — Envíos a provincia
- **Prioridad MoSCoW:** Could Have | **SP:** 5 | **Release:** Release 2.0 (Segunda etapa)
- **Estructura:** Como Soporte, quiero emitir la boleta electrónica correspondiente a un envío a provincia y remitirla al WhatsApp del cliente para formalizar la transacción.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Emisión y envío automático por WhatsApp.  
    *DADO QUE* se confirma el depósito bancario de una compra de provincia,  
    *CUANDO* Soporte presiona "Emitir y Despachar Comprobante",  
    *ENTONCES* el sistema genera la boleta electrónica asociada, timbra con el servicio de SUNAT y remite el enlace del comprobante al WhatsApp del cliente.
  - **Escenario 2:** Reenvío ante solicitud del comprador.  
    *DADO QUE* el comprador solicita nuevamente su comprobante,  
    *CUANDO* Soporte pulsa "Reenviar Boleta",  
    *ENTONCES* el sistema despacha nuevamente el documento digital sin generar duplicidades fiscales.
- **Dependencias:** HU-33, HU-22 | **Interesados:** Soporte, Cliente

---

#### MÓDULO 10: RECLAMOS Y TRAZABILIDAD DE CLIENTES

**HU-31: Búsqueda de venta para atención de reclamos**
- **ID:** HU-31
- **Título:** Localización de transacciones por múltiples criterios
- **Módulo:** M10 — Reclamos y trazabilidad
- **Prioridad MoSCoW:** Should Have | **SP:** 5 | **Release:** Release 1.1
- **Estructura:** Como Soporte, quiero buscar ventas por DNI, código de libro o boleta para verificar la autenticidad de un reclamo de un estudiante.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Verificación de libro nuevo por reclamo de imprenta.  
    *DADO QUE* un estudiante reporta una falla de encuadernación y no conserva su boleta física,  
    *CUANDO* Soporte busca por su DNI o por el código impreso del libro,  
    *ENTONCES* el sistema recupera la fecha de venta, local de adquisición y confirma si el ejemplar fue vendido por QSY y no ha sido reclamado antes.
  - **Escenario 2:** Registro no existente.  
    *DADO QUE* los datos no coinciden con ninguna transacción registrada en los últimos 2 años,  
    *CUANDO* se ejecuta la búsqueda,  
    *ENTONCES* el sistema muestra "Venta no verificada" y sugiere solicitar evidencia complementaria.
- **Dependencias:** HU-07, HU-10, HU-22 | **Interesados:** Soporte, Administrador

**HU-32: Registro estructurado y seguimiento de reclamos**
- **ID:** HU-32
- **Título:** Gestión de incidencias, cambios y devoluciones
- **Módulo:** M10 — Reclamos y trazabilidad
- **Prioridad MoSCoW:** Could Have | **SP:** 5 | **Release:** Release 2.0 (Segunda etapa)
- **Estructura:** Como Soporte, quiero registrar incidencias y reclamos de clientes con seguimiento de estado (Abierto, En Revisión, Resuelto, Rechazado) para asegurar la satisfacción del cliente.
- **Criterios de Aceptación (Gherkin):**
  - **Escenario 1:** Apertura de incidencia por falla de imprenta.  
    *DADO QUE* se comprueba que un libro presenta defectos de origen,  
    *CUANDO* Soporte registra el reclamo adjuntando motivo y venta asociada,  
    *ENTONCES* el sistema crea la incidencia con código único y estado "Abierto", notificando a Logística central para el recambio físico.
  - **Escenario 2:** Cierre de reclamo con cambio de ejemplar.  
    *DADO QUE* se entrega un nuevo libro al estudiante en sustitución del dañado,  
    *CUANDO* Soporte actualiza el estado a "Resuelto",  
    *ENTONCES* el sistema registra la baja del ejemplar defectuoso como merma justificada y cierra el ticket.
- **Dependencias:** HU-31 | **Interesados:** Soporte, Administrador, Cliente

---

### Definition of Ready (DoR) del Equipo

Para que una Historia de Usuario sea admitida formalmente en un Sprint durante el Sprint Planning, debe cumplir estrictamente con los 9 criterios de la Definition of Ready (DoR):

| N.° | Criterio DoR | Descripción / Validación | Cumplimiento |
|---|---|---|---|
| **1** | **Estructura estándar** | Redactada bajo el formato *Como [rol] / Quiero [funcionalidad] / Para [beneficio]*. | Sí |
| **2** | **Criterios de Aceptación Gherkin** | Contiene al menos dos escenarios redactados en formato *DADO QUE / CUANDO / ENTONCES*. | Sí |
| **3** | **Estimación en Story Points** | Ha sido estimada de forma consensuada por el equipo mediante Planning Poker en la serie de Fibonacci. | Sí |
| **4** | **Dependencias e Interesados** | Identifica claramente sus dependencias técnicas previas y los stakeholders receptores de valor. | Sí |
| **5** | **Diseño Mobile-First / Wireframe** | Se cuenta con el prototipo de interfaz adaptado a teléfonos celulares para historias operativas de distribuidores. | Sí |
| **6** | **Criterios INVEST** | La historia es Independiente, Negociable, Valiosa, Estimable, Pequeña (Small) y Testeable. | Sí |
| **7** | **Priorización MoSCoW** | Clasificada explícitamente en Must Have, Should Have o Could Have dentro del Product Backlog. | Sí |
| **8** | **Tolerancia Offline definida** | Para historias de venta presencial, especifica explícitamente el comportamiento ante caída de red móvil. | Sí |
| **9** | **Alineamiento con Reglas de Negocio QSY** | Respeta la política de stock estricto, inmutabilidad de precios por distribuidores y comisión fija deducible. | Sí |

---

### Resumen Consolidado de Estimación y Planificación Ágil

| Dimensión de Planificación | Alcance del MVP (Release 1 - Semestre) | Alcance Total del Product Backlog |
|---|---|---|
| **Número de Historias de Usuario** | **22 Historias (Must Have)** | **35 Historias (Catálogo Completo)** |
| **Puntos de Historia Totales (SP)** | **110 SP** | **178 SP** |
| **Duración del Desarrollo** | **10 semanas efectivas (Semanas 06 a 15)** | **Alineado a fases posteriores (Año siguiente)** |
| **Número de Sprints** | **5 Sprints de 2 semanas** | **Fases evolutivas (Release 1.1 y 2.0)** |
| **Velocidad Promedio por Sprint** | **22 SP / Sprint** | — |
| **Horas-Hombre de Desarrollo** | **1,150 horas-hombre** | — |
| **Presupuesto Base del Proyecto** | **S/ 31,657.50** | — |
| **Alineamiento con el Cliente** | Puesta en marcha del núcleo comercial y de control | Expansión a provincias y módulo de finanzas avanzado |

---

## II. CUESTIONARIO

### 1. ¿Qué es el mapeo de procesos y para qué sirve en la ingeniería de software?

El mapeo de procesos es una técnica de modelado y análisis organizacional que permite representar gráficamente, mediante notaciones estandarizadas como BPMN (*Business Process Model and Notation*), el flujo secuencial y lógico de actividades, eventos, decisiones, compuertas, recursos y responsables que componen un proceso de negocio.

En la ingeniería de software, el mapeo de procesos constituye el puente fundamental entre el dominio del problema y el diseño de la solución tecnológica. Sirve para:
- Comprender con rigor el funcionamiento real de la organización sin sesgos subjetivos.
- Detectar oportunamente ineficiencias operacionales como cuellos de botella, redundancias, pasos que no añaden valor, tiempos muertos y puntos críticos de error humano.
- Delimitar con exactitud las fronteras del software, definiendo qué actividades serán automatizadas por el sistema, cuáles asistidas y cuáles se mantendrán manuales.
- Establecer indicadores cuantitativos de línea base para comparar la eficiencia antes y después de la implantación del sistema.

---

### 2. ¿Cuál es la diferencia fundamental entre el proceso AS-IS y el proceso TO-BE?

La diferencia radica en el estado temporal y el propósito de optimización del proceso:

- **Proceso AS-IS (Estado Actual):** Modela la realidad operativa de la organización en el momento del levantamiento de información, documentando los procedimientos tal y como se ejecutan en el presente, con todas sus limitaciones, cuellos de botella, registros manuales y falta de integración. Su objetivo es diagnosticar el problema y evidenciar las causas raíz de las ineficiencias (en el caso de QSY: cuadernos duplicados, demoras de 1 hora en liquidación y boletas físicas perdidas).
- **Proceso TO-BE (Estado Propuesto / Futuro):** Modela el proceso rediseñado y optimizado a partir de la incorporación de la solución tecnológica de software. Muestra de forma transparente cómo el sistema automatiza tareas, agiliza la comunicación interdepartamental, elimina redundancias y garantiza la consistencia de los datos (en QSY: venta rápida en celular en menos de 2 minutos, liquidación automatizada en 10 minutos y operación tolerante a fallos de internet).

---

### 3. ¿Quiénes son los stakeholders en un proyecto de software y cómo se clasifican?

Los stakeholders o interesados son todas aquellas personas, grupos u organizaciones que participan activamente en el proyecto, o cuyos intereses pueden verse afectados positiva o negativamente por la ejecución, decisiones o resultados del proyecto de software (PMBOK Guide 7.ª edición).

Se clasifican tradicionalmente en dos grandes categorías:
1. **Interesados Internos:** Aquellos que forman parte de la estructura organizativa de la empresa o del equipo de ejecución (ej. Administrador General, Encargado de Logística, Sucursal Virtual de Soporte y el Equipo de Desarrollo de Software).
2. **Interesados Externos:** Entidades o individuos ajenos a la organización pero con los que el sistema interactúa de forma directa o indirecta (ej. Distribuidores aliados de puntos de venta, Estudiantes compradores, Proveedor de imprenta, Shalom como transportista, pasarelas de pago como Yape y organismos reguladores como SUNAT).

---

### 4. ¿Qué criterios y dimensiones se utilizan en la Matriz Poder vs. Interés para clasificar a los interesados?

La Matriz Poder vs. Interés clasifica a los stakeholders a lo largo de dos dimensiones estratégicas independientes:

- **Nivel de Poder (Influencia / Autoridad):** Representa la capacidad que tiene el interesado para tomar decisiones vinculantes, aprobar presupuestos, modificar el alcance del proyecto o paralizar su ejecución técnica y comercial.
- **Nivel de Interés (Afectación / Compromiso):** Representa el grado en que el interesado se ve impactado por el sistema, el beneficio directo que espera obtener o su dependencia diaria del software para trabajar.

De la intersección de estas dos dimensiones se derivan cuatro cuadrantes con estrategias de gestión diferenciadas:
1. **Alto Poder / Alto Interés (Gestionar de Cerca):** Interesados clave que requieren comunicación constante, participación activa y validación continua (ej. Gerente General, Logística y Distribuidores).
2. **Alto Poder / Bajo Interés (Mantener Satisfecho):** Poseen autoridad contractual o legal; requieren cumplir sus condiciones sin saturarlos con detalles técnicos diarios (ej. SUNAT, Imprenta, Shalom).
3. **Bajo Poder / Alto Interés (Mantener Informado):** Altamente impactados por el sistema; se les debe consultar requisitos y mantener actualizados sobre los avances (ej. Soporte y Estudiantes).
4. **Bajo Poder / Bajo Interés (Monitorear):** Requieren mínimo esfuerzo de comunicación, observando si sus condiciones cambian durante el proyecto (ej. Soporte TI).

---

### 5. ¿Por qué es crítico gestionar adecuadamente a los interesados desde las fases tempranas del ciclo de vida del software?

La gestión proactiva de interesados resulta crítica por las siguientes razones de ingeniería y gestión de proyectos:
- **Reducción de la resistencia al cambio:** Involucrar a los usuarios finales (como los distribuidores de QSY) desde el diseño evita que perciban al software como una imposición o una carga de trabajo, garantizando que adopten el sistema y abandonen el cuaderno físico.
- **Alineamiento de expectativas:** Permite calibrar la brecha entre lo que el cliente imagina y lo que es técnica y económicamente viable desarrollar dentro del presupuesto y cronograma pactados.
- **Calidad y completitud de requisitos:** La captura temprana de restricciones reales del negocio —tales como la inestabilidad de la señal móvil o la necesidad de consultar reclamos por DNI— solo se logra escuchando a los involucrados directos.
- **Garantía de patrocinio:** Mantiene comprometida a la gerencia en la asignación de recursos y toma oportuna de decisiones de alcance.

---

### 6. ¿Qué riesgos y consecuencias enfrenta un proyecto de software si se ignoran o gestionan deficientemente a los stakeholders?

Omitir la gestión adecuada de los interesados conlleva severos riesgos que típicamente desencadenan el fracaso del proyecto:
1. **Rechazo operativo y "sistemas paralelos":** Si los distribuidores sienten que la aplicación móvil es lenta o compleja, continuarán anotando en sus cuadernos y no registrarán las transacciones, convirtiendo la base de datos central en información obsoleta.
2. **Desviaciones críticas de alcance (*Scope Creep*):** No gestionar las expectativas del gerente propicia que se soliciten constantes cambios a última hora sin presupuesto ni tiempo adicional.
3. **Pérdida de patrocinio financiero:** Si la alta dirección no percibe valor en entregas intermedias (Sprint Reviews), puede suspender el financiamiento del proyecto.
4. **Riesgos legales y regulatorios:** Ignorar requerimientos normativos (ej. estándares de comprobantes de SUNAT) puede ocasionar sanciones y la imposibilidad de operar legalmente.
5. **Sobrecostos por retrabajo:** Modificar una arquitectura en fases avanzadas de desarrollo debido a un requisito omitido cuesta hasta 10 veces más que haberlo detectado e incorporado en las fases iniciales de planificación.

---

## III. CONCLUSIONES

1. **Impacto cuantitativo del rediseño de procesos (TO-BE vs. AS-IS):** El modelado de procesos demostró que la digitalización y automatización de validaciones reduce sustancialmente los cuellos de botella de la editorial QSY. Los indicadores proyectan una reducción del tiempo de venta presencial de 5 a menos de 2 minutos, la consulta de ventas por local de 30 minutos a segundos, y el proceso de liquidación periódica —catalogado por el cliente como el más costoso— de 1 hora a solo 10 minutos mediante el cálculo automático de comisiones fijas monetarias.
2. **Mitigación del riesgo de adopción mediante el análisis de interesados:** La matriz Poder vs. Interés permitió identificar que los distribuidores en los puntos de venta, a pesar de ser aliados externos, constituyen el stakeholder más crítico para el éxito del sistema (Alto Poder / Alto Interés). Diseñar bajo un enfoque mobile-first y dotar a la aplicación de tolerancia a redes inestables con almacenamiento offline local (IndexedDB) responde directamente a sus condiciones de trabajo, eliminando la tentación de retornar a los registros paralelos en cuaderno.
3. **Consistencia metodológica en la planificación ágil (Scrum):** Se logró articular una planificación coherente que concilia los requerimientos de la empresa con los límites de un proyecto académico de 10 semanas (Semanas 06 a 15). Se separó claramente el Producto Mínimo Viable (Release 1 - MVP de 110 SP distribuidos en 5 Sprints a una velocidad de 22 SP/Sprint) del catálogo evolutivo de 178 SP del Product Backlog, garantizando la entrega de valor funcional de alta prioridad antes de abordar la expansión a provincias y reportería financiera avanzada.
4. **Viabilidad económica y optimización presupuestal:** La formulación de la estructura de costos directos (1,150 horas-hombre distribuidas entre análisis, desarrollo full-stack y aseguramiento de calidad) e indirectos alcanzó una línea base competitiva de S/ 31,657.50. Esta cifra se optimizó aprovechando estratégicamente los 3 servidores VPS y el dominio existentes propiedad del cliente, demostrando que la modernización tecnológica de una MYPE es plenamente factible y sostenible.

---

## IV. ANEXOS

### Anexo 1: Grabación de Video de Sustentación de la Práctica
El registro audiovisual con la exposición detallada del mapeo de procesos, gestión de interesados, cronograma de Sprints y desglose del Product Backlog se encuentra disponible en:

📹 **[VIDEO GPS - SUSTENTACIÓN DE LA PRÁCTICA N.° 03](https://drive.google.com/drive/folders/1YIlri1xpQWsCfIQiI95nADYoOUAmM8s-?usp=sharing)**

### Anexo 2: Repositorio y Artefactos de Trabajo
- Repositorio de código y documentación del proyecto en GitHub.
- Diagramas de modelado de procesos de negocio BPMN (Archivos fuente `.bpmn` correspondientes a las figuras AS-IS y TO-BE).
- Tablero ágil de seguimiento en Jira/Trello con las historias de usuario y criterios de aceptación catalogados.

---

## V. REFERENCIAS Y BIBLIOGRAFÍA

[1] Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, 7th ed. Newtown Square, PA: Project Management Institute, 2021.  
[2] Object Management Group (OMG), *Business Process Model and Notation (BPMN) Version 2.0.2*, Needham, MA: Object Management Group, 2013. [En línea]. Disponible en: https://www.omg.org/spec/BPMN/2.0.2/  
[3] K. Schwaber y J. Sutherland, *La Guía de Scrum: Las Reglas del Juego*, Scrum.org, 2020. [En línea]. Disponible en: https://scrumguides.org/scrum-guide.html  
[4] Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT), *Resolución de Superintendencia N.° 117-2017/SUNAT: Aprueban el Sistema de Emisión Electrónica desarrollado desde los sistemas del contribuyente (SEE-SFS)*, Lima, Perú, 2017.  
[5] NubeFact, *Documentación e Integración de API REST para Facturación Electrónica en el Perú*, NubeFact Perú, 2024. [En línea]. Disponible en: https://www.nubefact.com/documentacion  
[6] M. Cohn, *User Stories Applied: For Agile Software Development*, Boston, MA: Addison-Wesley, 2004.  
