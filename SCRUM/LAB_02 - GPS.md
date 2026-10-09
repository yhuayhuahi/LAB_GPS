**UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT eG</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001** ~~(O|~~ **Página:** 1 

# **INFORME DE LABORATORIO** 

|||**INFORMACI**|**ÓN BÁSICA**|||
|---|---|---|---|---|---|
|**ASIGNATURA:**|Gestión de Pro|yectos de Softwa|re|||
|**TÍTULO DE LA**<br>**PRÁCTICA:**|INGENIERÍA DE|REQUISITOS Y MO|DELADO DE CO|NTEXTO DEL SISTE|MA|
|**NÚMERO DE**<br>**PRÁCTICA:**|02|**AÑO LECTIVO:**|2026 - B|**NRO.**<br>**SEMESTRE:**|VIII|
|**FECHA DE**<br>**PRESENTACIÓN**|25/09/2026|**HORA DE**<br>**PRESENTACIÓN**|11 : 59 pm|||
|**INTEGRANTE (s):**<br>●Alvarez C<br>●Arce May<br>●Huayhua|<br>hoque Miguel A<br>hua Leonardo R<br>Hillpa, Yourdyy|ngel<br>uben<br>Yossimar||**NOTA:**||



- Mollo Chuquicaña Dolly Yadhira 

**DOCENTE(s):** Mg. Diego Alonso Iquira Becerra 

**SOLUCIÓN Y RESULTADOS** ~~ae~~ 



#### **UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT</u>~~ 

**Aprobación:  2022/03/01** 

**Código: GUIA-PRLE-001 Página:** 2 

## **I. SOLUCIÓN DE EJERCICIOS/PROBLEMAS** 

### Personas entrevistadas y relación con el proceso 

|Persona o rol|Relación con el<br>proceso|Información disponible|
|---|---|---|
|Gerente|Representa a la<br>editorial QSY y<br>conoce<br>la<br>necesidad<br>de<br>control<br>del<br>negocio.|Comunicó la problemática general: operación<br>manual, distribución de libros y tandas de<br>boletas,<br>dificultades<br>de<br>control,<br>reabastecimiento y envíos a provincia. Se<br>realizaron entrevistas los días 17 y 24 de<br>septiembre; el nombre no fue proporcionado.|



### Preguntas principales de la entrevista 

1. ¿Cómo se entregan las publicaciones a cada distribuidor y cómo se registra la cantidad entregada? 

2. ¿Cómo se controla la venta, el monto establecido por libro entregado y la ganancia de cada distribuidora? 

3. ¿Cómo se entrega y controla la tanda de boletas de QSY asignada a cada distribuidora? 

4. ¿Qué ocurre cuando una boleta no se emite, contiene un error o se extravía? 

5. ¿Qué información debe recuperarse cuando un estudiante presenta un reclamo o incidencia? 

6. ¿Cómo se realiza el reabastecimiento y qué se cuenta de lo entregado y lo vendido? 

7. ¿Cómo se preparan, registran y confirman los envíos de libros a otras provincias, incluidos Yape, boleta digital y transporte? 

8. ¿Qué debe hacer el proceso cuando no hay señal o la conexión es inestable? 

9. ¿Qué personas usarán el sistema y qué acciones podrá realizar cada una? 

### Problema real y objetivo de la solución: 

### Problema: 

La organización analizada es la editorial QSY, una MYPE de Arequipa. La editorial entrega tandas de libros a distribuidoras para su comercialización. Las boletas pertenecen a QSY, pero se entrega una tanda de boletas a cada distribuidora. El manejo de dichas boletas es manual. 

El proceso manual genera los siguientes problemas reportados: 

- No existe un control suficiente de las ganancias obtenidas. 

- No existe un control integrado del reabastecimiento. En ese momento se realiza la 

- cuenta de lo entregado y lo vendido. 

- La emisión manual de boletas es susceptible a errores y, por falta de tiempo, 

- algunas boletas no se elaboran. 



#### **UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT DD</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001 Página:** 3 

- La señal de internet puede variar según el lugar donde se realiza la operación. 

- ● Cuando surge un problema, los estudiantes deben presentar su boleta; sin embargo, esta puede extraviarse o no haber sido entregada. 

- No se dispone de trazabilidad clara sobre quién emitió una boleta ni sobre los 

- ítems que contiene. 

- Los envíos de libros a otras provincias son realizados manualmente por una 

- persona específica; se solicita una captura del pago por Yape, se entrega una boleta digital y se usa una empresa de transporte, como Olva o Shalom. 

El problema central es la falta de un registro integrado y trazable para las entregas y reabastecimientos de las distribuidoras, las ventas/comprobantes y los envíos a provincia. 

### Objetivo: 

Implementar un sistema de gestión administrativo modular que automatice y centralice los procesos de los 9 módulos descritos en el documento: 

- Gestión y seguimiento de sucursales. 

- Proceso de compra acelerado. 

- Control automático de ventas. 

- Distribución y control de inventario. 

- Compras virtuales interregionales. 

- Control de producción, estado y salida de productos. 

- Dashboard de control gerencial. 

- Emisión de comprobantes electrónicos. 

- Envío de comprobantes al cliente. 

### Usuarios y actores / sistemas externos 

Usuarios: gerente, administrador de sucursal, vendedor, almacén, producción, contabilidad, cliente. 

Sistemas externos: SUNAT, correo electrónico, WhatsApp 

### Catálogo de Requisitos 

Requisitos Funcionales – RF 

|ID|Descripción|Justificación|Priorid|
|---|---|---|---|
||||ad|
|RF-01|Administrar información|Centralizar datos de|Alta|
||general de sucursales.|cada sede.||





#### **UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT DD</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001 Página:** 4 

|RF-02|Controlar estado, ubicación y<br>responsable de cada sede.|Saber quién gestiona<br>cada sucursal.|Alta|
|---|---|---|---|
|RF-03|Visualizar desempeño<br>comercial e inventario por<br>sucursal.|Comparar resultados y<br>stock.|Alta|
|RF-04|Comparar rendimiento entre<br>sucursales.|Apoyar decisiones<br>gerenciales.|Media|
|RF-05|Registrar ventas de manera<br>rápida y ordenada.|Reducir tiempo de<br>atención.|Alta|
|RF-06|Ingresar DNI y medio de<br>contacto del cliente.|Identificar cliente y<br>emitir comprobante.|Alta|
|RF-07|Seleccionar tipo de producto,<br>cantidad y forma de pago.|Estandarizar la venta.|Alta|
|RF-08|Validar stock, calcular total y<br>registrar venta<br>automáticamente.|Evitar sobreventa y<br>errores de cálculo.|Alta|
|RF-09|Verificar que la información<br>de la venta esté completa.|Asegurar calidad del<br>registro.|Alta|
|RF-10|Registrar fecha, hora,<br>vendedor y sucursal de la<br>operación.|Auditoría y control<br>comercial.|Alta|



**UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT eG</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001** ~~<u>(O|</u>~~ **Página:** 5 

|RF-11|Actualizar inventario según la<br>venta realizada.|Mantener stock real.|Alta|
|---|---|---|---|
|RF-12|Consultar ventas anteriores y<br>sus estados.|Seguimiento y reclamos.|Media|
|RF-13|Registrar stock de productos<br>por sucursal o almacén.|Controlar disponibilidad.|Alta|
|RF-14|Controlar entradas, salidas y<br>traslados de productos.|Trazabilidad del<br>inventario.|Alta|
|RF-15|Consultar disponibilidad de<br>productos en cada sede.|Evitar ventas sin stock.|Alta|
|RF-16|Alertar sobre bajo stock o<br>falta de disponibilidad.|Reponer oportunamente.|Alta|
|RF-17|Registrar compras virtuales<br>realizadas desde otras<br>regiones.|Atender ventas<br>interregionales.|Alta|
|RF-18|Permitir que solo sucursales<br>autorizadas atiendan compras<br>virtuales.|Controlar el servicio.|Media|
|RF-19|Asignar compra virtual a una<br>sucursal responsable.|Definir quién atiende.|Alta|
|RF-20|Controlar estado de atención,|Seguimiento del pedido.|Alta|





#### **UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT DD</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001 Página:** 6 

||envío y cierre de la compra.|||
|---|---|---|---|
|RF-21|Registrar productos<br>producidos, ingresados,<br>vendidos y entregados.|Controlar flujo<br>productivo.|Alta|
|RF-22|Controlar productos para<br>sorteos, docentes,<br>promociones, cortesías u<br>otros.|Evitar pérdidas y usos<br>no registrados.|Media|
|RF-23|Identificar ubicación de cada<br>producto: sucursal, almacén,<br>responsable o destino final.|Saber dónde está cada<br>producto.|Alta|
|RF-24|Diferenciar productos<br>disponibles, vendidos,<br>entregados, trasladados,<br>dañados, perdidos o<br>pendientes.|Estados claros del<br>producto.|Alta|
|RF-25|Registrar motivo de salida<br>cuando no genere ganancia<br>directa.|Justificar salidas<br>internas.|Media|
|RF-26|Mantener historial general de<br>movimientos.|Auditoría y trazabilidad.|Alta|
|RF-27|Mostrar ventas totales por<br>sucursal.|Indicador gerencial<br>básico.|Alta|





#### **UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT DD</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001 Página:** 7 

|RF-28|Identificar sucursal y<br>vendedor con mayor<br>desempeño.|Evaluar rendimiento.|Media|
|---|---|---|---|
|RF-29|Mostrar productos más<br>vendidos y usados sin venta<br>directa.|Analizar rotación y usos<br>internos.|Media|
|RF-30|Visualizar estados anteriores<br>de ventas, inventario y<br>entregas.|Consultar histórico.|Media|
|RF-31|Generar reportes para apoyar<br>la toma de decisiones.|Mejorar gestión<br>gerencial.|Alta|
|RF-32|Generar recibos, boletas o<br>comprobantes de venta.|Formalizar la venta.|Alta|
|RF-33|Registrar datos del cliente<br>para la emisión del<br>comprobante.|Cumplir requisitos<br>tributarios.|Alta|
|RF-34|Integrar la emisión de<br>comprobantes con SUNAT.|Obligación legal.|Alta|
|RF-35|Asociar cada comprobante<br>con la venta correspondiente.|Evitar duplicidad y<br>errores.|Alta|
|RF-36|Enviar comprobantes por<br>correo electrónico.|Comodidad para el<br>cliente.|Alta|



|<br>|**Format**<br> <br>|**UNIVERSIDAD**<br>**FACULTAD DE INGENIE**<br>**ESCUELA PROFESIO**<br>**o:**Guía de Práctica de Laborato<br><br>|**NACIONAL DE SAN AGUSTIN**<br>**RÍA DE PRODUCCIÓN Y SERVICIOS**<br>**NAL DE INGENIERÍA DE SISTEMA**<br>rio / Talleres / Centros de Simulación<br> <br>~~T~~|<br>|
|---|---|---|---|---|
|**Aprobaci**|**ón:  2022/03/01**|**Códi**|**go: GUIA-PRLE-001**|**Página:**8|
|RF-37|Enviar compro<br>WhatsApp.|bantes por|Canal preferido por<br>clientes.|Media|
|RF-38|Registrar el m<br>utilizado.|edio de envío|Control de<br>comunicaciones.|Media|
|RF-39|Permitir el re<br>comprobante<br>necesario.|envío del<br>cuando sea|Atender solicitudes del<br>cliente.|Media|



### Requisitos No Funcionales – RNF 

|ID|Descripción|Justificación|Prioridad|
|---|---|---|---|
|RNF-01|El sistema debe autenticar usuarios y<br>asignar roles.|Seguridad por cargo.|Alta|
|RNF-02|La interfaz debe ser intuitiva para<br>registrar ventas rápido.|Reducir curva de<br>aprendizaje.|Alta|
|RNF-03|El registro de venta debe responder<br>en menos de 3 segundos.|Agilizar atención.|Alta|
|RNF-04|El sistema debe tener disponibilidad<br>del 99% en horario comercial.|Continuidad<br>operativa.|Alta|
|RNF-05|Debe permitir agregar nuevas<br>sucursales sin rediseño.|Escalabilidad.|Media|





#### **UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT DD</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001 Página:** 9 

|RNF-06|Debe funcionar en navegadores<br>actuales y dispositivos de escritorio.|Compatibilidad.|Media|
|---|---|---|---|
|RNF-07|Las transacciones de venta e<br>inventario deben ser consistentes.|Evitar descuadres.|Alta|
|RNF-08|Debe mantener logs de movimientos y<br>cambios.|Auditoría.|Alta|
|RNF-09|Debe integrarse con SUNAT, correo y<br>WhatsApp.|Interoperabilidad.|Alta|
|RNF-10|Debe realizar respaldos diarios de<br>información.|Recuperación ante<br>fallas.|Alta|
|RNF-11|Debe cumplir la normativa de<br>comprobantes electrónicos.|Legalidad.|Alta|
|RNF-12|Debe ser modular según los 9 módulos<br>definidos.|Mantenibilidad.|Media|



### Diagrama de Contexto UML. 



<!-- Start of picture text -->
UNIVERSIDAD NACIONAL DE SAN AGUSTIN<br>FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS<br>poe Wh ncemieniaISTEMAS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA ABETO<br>Formato:  Guía de Práctica de Laboratorio / Talleres / Centros de Simulación<br>Aprobación:  2022/03/01  Código: GUIA-PRLE-001  Página:  10<br><!-- End of picture text -->



<!-- Start of picture text -->
Diagrama de Contexto UML<br>Estados y resultados >)_<br>Datos de sucursales, Cc.)<br>ventas ¢ inventario ‘Administrador de<br>Sucursal<br>Confirmaciény comprobantede venta lan_<br>A<br>clientepatos atosya deproductosventa, Vendedor( )<br>Om)<br>Stock y alertas ©<br>( )<br>Movimientosi de inventario ReonPersonal de<br>Estados de productos ©<br>(=)<br>Datosy movimientosde produccién Personalpersonal deoe<br>@ Consultas y reportes )<br>A jerenciales SISTEMA DE GESTION Comprobantes y reportes QV)<br>< Je_Indicadores y reportes_| ADMINISTRATIVO Datos de comprobantes ( )<br>Gerente Pr Personal de}<br>Comprobante y estado Contabilidad<br>de compra<br>Datos de compra )<br>solicitud de comprobante Cliente<br>Comprobante electrénico _<br>( )<br>Validacién / respuesta SUNAT<br>Comprobante / envio ~<br>©)<br>Confirmacién; de envio7 ( ))<br>‘Correo<br>Electrénico<br>Comprobante / envio<br>N/A<br>Confirmacién de envio ( )<br>WhatsApp<br><!-- End of picture text -->



