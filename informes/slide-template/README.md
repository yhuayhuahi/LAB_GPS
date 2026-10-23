# Plantilla de Diapositivas en Typst (Catppuccin Latte)

Plantilla para la creación de presentaciones y diapositivas técnicas en [Typst](https://typst.app/), configurada con la paleta oficial **Catppuccin Latte** y la fuente de sistema **DaddyTimeMono Nerd Font**.

---

## Características

- 🎨 **Paleta Oficial Catppuccin Latte**: Tonos claros suaves de baja fatiga visual, sin recurrir a blancos puros molestos.
- 🔤 **Tipografía DaddyTimeMono Nerd Font**: Estética monospace de ingeniería con iconos vectoriales integrados sin requerir SVG externos.
- 🖼️ **Relación de Aspecto 16:9 Panorámica**: Diseñada específicamente para proyectores modernos y monitores actuales.
- 📦 **Componentes Listos para Usar**:
  - Diapositivas de portada (`title-slide`), contenido (`slide`), cambio de sección (`section-slide`), enfoque (`focus-slide`) y lienzo libre (`blank-slide`).
  - Cajas semánticas (`info-box`, `tip-box`, `warning-box`, `alert-box`, `note-box`).
  - Tarjetas de métricas y KPIs (`stat-card`).
  - Bloques de código con ventana de terminal (`code-block`).
  - Pasos secuenciales de proceso (`step-card`).
  - Tablas alternadas (`latte-table`) y comparativas (`pro-con`).
  - Soporte de 2 y 3 columnas (`columns-2`, `columns-3`).
- ⚡ **Compilación Ultrarrápida y Nativa**: Sin dependencias complejas ni paquetes externos frágiles.
- 🛠️ **Integración con Helix / Tinymist**: Configuración LSP lista en `.helix/languages.toml`.

---

## Documentación Completa de Diseño

Para conocer el detalle exacto de la paleta, códigos hexadecimales, tamaños de fuente, contrastes WCAG y reglas de uso para cada componente, consulta:
👉 **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**

---

## Estructura de Archivos

```
slide-template/
├── .helix/
│   └── languages.toml       # Configuración para Tinymist LSP en Helix
├── build/
│   └── main.pdf             # PDF compilado
├── img/                     # Recursos gráficos y logos
│   ├── logo_abet.png
│   └── logo_episunsa.png
├── compile.sh               # Script de compilación automática
├── palette.typ              # Definición de colores Catppuccin Latte
├── theme.typ                # Funciones de maquetación y componentes
├── main.typ                 # Configuración de variables (autor, título, logos)
├── content.typ              # Diapositivas y contenido editable
├── DESIGN_SYSTEM.md         # Manual exhaustivo de colores y tamaños
└── README.md                # Este archivo
```

---

## Uso Rápido

### 1. Personalizar Metadatos
Edita `main.typ` para cambiar el título, expositor, institución, fecha y evento:
```typst
#let itemTitle       = "Tu Título Aquí"
#let itemAuthor      = "Tu Nombre"
#let itemInstitution = "Universidad Nacional de San Agustín"
#let itemDate        = "2026"
```

### 2. Escribir Diapositivas
Edita `content.typ` y agrega tus diapositivas con la sintaxis:
```typst
#slide(title: "Título de la Diapositiva", subtitle: "Subtítulo opcional", section: "SECCIÓN")[
  Tu contenido en DaddyTimeMono aquí.
  - Viñeta 1
  - Viñeta 2
  
  #info-box(title: "Información")[
    Mensaje destacado con Catppuccin Latte.
  ]
]
```

### 3. Compilar
Ejecuta el script:
```bash
./compile.sh
```
El archivo resultante se guardará en `build/main.pdf`.
