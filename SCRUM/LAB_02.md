# INFORME DE LABORATORIO — PRÁCTICA N.° 02

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
| **Título de la práctica** | Ingeniería de Requisitos y Modelado de Contexto del Sistema |
| **Número de práctica** | 02 |
| **Año lectivo** | 2026 - B |
| **N.° Semestre** | VIII |
| **Fecha de presentación** | 25/09/2026 |
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

### Personas entrevistadas y relación con el proceso

| Persona o rol | Relación con el proceso | Información disponible |
|---|---|---|
| **Administrador General / Gerente** | Representa a la editorial **QSY** y posee la visión estratégica, administrativa y de control del negocio. | Proporcionó el diagnóstico operativo integral: funcionamiento manual de puntos de venta, distribución de libros en consignación, entrega de tandas de boletas físicas, demoras en liquidaciones, reabastecimiento empírico y canal de envíos a provincia vía WhatsApp y Shalom. Las sesiones de levantamiento se efectuaron los días 17 y 24 de septiembre de 2026. |

### Preguntas principales de la entrevista

1. ¿Cómo se entregan las publicaciones a cada distribuidora y cómo se registra la cantidad entregada?
2. ¿Cómo se controla la venta, el monto establecido por libro entregado y la comisión de cada distribuidora?
3. ¿Cómo se entrega y controla la tanda de boletas físicas de QSY asignada a cada punto de venta?
4. ¿Qué ocurre cuando una boleta no se emite, se llena incorrectamente o se extravía?
5. ¿Qué información debe recuperarse cuando un estudiante presenta un reclamo o incidencia con un ejemplar?
6. ¿Cómo se realiza el reabastecimiento y cómo se concilian las existencias y ventas?
7. ¿Cómo se preparan, registran y confirman los envíos de libros a otras regiones (pagos por Yape, boleta digital y despacho por agencia)?
8. ¿Cómo debe responder el sistema cuando la conexión a internet en los locales sea inestable o se interrumpa?
9. ¿Qué roles de usuario interactuarán con el sistema y qué permisos específicos tendrá cada uno?

### Problema real y objetivo de la solución

#### Problema

La organización analizada es la editorial **QSY**, una MYPE de la ciudad de Arequipa dedicada a la publicación y venta de libros educativos y especializados en quechua (básico, intermedio, avanzado, diccionarios y quechua médico). La editorial distribuye sus libros en consignación a través de 3 distribuidoras aliadas ubicadas en puntos céntricos, además de comercializar ejemplares hacia provincias mediante pedidos coordinados por la Sucursal Virtual (Soporte).

A partir de la entrevista a profundidad con la gerencia, se identificaron los siguientes problemas críticos en la operación manual actual:

- **Descontrol en liquidaciones y recaudación:** Se negocia una comisión fija monetaria por cada ejemplar vendido, la cual varía según el producto. La conciliación de dinero y ventas se realiza quincenal o mensualmente y toma más de 1 hora por distribuidora, siendo identificada como el proceso que más tiempo hace perder.
- **Reabastecimiento lento y basado en conteos físicos:** Logística calcula las ventas por diferencia (restando los libros restantes de los entregados inicialmente), lo que demanda entre 2 y 4 horas entre traslados y recuentos manuales.
- **Emisión manual de comprobantes susceptible a errores y pérdidas:** A cada distribuidora se le entregan talonarios de 100 boletas físicas. Por la alta afluencia de estudiantes, el llenado manual demora hasta 2 minutos; muchas boletas se llenan mal, se omiten o los estudiantes las pierden, complicando severamente la atención de reclamos posteriores.
- **Falta de trazabilidad e identificación de compradores:** Al no existir un registro centralizado que vincule el DNI del estudiante con el código del ejemplar, la fecha y el vendedor responsable, verificar la validez de un reclamo por fallas de imprenta resulta sumamente complejo.
- **Conectividad inestable en puntos de atención:** Los vendedores operan principalmente desde teléfonos celulares en zonas céntricas con fluctuaciones constantes de señal móvil, lo cual impide depender de una conexión web permanente.
- **Salidas no comerciales no documentadas:** Libros otorgados a docentes, cortesías, promociones, sorteos, mermas o pérdidas se retiran del inventario sin registrar el motivo formal ni el responsable.
- **Canal de envíos a provincia atomizado y propenso a errores:** Soporte gestiona pedidos interregionales a través de chats de WhatsApp, solicitando capturas de pantalla de transferencias (Yape) y datos de agencias Shalom, sin contar con un registro estructurado de números de guía ni estados de despacho (proceso con mayor tasa de incidencias).

