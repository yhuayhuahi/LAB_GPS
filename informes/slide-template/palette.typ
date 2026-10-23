// ==============================================================================
// PALETA DE COLORES CATPPUCCIN LATTE (OFICIAL)
// Especificación para presentaciones y componentes en Typst
// ==============================================================================

#let latte = (
  // Acentos cromáticos
  rosewater: rgb("#dc8a78"),
  flamingo:  rgb("#dd7878"),
  pink:      rgb("#ea76cb"),
  mauve:     rgb("#8839ef"),
  red:       rgb("#d20f39"),
  maroon:    rgb("#e64553"),
  peach:     rgb("#fe640b"),
  yellow:    rgb("#df8e1d"),
  green:     rgb("#40a02b"),
  teal:      rgb("#179299"),
  sky:       rgb("#04a5e5"),
  sapphire:  rgb("#209fb5"),
  blue:      rgb("#1e66f5"),
  lavender:  rgb("#7287fd"),

  // Tonos neutros (texto y contraste)
  text:      rgb("#4c4f69"), // Texto principal (contraste óptimo en fondo claro)
  subtext1:  rgb("#5c5f77"), // Subtítulos y texto secundario destacado
  subtext0:  rgb("#6c6f85"), // Metadatos, pies de página, etiquetas secundarias
  overlay2:  rgb("#7c7f93"), // Texto sutil, números de diapositiva
  overlay1:  rgb("#8c8fa1"), // Iconos neutros, divisores intermedios
  overlay0:  rgb("#9ca0b0"), // Divisores suaves, bordes tenues

  // Superficies y capas
  surface2:  rgb("#acb0be"), // Bordes destacados y elementos interactivos activos
  surface1:  rgb("#bcc0cc"), // Bordes de tablas y separadores
  surface0:  rgb("#ccd0da"), // Bordes de tarjetas y contenedores

  // Fondos
  base:      rgb("#eff1f5"), // Fondo general del lienzo de las diapositivas
  mantle:    rgb("#e6e9ef"), // Fondo de tarjetas, bloques de código, cabeceras y pies
  crust:     rgb("#dce0e8"), // Fondo de diapositivas de sección y contraste profundo
)

// Roles semánticos directos
#let bgSlide       = latte.base
#let bgCard        = latte.mantle
#let bgSection     = latte.crust
#let textPrimary   = latte.text
#let textSecondary = latte.subtext0
#let textMuted     = latte.overlay1
#let borderCard    = latte.surface0
#let borderStrong  = latte.surface2

// Acentos funcionales de estado
#let colorPrimary  = latte.lavender
#let colorAccent   = latte.mauve
#let colorInfo     = latte.blue
#let colorSuccess  = latte.green
#let colorWarning  = latte.yellow
#let colorDanger   = latte.red
#let colorTip      = latte.teal
