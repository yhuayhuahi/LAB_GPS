# Sistema de Diseño y Guía de Estilos: Catppuccin Latte + DaddyTimeMono

Esta guía documenta la especificación visual, los roles cromáticos, la jerarquía tipográfica y las convenciones de maquetación utilizadas en la plantilla de diapositivas en **Typst**.

---

## 1. Filosofía del Diseño

El diseño de esta plantilla combina dos conceptos:
1. **Paleta Catppuccin Latte**: La versión clara (*light theme*) del popular ecosistema Catppuccin. Ofrece fondos suaves de baja fatiga visual (evitando blancos puros `#ffffff` que queman la vista en proyecciones) y una gama rica de acentos pasteles vibrantes con excelente contraste.
2. **Tipografía Monospace DaddyTimeMono Nerd Font**: Aporta una estética moderna, técnica y limpia de ingeniería de software. Al incluir glifos de *Nerd Fonts*, permite insertar iconos vectoriales nítidos directamente en el texto sin depender de imágenes externas.

---

## 2. Paleta Maestra Catppuccin Latte

| Token | Código Hex | Vista | Rol en la Plantilla |
| :--- | :---: | :---: | :--- |
| **`base`** | `#eff1f5` | `rgb(239, 241, 245)` | Fondo general del lienzo (canvas) de las diapositivas. |
| **`mantle`** | `#e6e9ef` | `rgb(230, 233, 239)` | Fondo de tarjetas, bloques de código, cabeceras y pie de página. |
| **`crust`** | `#dce0e8` | `rgb(220, 224, 232)` | Fondo de diapositivas de sección y cabeceras de tablas. |
| **`surface0`** | `#ccd0da` | `rgb(204, 208, 218)` | Bordes estándar de tarjetas, cajas y líneas divisorias. |
| **`surface1`** | `#bcc0cc` | `rgb(188, 192, 204)` | Bordes de tablas y separadores medianos. |
| **`surface2`** | `#acb0be` | `rgb(172, 176, 190)` | Bordes de elementos destacados o activos. |
| **`overlay0`** | `#9ca0b0` | `rgb(156, 160, 176)` | Separadores tenues e iconos neutros secundarios. |
| **`overlay1`** | `#8c8fa1` | `rgb(140, 143, 161)` | Texto sutil y marcas de tiempo. |
| **`overlay2`** | `#7c7f93` | `rgb(124, 127, 147)` | Números de diapositiva y etiquetas complementarias. |
| **`subtext0`** | `#6c6f85` | `rgb(108, 111, 133)` | Subtítulos, metadatos, autor y pie de página. |
| **`subtext1`** | `#5c5f77` | `rgb(92, 95, 119)` | Subtítulos principales y texto secundario destacado. |
| **`text`** | `#4c4f69` | `rgb(76, 79, 105)` | Texto de lectura principal (contraste óptimo WCAG AAA). |
| **`lavender`** | `#7287fd` | `rgb(114, 135, 253)` | **Acento primario**: Títulos principales, píldora de página y viñetas. |
| **`mauve`** | `#8839ef` | `rgb(136, 57, 239)` | **Acento de jerarquía**: Títulos de secciones, badges y números. |
| **`blue`** | `#1e66f5` | `rgb(30, 102, 245)` | Enlaces web, títulos informativos y métricas clave. |
| **`sapphire`**| `#209fb5` | `rgb(32, 159, 181)` | Etiquetas técnicas y tarjetas de arquitectura. |
| **`sky`** | `#04a5e5` | `rgb(4, 165, 229)` | Acento secundario de información y cielo. |
| **`teal`** | `#179299` | `rgb(23, 146, 153)` | Acento para componentes de almacenamiento y datos. |
| **`green`** | `#40a02b` | `rgb(64, 160, 43)` | Mensajes de éxito, buenas prácticas, SLA positivo y pros. |
| **`yellow`** | `#df8e1d` | `rgb(223, 142, 29)` | Cajas de advertencia, alertas preventivas y notas de atención. |
| **`peach`** | `#fe640b` | `rgb(254, 100, 11)` | Hitos de tiempo, acentos cálidos y transiciones. |
| **`maroon`** | `#e64553` | `rgb(230, 69, 83)` | Código inline (`raw`) y notas críticas intermedias. |
| **`red`** | `#d20f39` | `rgb(210, 15, 57)` | Errores críticos, riesgos altos, cuellos de botella y contras. |
| **`pink`** | `#ea76cb` | `rgb(234, 118, 203)` | Insignias especiales y conceptos creativos. |
| **`flamingo`**| `#dd7878` | `rgb(221, 120, 120)` | Acentos secundarios de atención. |
| **`rosewater`**| `#dc8a78`| `rgb(220, 138, 120)`| Acento cálido decorativo. |