**El problema central es la inexistencia de un registro integrado, trazable y operable en tiempo real para la distribución, las ventas en puntos físicos, la facturación, los reabastecimientos y los despachos a provincia.**

#### Objetivo de la solución

Desarrollar un **Sistema de Gestión Administrativo Modular** que automatice, centralice y otorgue trazabilidad a las operaciones de la editorial QSY, abordando un alcance mínimo funcional viable y robusto estructurado en **9 módulos funcionales**:

1. **Gestión y seguimiento de sucursales:** Administración del padrón de locales distribuidores, direcciones, contactos y responsables.
2. **Proceso de compra acelerado:** Interfaz móvil ágil para captura rápida de datos mínimos de venta en menos de 2 minutos.
3. **Control automático de ventas:** Validación automática de existencias, cálculo de totales y registro inmutable de transacciones.
4. **Distribución y control de inventario:** Registro de despachos en consignación, alertas de stock mínimo y kardex de movimientos.
5. **Compras virtuales interregionales:** Registro centralizado de pedidos de provincia, validación de depósitos y seguimiento de guías Shalom.
6. **Control de producción, estado y salida de productos:** Registro de lotes entregados por imprenta y justificación de salidas sin venta (cortesías, sorteos, mermas).
7. **Dashboard de control gerencial:** Indicadores en tiempo real de ventas por día/mes, sucursales con stock crítico y ranking de locales.
8. **Emisión de comprobantes electrónicos:** Generación digital de boletas de venta vinculadas estrictamente a cada transacción.
9. **Envío de comprobantes al cliente:** Remisión automatizada y reenvío de comprobantes digitales por correo electrónico o WhatsApp.

---

### Usuarios y actores / sistemas externos

#### Actores del sistema y correspondencia con el negocio
- **Administrador General (Gerente):** Acceso total al sistema. Gestiona usuarios, locales distribuidores, catálogo de productos y precios; visualiza dashboards consolidados de ventas y utilidades.
- **Encargado de Logística:** Responsable del almacén central, registro de lotes recibidos de imprenta, entregas en consignación, ejecución de reabastecimientos, movimientos especiales y conciliación de liquidaciones.
- **Distribuidor / Vendedor:** Operador en los puntos de venta físicos (1 o 2 por local). Registra ventas desde su teléfono móvil (con soporte offline), consulta su stock asignado y solicita reabastecimientos.
- **Sucursal Virtual (Soporte):** Gestiona ventas en línea, coordina pedidos interregionales, valida pagos por Yape, genera comprobantes y despacha paquetes por Shalom.
- **Cliente / Estudiante:** Adquirente de los libros; suministra sus datos de identificación (DNI, nombres), recibe su comprobante digital y formula reclamos.

#### Sistemas externos
- **SUNAT (PSE/OSE):** Servicio de validación y timbrado fiscal de comprobantes de pago electrónicos.
- **Servicio de Mensajería WhatsApp:** Canal de envío de comprobantes digitales y notificaciones de despacho.
- **Servidor de Correo Electrónico (SMTP):** Envío formal de comprobantes en formatos PDF y XML.
- **Empresa de Transporte (Shalom):** Operador logístico externo para distribución interregional.

---

### Catálogo de Requisitos

#### Requisitos Funcionales – RF

