En la entrevista real, el cliente habla exclusivamente de talonarios de boletas físicas de papel (dos boleteros de 100 boletas por sede) que los vendedores llenan a mano. Lo de SUNAT fue una suposición técnica añadida en el LAB_02 que infló la complejidad.
A continuación tienes el resumen tangible de lo que el cliente realmente quiere, seguido de una batería de preguntas estratégicas para tu entrevista de hoy.

### I. Resumen Tangible: Lo que el cliente REALMENTE quiere (Entrevista.md)

#### 1. El Negocio y su dolor central
 - Qué vende: Libros educativos y especializados en quechua (Básico, Intermedio, Avanzado, Quechua Médico, Diccionarios). Unos 10 títulos en total.
 - Dónde vende: En 3 distribuidoras aliadas céntricas en Arequipa. Los libros están en consignación (siguen siendo de QSY hasta que se venden).
 - Volumen: 2 a 5 ventas diarias por local en días normales; hasta 15 en días pico.
 - El gran dolor operativo: Todo se anota en cuadernos duplicados. Para saber cuánto se vendió o liquidar dinero, Logística tiene que viajar físicamente (2 a 4 horas) y deducir las ventas por diferencia de conteo físico.

#### 2. La Venta en Mostrador (Restricciones críticas)
 - Demora actual: 3 a 5 minutos por venta (quieren bajarlo a menos de 2 minutos).
 - Dispositivo de trabajo: Los vendedores atienden exclusivamente con sus teléfonos celulares.
 - Conectividad: La señal móvil en el centro es inestable. El registro de ventas debe funcionar obligatoriamente sin internet (offline) y sincronizar al reconectar.
 - Datos mínimos del alumno: Nombre, DNI (clave para atender reclamos), libro, precio y forma de pago (Yape o efectivo).
 - Regla estricta: Cero ventas si no hay stock local. Precios fijos (nadie da descuentos).

#### 3. El problema de las Boletas (La realidad física)
 - Hoy la empresa les da 2 talonarios físicos de 100 boletas a cada sede.
 - Problemas reales: Los alumnos pierden la boleta; los vendedores llenan mal los datos o se olvidan de emitirla por la prisa; no se sabe qué vendedor cometió el error.
 - Lo que quiere: Que el registro de la venta quede guardado con el número de boleta correlativa, o que el estudiante reciba un comprobante fijo/digital para que cuando reclame por un libro con falla de imprenta se pueda buscar su DNI y verificar la compra.

#### 4. Reabastecimiento y Liquidación (El tiempo que pierden)

 - Liquidación: Es el proceso que más tiempo les hace perder (1 hora por local). Se calcula con una comisión fija monetaria por libro que se descuenta del total recaudado. Quieren que el sistema calcule esto de forma automática.
 - Reabastecimiento: Logística debe poder ver desde su panel cuántos libros le quedan a cada local para llevar exactamente lo que necesitan.

#### 5. Roles y Aislamiento de datos

 - Administrador (Gerente): Ve todo, cambia precios y catálogo, ve qué sucursal vende más, total de libros vendidos al mes/día y ganancias.
 - Logística: Gestiona inventario central, salidas especiales (mermas, cortesías docentes, sorteos con motivo obligatorio) y entregas.
 - Distribuidores: Solo ven su stock y sus ventas. Regla de negocio: No deben ver nada de las otras distribuidoras.

#### 6. Alcance acordado para el inicio

 - En la pregunta 83, el gerente fue tajante: si solo puede elegir tres cosas primero, elige Distribución, Ventas y Dashboard.
 - Dejó para una segunda etapa: Envíos a provincia, Panel de finanzas avanzado y Envío masivo por correo.


### II. Preguntas Clave para la Entrevista de Hoy

Estas preguntas te permitirán despejar supuestos y dejar el alcance perfectamente acotado:

#### 1. Sobre Comprobantes y SUNAT (La más importante)

"En la primera entrevista nos comentó que a cada distribuidor se le entregan talonarios de 100 boletas físicas. Queremos confirmar: ¿El sistema solo debe
ayudarles a registrar y controlar el número correlativo de esas boletas de papel y generar una constancia/ticket digital interno para el estudiante, o ustedes
tienen la obligación y desean integrarse directamente a la SUNAT para facturación electrónica oficial?"

(Objetivo: Confirmar si descartas la complejidad de SUNAT y te quedas con control de talonarios + ticket PDF/digital).

#### 2. Sobre el "Código del libro" y Reclamos

"Mencionó que cuando un estudiante reclama por una falla de fábrica en un libro, le piden su DNI y una 'foto del código del libro'. ¿Ese código es el código de
barras/ISBN del título (el mismo para todos los libros de nivel básico) o cada libro físico tiene un código único o número de serie individual pegado?"

(Objetivo: Saber si manejas stock por producto genérico o si tienes que registrar cada ejemplar individualmente).

#### 3. Sobre el flujo del dinero (Yape y Efectivo)

"Cuando los clientes pagan por Yape en las distribuidoras, ¿yapean a la cuenta personal del vendedor o al QR oficial de la editorial QSY? Y al momento de la
liquidación quincenal, ¿el distribuidor les entrega efectivo o les transfiere el monto neto?"

(Objetivo: Saber si el sistema solo concilia montos numéricos teóricos o si debe pedir captura/número de operación bancaria).

#### 4. Sobre la operación Offline (Sin internet)

"Dado que los locales trabajan desde celular con señal inestable: si un distribuidor se queda sin internet en el local y realiza una venta, ¿él seguirá
entregando la boleta de papel de su talonario y anotará la venta en la app para que sincronice después cuando vuelva la señal?"

(Objetivo: Validar que el soporte offline solo requiere persistencia local de la venta y correlativo).

#### 5. Sobre la entrega física y el "Piloto"

"¿Les interesaría que a fin de año o al terminar el desarrollo hagamos una prueba piloto en una sola distribuidora para validar la venta móvil antes de desplegarlo en las tres sedes?"

(Objetivo: Demostrar enfoque ágil y confirmar fechas reales de puesta en marcha).

Con estas 5 preguntas vas a dejar en evidencia qué era un requerimiento real del cliente y qué fue un "adorno" teórico del laboratorio anterior. ¿Hay algún otro punto específico del flujo que te genere dudas antes de tu reunión?