<!-- Start of picture text -->
Diagrama de caso de uso UML.<br><!-- End of picture text -->



<!-- Start of picture text -->
UNIVERSIDAD NACIONAL DE SAN AGUSTIN<br>FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS<br>piecetincemeniaISTEMAS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA ABETO<br><!-- End of picture text -->



<!-- Start of picture text -->
Aprobación:  2022/03/01<br><!-- End of picture text -->

**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación **Código: GUIA-PRLE-001** 

**Página:** 11 



<!-- Start of picture text -->
Contabilidad<br>Sistema de Gestion Administrativo<br>XI OSS<br>[e) rece aSEnviarcomprobanteal cliente<br>Cliente ———_—_—_—_——<br>(Ver dashboard gerencial<br>Gerente (Registrar compra virtual interregional ~~ ~*include»<br>Tt Gestionar—_—sucursales ~S<| CEmitir comprobante electrénico<br>enoludep<br>Administrador Sb =<br>a eooor esSe _ os<br>Registrarventa"> ______includes_'___,*Actualizarinventario”> ~einetudesa<br>J < TT >= includes ees oN<br>Vendetor =,—— Nyae— integrareecon SUNAT<br>2 Consuitar ventas<br>Almacen: +<br>‘SUNAT<br><!-- End of picture text -->

Ficha descriptiva de Caso de Uso principal Caso de uso: Registrar venta y emitir comprobante 

Código: CU-02 Actor principal: Vendedor Actores secundarios: Cliente, SUNAT, Servicio de correo/WhatsApp, Inventario Módulos relacionados: Módulo 2, 3, 4, 8 y 9. 

|Elemento|Descripción|
|---|---|
|Objetivo|Registrar una venta de forma rápida, validando stock, calculando<br>total, actualizando inventario, emitiendo comprobante electrónico y|
||enviándolo al cliente.|





**UNIVERSIDAD NACIONAL DE SAN AGUSTIN FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA** 



**Formato:** Guía de Práctica de Laboratorio / Talleres / Centros de Simulación ~~<u>PT DD</u>~~ **Aprobación:  2022/03/01 Código: GUIA-PRLE-001 Página:** 12 

|Precondicio<br>nes|Vended<br>stock|or autenticado, sucursal asignada, productos con precio,<br>disponible, datos mínimos del cliente.|
|---|---|---|
|Postcondicio<br>nes|Venta<br>asocia|registrada, inventario actualizado, comprobante emitido y<br>do, comprobante enviado, logs generados.|
|Flujo normal|1.<br>2.<br>3.|Vendedor inicia nueva venta.<br>Ingresa DNI y medio de contacto.<br>Sistema muestra catálogo y stock.|
||4.<br>5.|Vendedor selecciona producto, cantidad y forma de pago.<br>Sistema valida stock.|
||6.<br>7.<br>8.<br>9.<br>10.<br>11.<br>12.|Calcula total.<br>Vendedor confirma.<br>Sistema registra fecha, hora, vendedor y sucursal.<br>Actualiza inventario.<br>Genera comprobante.<br>Envía a SUNAT.<br>Asocia comprobante a venta.|
||13.|Envía por correo o WhatsApp. 14. Muestra confirmación.|
|Flujo<br>alternativo|3a.<br>5a.<br>6a.<br>rechaz<br>13a|Cliente no registrado: crear cliente rápido.<br>Pago mixto: dividir pago.<br>Stock insuficiente: ofrecer otra sede o cancelar. 11a. SUNAT<br>a:    mostrar error y permitir corrección.<br>. Falla envío: permitir reenvío.|
|Excepciones|Caída|de red, sesión expirada, producto sin precio, venta duplicada.|
|Reglas de|No ve|nder sin stock. Comprobante obligatorio. Stock se descuenta|





<!-- Start of picture text -->
UNIVERSIDAD NACIONAL DE SAN AGUSTIN<br>FACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS<br>ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMA<br>Som)<br>Formato:  Guía de Práctica de Laboratorio / Talleres / Centros de Simulación<br>|<br>a Aprobación:  2022/03/01  Qa Código: GUIA-PRLE-001  Página:  13<br>negocio  al confirmar. Solo sucursales autorizadas atienden compras<br>virtuales.<br>Requisitos  RF-05 a RF-12, RF-32 a RF-39; RNF-02, RNF-03, RNF-07, RNF-09,<br>asociados  RNF-11.<br>Prioridad  Alta<br>IV. ANEXOS<br>Enlace de grabación del la entrevista con el cliente:<br>VIDEO GPS - ENTREVISTA<br><!-- End of picture text -->

### III. CONCLUSIONES 

El levantamiento inicial evidencia una necesidad de centralizar la operación y mantener trazabilidad de entregas a distribuidoras, tandas de boletas, reabastecimientos y envíos de libros a provincia. El catálogo presentado sirve como base de conversación, no como versión final de requisitos. La validación con el gerente, las distribuidoras y la persona encargada de envíos es indispensable antes de diseñar o implementar el sistema. 

**REFERENCIAS Y BIBLIOGRAFÍA** ~~Es~~ 