| ID | Descripción | Justificación | Prioridad |
|---|---|---|---|
| **RF-01** | Administrar información general de sucursales y puntos de distribución (nombre, teléfono, correo, dirección). | Centralizar y mantener actualizado el padrón de puntos de venta. | Alta |
| **RF-02** | Controlar estado operativo, ubicación y encargado responsable de cada distribuidora. | Delimitar la responsabilidad operativa por cada sede comercial. | Alta |
| **RF-03** | Visualizar desempeño comercial, libros entregados, vendidos y stock disponible por distribuidora. | Mantener control permanente de las existencias en consignación. | Alta |
| **RF-04** | Comparar rendimiento de ventas entre sucursales distribuidoras. | Proveer información objetiva para la toma de decisiones gerenciales. | Media |
| **RF-05** | Registrar ventas presenciales de manera ágil y optimizada para dispositivos móviles. | Reducir el tiempo de atención en ventanilla de 5 a menos de 2 minutos. | Alta |
| **RF-06** | Ingresar DNI, nombres completos y medio de contacto del estudiante comprador. | Identificar al comprador para posibilitar la trazabilidad ante reclamos. | Alta |
| **RF-07** | Seleccionar título/nivel de libro, cantidad y método de pago (Yape o efectivo). | Estandarizar la captura transaccional en los locales. | Alta |
| **RF-08** | Validar stock asignado en tiempo real, calcular monto total y registrar la venta. | Evitar sobreventas de libros y eliminar errores de cálculo manual. | Alta |
| **RF-09** | Verificar que los datos mínimos obligatorios de la venta se encuentren completos antes de guardar. | Asegurar la integridad y calidad de la información financiera. | Alta |
| **RF-10** | Registrar de forma automática e inmutable fecha, hora, vendedor responsable y sucursal. | Proporcionar auditoría rigurosa de cada transacción comercial. | Alta |
| **RF-11** | Descontar automáticamente las existencias del inventario del local al confirmar la venta. | Mantener el stock del punto de venta permanentemente actualizado. | Alta |
| **RF-12** | Consultar historial de ventas anteriores y sus respectivos estados por sede. | Facilitar la atención de devoluciones, correcciones y reclamos. | Media |
| **RF-13** | Registrar existencias de productos diferenciadas entre el almacén central y cada punto de venta. | Controlar la disponibilidad física en toda la cadena de distribución. | Alta |
| **RF-14** | Controlar entradas de imprenta, salidas a distribuidoras y traslados entre sedes. | Garantizar la trazabilidad del flujo físico de ejemplares. | Alta |
| **RF-15** | Consultar disponibilidad y existencias de productos en cada sede en tiempo real. | Orientar al cliente a puntos alternativos en caso de quiebre de stock. | Alta |
| **RF-16** | Emitir alertas automáticas ante stock bajo o riesgo de agotamiento por sucursal. | Anticipar la reposición antes de perder oportunidades de venta. | Alta |
| **RF-17** | Registrar pedidos virtuales y compras realizadas por clientes de otras regiones del país. | Atender de forma ordenada la demanda interregional. | Alta |
| **RF-18** | Restringir la gestión y despacho de compras virtuales exclusivamente a la Sucursal Virtual (Soporte). | Centralizar y especializar la atención de envíos a provincia. | Media |
| **RF-19** | Asignar cada compra virtual al personal de soporte responsable de su preparación. | Definir responsables directos del empaquetado y entrega a agencia. | Alta |
| **RF-20** | Controlar estados de atención de envíos: Registrado, Pagado, Empaquetado, En Tránsito (Shalom) y Entregado. | Proporcionar seguimiento continuo de los paquetes interregionales. | Alta |
| **RF-21** | Registrar ejemplares recepcionados del proveedor de imprenta, vendidos y entregados en consignación. | Controlar el balance global de existencias de la editorial. | Alta |
| **RF-22** | Controlar salidas especiales de libros para sorteos, docentes, promociones o cortesías. | Evitar mermas encubiertas y justificar salidas no comerciales. | Media |
| **RF-23** | Identificar ubicación y custodia física de cada lote de libros (almacén, sede o responsable). | Saber exactamente dónde se encuentra cada título en todo momento. | Alta |
| **RF-24** | Diferenciar estados del producto: disponible, vendido, en consignación, dañado, devuelto o perdido. | Clasificar con precisión la condición del inventario. | Alta |
| **RF-25** | Registrar motivo obligatorio, fecha y usuario autorizador ante salidas que no generen ganancia directa. | Respaldar contablemente las bajas o entregas institucionales. | Media |
| **RF-26** | Mantener historial cronológico de movimientos de inventario (Kardex). | Disponer de trazabilidad histórica para auditorías internas. | Alta |
| **RF-27** | Mostrar ventas totales acumuladas e ingresos brutos por sucursal distribuidora. | Proporcionar visibilidad financiera inmediata a la gerencia. | Alta |
| **RF-28** | Identificar y clasificar el desempeño y volumen de ventas por sede distribuidora. | Determinar qué locales concentran mayor demanda para priorizar stock. | Media |
| **RF-29** | Mostrar los títulos más vendidos y el balance de ejemplares entregados sin venta. | Analizar la rotación de títulos (básico, médico, diccionarios). | Media |
| **RF-30** | Visualizar estados históricos de ventas, inventario y entregas anteriores. | Comparar la evolución comercial frente a períodos previos. | Media |
| **RF-31** | Generar reportes y consolidados periódicos de ventas y stock para la gerencia. | Respaldar la planificación de nuevas tiradas de impresión. | Alta |
| **RF-32** | Generar boletas electrónicas de venta asociadas automáticamente a cada transacción. | Formalizar la venta y garantizar el comprobante a cada estudiante. | Alta |
| **RF-33** | Capturar y validar datos fiscales mínimos del cliente (DNI y nombre completo). | Cumplir las exigencias legales para comprobantes de pago. | Alta |
| **RF-34** | Integrar la emisión de comprobantes con el sistema de comprobantes electrónicos (SUNAT). | Cumplir el marco regulatorio tributario vigente en el Perú. | Alta |
| **RF-35** | Asociar unívocamente cada comprobante emitido a su registro de venta original. | Impedir duplicidades, omisiones o falsificaciones. | Alta |
| **RF-36** | Enviar comprobante de pago digital en formato PDF/XML mediante correo electrónico. | Brindar un respaldo seguro y accesible al comprador. | Alta |
| **RF-37** | Enviar comprobante de pago digital directamente al número de WhatsApp del estudiante. | Ofrecer el comprobante por el canal de mensajería más utilizado. | Media |
| **RF-38** | Registrar el canal utilizado (correo o WhatsApp) y la fecha/hora del envío del comprobante. | Mantener auditoría sobre la entrega efectiva de comprobantes. | Media |
| **RF-39** | Permitir la búsqueda y reenvío del comprobante digital ante solicitudes o extravíos. | Resolver reclamos de estudiantes que perdieron su boleta física. | Media |