---

## 3. Uso Específico de los Colores

### 3.1. Fondos y Superficies (Backgrounds)
* **`latte.base` (`#eff1f5`)**:
  Se aplica como fondo predeterminado de todas las diapositivas de contenido (`slide`) y portada (`title-slide`). Al ser un blanco roto ligeramente cálido, reduce el deslumbramiento en proyectores y pantallas de alta luminosidad.
* **`latte.mantle` (`#e6e9ef`)**:
  Se utiliza para contenedores elevados sobre el fondo base:
  - Tarjetas (`card`, `stat-card`, `step-card`).
  - Fondo de bloques de código (`code-block`).
  - Cajas de nota técnica (`note-box`).
  - Píldoras de números de diapositiva en el pie de página.
* **`latte.crust` (`#dce0e8`)**:
  Es el tono más oscuro de los fondos neutros. Se utiliza en:
  - Fondo completo de las diapositivas de cambio de sección (`section-slide`).
  - Barra superior de título en ventanas de código (estilo terminal).
  - Cabecera fija de tablas (`latte-table`).

### 3.2. Bordes y Separadores (Borders)
* **`latte.surface0` (`#ccd0da`) con grosor `0.8pt - 1.0pt`**:
  - Borde perimetral de todas las tarjetas y componentes.
  - Línea horizontal divisoria superior (debajo del título de la diapositiva).
  - Línea horizontal divisoria inferior (arriba del pie de página).
* **`latte.surface1` (`#bcc0cc`) con grosor `0.6pt`**:
  - Rejilla y divisores internos en tablas (`latte-table`).
* **Bordes de acento semántico (Izquierdo `3.5pt - 4.0pt`)**:
  - En las cajas de llamada (`callout`), el borde izquierdo utiliza el color de estado correspondiente (`blue` para información, `green` para consejos, `yellow` para advertencias, `red` para errores).

### 3.3. Títulos y Jerarquía Tipográfica
* **Título de Portada**:
  - Color: `latte.lavender` (`#7287fd`).
  - Peso: `bold` (Negrita).
  - Tamaño: `26pt` a `28pt`.
* **Subtítulo de Portada**:
  - Color: `latte.subtext1` (`#5c5f77`).
  - Tamaño: `14pt`.
* **Título de Diapositiva (`slide`)**:
  - Color: `latte.text` (`#4c4f69`).
  - Peso: `bold`.
  - Tamaño: `15pt`.
* **Subtítulo de Diapositiva**:
  - Color: `latte.subtext0` (`#6c6f85`).
  - Tamaño: `10.5pt`.
* **Título de Sección (`section-slide`)**:
  - Color: `latte.text` (`#4c4f69`), con número en `latte.lavender` (`#7287fd`).
  - Tamaño: `22pt` (título) y `34pt` (número).
* **Títulos de Tarjetas y Componentes**:
  - Color: Acento de la tarjeta (`lavender`, `blue`, `sapphire`, `teal`, `mauve`).
  - Peso: `bold`.
  - Tamaño: `11.5pt` a `12pt`.