---

#### Requisitos No Funcionales – RNF

| ID | Descripción | Justificación | Prioridad |
|---|---|---|---|
| **RNF-01** | **Seguridad y Control de Acceso:** El sistema debe autenticar usuarios mediante credenciales seguras y asignar permisos basados en roles (RBAC: Administrador, Logística, Soporte, Distribuidor). | Restringir el acceso según el cargo y garantizar que las distribuidoras no visualicen datos ajenos. | Alta |
| **RNF-02** | **Usabilidad Mobile-First:** La interfaz de venta debe estar completamente adaptada a pantallas de teléfonos inteligentes, permitiendo completar una venta en un máximo de 4 toques/pasos. | Los vendedores atienden exclusivamente con celulares y en condiciones de alta concurrencia. | Alta |
| **RNF-03** | **Rendimiento:** El tiempo de respuesta del sistema para registrar una venta local o consultar disponibilidad no debe exceder los 2 segundos bajo condiciones normales. | Agilizar la atención y evitar colas de espera en los locales. | Alta |
| **RNF-04** | **Disponibilidad Operativa:** El sistema central debe garantizar una disponibilidad del 99.5% durante el horario comercial (lunes a sábado de 08:00 a 20:00). | Asegurar la continuidad del negocio y evitar paralizaciones en ventas. | Alta |
| **RNF-05** | **Escalabilidad:** La arquitectura debe permitir la incorporación de nuevas distribuidoras y productos sin requerir cambios estructurales en el software ni en la base de datos. | Atender los planes de expansión de la editorial a mediano plazo. | Media |
| **RNF-06** | **Compatibilidad Multiplataforma:** La aplicación debe funcionar sin degradación en navegadores web móviles modernos (Chrome, Safari) sobre Android/iOS, así como en computadoras de escritorio. | Garantizar el acceso desde cualquier dispositivo sin dependencia de hardware propietario. | Alta |
| **RNF-07** | **Tolerancia a Red Inestable y Modo Offline:** El módulo de venta debe permitir el registro temporal de operaciones en el almacenamiento local del navegador cuando falle la conexión, sincronizándose automáticamente al restablecerse la red. | Los locales se ubican en puntos céntricos con señal móvil inestable (requerimiento crítico de la entrevista). | Alta |
| **RNF-08** | **Auditoría e Inmutabilidad:** El sistema debe registrar logs de auditoría para toda modificación o anulación de venta, exigiendo justificación obligatoria, y conservar el historial durante al menos 2 años. | Garantizar la transparencia financiera y posibilitar la atención de reclamos pasados. | Alta |
| **RNF-09** | **Interoperabilidad:** Debe proveer interfaces estandarizadas (APIs REST) para comunicarse con servicios de facturación electrónica (SUNAT PSE/OSE) y pasarelas de mensajería (WhatsApp/SMTP). | Permitir la automatización de comprobantes y despachos sin intervención manual. | Alta |
| **RNF-10** | **Respaldo y Recuperación:** Debe ejecutarse un respaldo automático diario de la base de datos y archivos de configuración en el servidor VPS de la editorial, con RPO ≤ 24 horas y RTO ≤ 2 horas. | Proteger los datos transaccionales ante fallos de servidor o desastres. | Alta |
| **RNF-11** | **Cumplimiento Legal Tributario:** La emisión y numeración de boletas debe ajustarse estrictamente a las resoluciones de SUNAT sobre Sistema de Emisión Electrónica. | Evitar contingencias legales y multas tributarias para la empresa. | Alta |
| **RNF-12** | **Modularidad y Desacoplamiento:** La arquitectura del software debe estructurarse en módulos independientes alineados con las áreas operativas del negocio, facilitando su mantenimiento y evolución. | Asegurar mantenibilidad y permitir el despliegue progresivo por etapas. | Media |

---

### Diagrama de Contexto UML

El Diagrama de Contexto delimita las fronteras del **Sistema de Gestión Administrativo** de QSY, identificando los flujos de información bidireccionales con todos los actores humanos y sistemas externos.

```
       +-------------------------------------------------------------+
       |                        ACTORES INTERNOS                     |
       |  [Administrador]    [Logística]    [Sucursal Virtual/Soporte] |
       +-------------------------------------------------------------+
                                     |
                                     v
                       +---------------------------+
                       |    SISTEMA DE GESTIÓN     | <---> [SUNAT (PSE/OSE)]
                       |   ADMINISTRATIVO (QSY)    | <---> [WhatsApp / Correo]
                       +---------------------------+ <---> [Shalom (Guías)]
                                     ^
                                     |
       +-------------------------------------------------------------+
       |                 ACTORES EXTERNOS / PUNTOS                   |
       |             [Distribuidores]         [Clientes]             |
       +-------------------------------------------------------------+
```

#### Matriz de Interacción del Diagrama de Contexto

| Actor / Sistema Externo | Información que Envía al Sistema | Información que Recibe del Sistema |
|---|---|---|
| **Administrador General** | Configuración de sucursales, precios de productos, comisiones, altas/bajas de usuarios. | Dashboards gerenciales, reportes consolidados de ventas, estados de pago y liquidaciones. |
| **Encargado de Logística** | Lotes de imprenta, asignaciones de stock a sedes, reabastecimientos, movimientos especiales y liquidaciones. | Alertas de stock crítico, kardex de productos, estados de stock por sede y ventas para reposición. |
| **Distribuidor (Vendedor)** | Registro de ventas (DNI, título, pago), número de boleta, justificación de correcciones y solicitudes de stock. | Catálogo de precios, stock asignado disponible, comprobante emitido y resumen de ventas del turno. |
| **Sucursal Virtual (Soporte)** | Pedidos de provincia, validación de depósitos Yape, datos de envío y números de guía de transporte. | Stock disponible para provincia, boleta electrónica generada y detalle de reclamos registrados. |
| **Cliente / Estudiante** | Solicitud de libro, DNI, datos de contacto, evidencia de pago y consultas de reclamos. | Boleta electrónica digital (PDF/XML), confirmación de venta y estado de despacho. |
| **SUNAT (Servicio OSE/PSE)** | Constancia de Recepción (CDR), código hash y estado de validez tributaria. | Trama electrónica de comprobante (XML firmado, RUC, serie, correlativo, ítems). |
| **Servicio de WhatsApp** | Confirmación de entrega de mensaje. | Mensaje multimedia con boleta electrónica y datos de la transacción comercial. |
| **Servidor de Correo (SMTP)** | Estado de envío del correo electrónico. | Correo estructurado con comprobante adjunto en formato PDF y XML. |
| **Empresa de Transporte (Shalom)** | Constancia física de recepción y código de seguimiento interregional. | Datos del destinatario, peso/bultos y sede de destino. |