### 3.4. Texto de Contenido y Lectura
* **Cuerpo de texto principal**:
  - Color: `latte.text` (`#4c4f69`).
  - Tamaño: `12.5pt` (interlineado `0.65em`).
  - Cumple con una relación de contraste superior a **9.5:1** sobre `base`, superando con creces el estándar de accesibilidad WCAG AAA.
* **Metadatos y Pie de Página**:
  - Color: `latte.subtext0` (`#6c6f85`).
  - Tamaño: `8.5pt` a `9pt`.
* **Código en línea (`inline code`)**:
  - Color de texto: `latte.maroon` (`#e64553`).
  - Fondo: `latte.mantle` (`#e6e9ef`).
  - Borde: `0.5pt` en `latte.surface0` (`#ccd0da`).
* **Enlaces (`link`)**:
  - Color: `latte.blue` (`#1e66f5`) con subrayado continuo fino de `0.8pt`.

---

## 4. Tipografía: DaddyTimeMono Nerd Font

La fuente seleccionada es **`DaddyTimeMono Nerd Font`**, una tipografía monoespaciada con soporte nativo de glifos extendidos.

### 4.1. Escala de Tamaños
```
+--------------------------------------------------------+
| 34pt - 38pt : Números de sección gigantes (#section)   |
| 26pt - 28pt : Título principal de la portada           |
| 22pt - 24pt : Título de sección de capítulo            |
| 18pt - 20pt : Citas textuales destacadas (#focus-slide)|
| 15pt - 16pt : Título de diapositiva estándar           |
| 13pt - 14pt : Subtítulo de portada / subtítulos medios |
| 12.5pt      : Texto base de lectura (cuerpo)           |
| 11pt - 11.5pt: Títulos de tarjetas / cajas semánticas  |
| 10pt - 10.5pt: Tablas / texto secundario en columnas   |
| 8.5pt - 9.0pt: Pie de página, metadatos, insignias     |
+--------------------------------------------------------+
```

### 4.2. Reglas de Maquetación Monoespaciada
1. **Evitar Justificación de Párrafos (`justify: false`)**:
   Las fuentes monoespaciadas tienen caracteres de ancho fijo. Si se fuerza la justificación completa, se generan espacios en blanco desiguales ("ríos"). Es preferible la alineación a la izquierda (`left`).
2. **Interlineado Respirable (`leading: 0.65em`)**:
   Los glifos monoespaciados necesitan separación vertical adecuada para mantener el flujo visual sin amontonamiento.
3. **Marcadores de Listas Técnicos**:
   - Viñetas de lista no ordenada: Símbolo `` en `latte.lavender`.
   - Listas numeradas: Número con punto `#n.` en negrita con `latte.mauve`.

### 4.3. Glifos Nerd Font Recomendados
No es necesario importar archivos SVG o PNG para la iconografía básica. La fuente ya incluye los siguientes iconos listos para usar:

| Glifo | Código / Carácter | Uso Semántico Sugerido |
| :---: | :---: | :--- |
| `󰑴` | `\u{f0474}` | Insignia institucional, evento o capítulo |
| `󰘥` | `\u{f0625}` | Universidad, facultad, escuela académica |
| `` | `\u{f432}` | Flecha de avance, autor, puntero de lista |
| `󰒋` | `\u{f048b}` | Arquitectura, nodos de red, servicios |
| `󰙨` | `\u{f0668}` | Bus de eventos, pipelines, mensajería |
| `󰈙` | `\u{f0219}` | Documentación, bases de datos, notas |
| `󰅐` | `\u{f0150}` | Tiempo, latencia, reloj, cronómetro |
| `󰄳` | `\u{f0133}` | Aprobado, check, éxito, ventaja |
| `󰅚` | `\u{f015a}` | Error, fallo, alerta crítica, desventaja |
| `󰀦` | `\u{f0026}` | Advertencia, precaución, riesgo |
| `󰋽` | `\u{f02fd}` | Información, bombilla de idea |
| `󰌠` | `\u{f0320}` | Consejo, buena práctica, tip |
| `󰓅` | `\u{f04c5}` | Rendimiento, velocidad, throughput |
| `󰊤` | `\u{f02a4}` | Repositorio Git / GitHub |
| `󰇮` | `\u{f01ee}` | Correo electrónico / contacto |
| `󰃭` | `\u{f00ed}` | Calendario / fecha de presentación |