---

### Diagrama de Casos de Uso UML

El diagrama modela las funcionalidades principales del sistema y las interacciones con sus respectivos actores, destacando las relaciones de inclusión («include») para operaciones críticas.

#### Relación de Actores y Casos de Uso

| Actor Principal | Caso de Uso Asociado | Relaciones «include» / «extend» |
|---|---|---|
| **Distribuidor** | CU-01: Registrar venta presencial | «include» → Validar stock local <br> «include» → Emitir comprobante de venta <br> «include» → Actualizar inventario local |
| **Distribuidor** | CU-02: Solicitar reabastecimiento de stock | — |
| **Distribuidor** | CU-03: Consultar inventario asignado | — |
| **Distribuidor** | CU-04: Solicitar corrección/anulación de venta | «include» → Registrar justificación y auditoría |
| **Logística** | CU-05: Distribuir libros en consignación | «include» → Asignar rango de boletas físicas |
| **Logística** | CU-06: Procesar reabastecimiento | «include» → Conciliar ventas previas con stock |
| **Logística** | CU-07: Registrar movimientos especiales de almacén | «include» → Registrar motivo de salida sin ganancia |
| **Logística** | CU-08: Efectuar liquidación quincenal/mensual | «include» → Calcular comisión fija por producto |
| **Sucursal Virtual** | CU-09: Registrar compra virtual con envío a provincia | «include» → Emitir comprobante electrónico <br> «include» → Registrar guía de transporte Shalom |
| **Sucursal Virtual** | CU-10: Atender reclamo de estudiante por DNI | «include» → Consultar historial transaccional |
| **Administrador** | CU-11: Gestionar sucursales y usuarios | — |
| **Administrador** | CU-12: Gestionar catálogo de libros y precios | — |
| **Administrador** | CU-13: Visualizar dashboard e indicadores gerenciales | — |
| **Sistema Externo: SUNAT** | CU-14: Validar comprobante electrónico | Invocado por «include» desde la emisión de comprobante |

---

### Ficha Descriptiva del Caso de Uso Principal

**Caso de Uso:** Registrar venta y emitir comprobante  
- **Código:** CU-01  
- **Actor principal:** Distribuidor (Vendedor en punto de venta)  
- **Actores secundarios:** Cliente / Estudiante, SUNAT, Servicio de Mensajería (WhatsApp/Correo), Inventario  
- **Módulos relacionados:** Módulo 2 (Compra acelerada), Módulo 3 (Control de ventas), Módulo 4 (Inventario), Módulo 8 (Comprobantes), Módulo 9 (Envío de comprobantes).  

| Elemento | Descripción |
|---|---|
| **Objetivo** | Registrar una venta presencial de forma rápida desde el teléfono celular del distribuidor, validando existencias locales, calculando el importe, descontando el inventario, emitiendo el comprobante correspondiente y enviándolo digitalmente al estudiante. |
| **Precondiciones** | 1. El distribuidor debe estar autenticado en el sistema y tener asignada una sucursal activa. <br> 2. Los productos seleccionados deben poseer precio y comisión registrados en el catálogo. <br> 3. Debe existir stock disponible asignado a la sucursal del distribuidor. <br> 4. El distribuidor debe contar con talonarios de boletas válidos registrados en el sistema. |
| **Postcondiciones** | 1. La venta queda registrada de forma inmutable con fecha, hora, sucursal y vendedor. <br> 2. El stock asignado a la distribuidora se descuenta en tiempo real. <br> 3. Se genera y asocia el comprobante de venta a la transacción. <br> 4. Se envía el comprobante al cliente por WhatsApp o correo. <br> 5. Se registra la operación en el log de auditoría. |
| **Flujo normal** | 1. El vendedor accede al módulo de "Nueva Venta" desde su dispositivo móvil. <br> 2. Ingresa el DNI y los nombres del estudiante comprador (y su celular/correo de contacto). <br> 3. El sistema muestra el catálogo simplificado y el stock disponible en dicha sede. <br> 4. El vendedor selecciona el título del libro, nivel (básico/intermedio/avanzado) y cantidad solicitada. <br> 5. El sistema valida la disponibilidad física de los ejemplares solicitados. <br> 6. El sistema calcula automáticamente el total de la venta (precio fijo sin descuentos). <br> 7. El vendedor selecciona el método de pago utilizado (Yape o Efectivo) e ingresa el correlativo de boleta física entregada. <br> 8. El vendedor presiona "Confirmar Venta". <br> 9. El sistema registra la transacción asociando fecha, hora exacta, distribuidor y sucursal. <br> 10. El sistema actualiza y descuenta inmediatamente el stock de la distribuidora. <br> 11. El sistema genera el comprobante electrónico correspondiente. <br> 12. El sistema envía la trama a SUNAT para su validación formal. <br> 13. El sistema despacha el comprobante digital al WhatsApp o correo electrónico del cliente. <br> 14. El sistema muestra un mensaje de confirmación de venta exitosa con el número de transacción. |
| **Flujo alternativo** | **4a. Venta de múltiples títulos:** El vendedor añade libros adicionales; el sistema recalcula el total acumulado antes de confirmar. <br> **5a. Stock local insuficiente:** El sistema bloquea la confirmación, muestra una alerta de existencias agotadas y despliega las existencias de otras distribuidoras para orientar al estudiante. <br> **7a. Pago mixto o método alternativo:** El vendedor selecciona la combinación de efectivo y Yape, desglosando los montos recibidos. <br> **10a. Operación en modo offline (sin conexión):** Si se detecta corte de red móvil, el sistema almacena la venta y el correlativo localmente en el dispositivo (IndexedDB), notificando que la transacción se sincronizará automáticamente al volver la conectividad. <br> **12a. Rechazo o indisponibilidad temporal de SUNAT:** El sistema guarda el comprobante en cola de reintentos asíncrona, entrega la confirmación local al comprador y reprograma el timbrado fiscal. <br> **13a. Falla en el envío digital (WhatsApp/Correo):** El sistema alerta la falla de remisión, almacena la boleta y habilita la opción de "Reenviar comprobante" o generación de código QR en pantalla. |
| **Excepciones** | - Caída total de hardware en el dispositivo móvil: la transacción incompleta no se persiste y se reinicia el flujo. <br> - Sesión de usuario expirada: el sistema solicita reautenticación preservando los datos de la venta temporalmente. <br> - Intento de reutilizar un correlativo de boleta física ya emitido: el sistema rechaza el registro exigiendo un número correlativo válido. |
| **Reglas de negocio** | 1. **RN-01 (Prohibición de sobreventa):** Bajo ninguna circunstancia se permite registrar una venta con stock igual a cero o insuficiente. <br> 2. **RN-02 (Obligatoriedad de comprobante):** Toda venta efectuada debe contar obligatoriamente con un comprobante asociado. <br> 3. **RN-03 (Precios fijos):** El precio de venta al público es fijo por producto; los distribuidores no pueden aplicar descuentos discrecionales. <br> 4. **RN-04 (Descuento inmediato de stock):** Las unidades se descuentan del inventario del local en el instante de pulsar "Confirmar Venta". <br> 5. **RN-05 (Aislamiento de sedes):** El distribuidor solo puede vender y visualizar existencias asignadas a su propia distribuidora. |
| **Requisitos asociados** | RF-05 a RF-12, RF-32 a RF-39; RNF-01, RNF-02, RNF-03, RNF-06, RNF-07, RNF-08, RNF-11. |
| **Prioridad** | Alta |