---

## 5. Catálogo de Componentes Visuales

### 5.1. Cajas Semánticas (`callouts`)
```typst
#info-box(title: "Información")[Mensaje informativo con tinte Sky/Blue.]
#tip-box(title: "Buena Práctica")[Recomendación con borde verde y tinte Green.]
#warning-box(title: "Atención")[Aviso preventivo con acento Yellow.]
#alert-box(title: "Error")[Alerta crítica con acento Red.]
#note-box(title: "Nota")[Comentario técnico en fondo Mantle y acento Lavender.]
```

### 5.2. Tarjetas de Métricas (`stat-card`)
Especiales para resaltar números clave, SLAs o estadísticas cuantitativas:
```typst
#stat-card(
  value: "99.98%",
  label: "Disponibilidad SLA",
  icon: "󰅐",
  color: latte.green,
  description: "Ventana móvil de 90 días"
)
```

### 5.3. Bloque de Código Estilo Terminal (`code-block`)
Incorpora la barra de cabecera con los tres botones estilo macOS (rojo `#d20f39`, amarillo `#df8e1d`, verde `#40a02b`), nombre de archivo y etiqueta de lenguaje:
```typst
#code-block(
  lang: "Rust",
  filename: "src/worker.rs",
  ```rust
  fn main() {
      println!("Catppuccin Latte en acción");
  }
  ```
)
```

### 5.4. Pasos de Proceso (`step-card`)
Ideal para explicar flujos secuenciales, pipelines de CI/CD o algoritmos paso a paso:
```typst
#step-card(
  number: 1,
  title: "Fase de Validación",
  desc: "Análisis estático y pruebas unitarias automáticas.",
  color: latte.lavender,
)
```

### 5.5. Tablas Estilizadas (`latte-table`)
Diseñadas con cabecera en `latte.crust`, filas alternadas en `latte.base` y `latte.mantle`, y bordes finos en `latte.surface1`:
```typst
#latte-table(
  columns: (1fr, 1fr),
  headers: ("Parámetro", "Valor"),
  rows: (
    ("Tiempo de respuesta", "< 10 ms"),
    ("Tolerancia a fallos", "Activo-Activo"),
  )
)
```

### 5.6. Comparativa de Pros y Contras (`pro-con`)
Muestra en dos columnas equilibradas las ventajas (verde) y desventajas (rojo):
```typst
#pro-con(
  pros: ("Desacoplamiento", "Escalabilidad"),
  cons: ("Latencia de red", "Mayor complejidad"),
)
```

---

## 6. Estructura de Archivos del Proyecto

```
slide-template/
├── .helix/
│   └── languages.toml        # Integración con Tinymist LSP para Helix
├── build/
│   └── main.pdf              # Salida PDF compilada
├── img/
│   ├── logo_abet.png         # Logo institucional ABET
│   └── logo_episunsa.png     # Logo institucional EPIS UNSA
├── compile.sh                # Script ejecutable de compilación (chmod +x)
├── palette.typ               # Definición completa de la paleta Catppuccin Latte
├── theme.typ                 # Motor de diapositivas y componentes visuales
├── main.typ                  # Archivo principal de configuración y ensamble
├── content.typ               # Contenido de las diapositivas
├── DESIGN_SYSTEM.md          # Esta guía completa de diseño y colores
└── README.md                 # Guía rápida de uso y comandos
```

---

## 7. Instrucciones de Compilación

Para compilar la presentación a PDF, ejecuta desde la carpeta `slide-template`:
```bash
./compile.sh
```
O directamente con el comando de Typst:
```bash
typst compile main.typ build/main.pdf
```

Para ver la presentación con recarga en vivo durante la edición:
```bash
typst watch main.typ build/main.pdf
```