---

## II. CONCLUSIONES

1. **Alineamiento con la realidad operativa de la editorial QSY:** El levantamiento de información y el análisis de la entrevista evidenciaron que el principal problema de la empresa no radica en la demanda comercial, sino en la ineficiencia de sus procesos manuales de control. La dependencia de cuadernos, estimaciones empíricas y talonarios físicos generaba tiempos muertos críticos (hasta 4 horas en reabastecimientos y 1 hora en liquidaciones), mermas no justificadas y graves dificultades para atender reclamos de estudiantes.
2. **Delimitación estricta a un alcance mínimo funcional viable (MVP):** Si bien las necesidades de la empresa abarcan áreas extensas, se priorizó un núcleo operativo de 39 Requisitos Funcionales agrupados en 9 módulos. Este alcance garantiza resolver los cuellos de botella más urgentes —venta rápida móvil, control de inventario en consignación, conciliación de liquidaciones y emisión trazable de boletas— sin sobrecargar al equipo ni comprometer la viabilidad del proyecto de software.
3. **Resiliencia ante condiciones técnicas adversas:** La identificación de restricciones clave, como el uso exclusivo de teléfonos celulares por parte de los vendedores y la inestabilidad de la señal móvil en los puntos de atención céntricos, condujo a priorizar requisitos no funcionales indispensables como la usabilidad mobile-first y el soporte para ventas offline con sincronización diferida. Diseñar sin considerar estas restricciones habría derivado en el rechazo operativo del sistema por parte de los distribuidores.
4. **Trazabilidad como eje de calidad y formalización:** La formalización del flujo de venta mediante la captura del DNI del estudiante, el registro inmutable de auditoría (con fecha, hora y distribuidor) y la obligatoriedad de justificación para cualquier anulación o corrección sientan las bases para eliminar los conflictos por pérdidas de boletas y asegurar la transparencia requerida por la gerencia.

---

## III. ANEXOS

### Grabación de la Entrevista con el Cliente
El registro audiovisual completo de las sesiones de levantamiento de requisitos realizadas con la gerencia de la editorial QSY se encuentra disponible en el siguiente repositorio en la nube:

📹 **[VIDEO GPS - ENTREVISTA CON EL CLIENTE QSY](https://drive.google.com/drive/folders/1YIlri1xpQWsCfIQiI95nADYoOUAmM8s-?usp=sharing)**

El material anexo incluye la formulación y respuesta de las 127 preguntas orientadas a la determinación de procesos, roles, restricciones de negocio, volumetría de transacciones y tiempos operativos actuales.

---

## IV. REFERENCIAS Y BIBLIOGRAFÍA

[1] Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, 7th ed. Newtown Square, PA: Project Management Institute, 2021.  
[2] IEEE Computer Society, *ISO/IEC/IEEE 29148:2018 Systems and software engineering — Life cycle processes — Requirements engineering*, Geneva, Switzerland: International Organization for Standardization, 2018.  
[3] Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT), *Resolución de Superintendencia N.° 117-2017/SUNAT: Sistema de Emisión Electrónica de Comprobantes de Pago*, Lima, Perú, 2017.  
[4] I. Sommerville, *Software Engineering*, 10th ed. Boston, MA: Pearson, 2016.  
