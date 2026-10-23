// ==============================================================================
// MOTOR DE PRESENTACIÓN Y COMPONENTES VISUALES (TYPST)
// Estilo Catppuccin Latte + Tipografía DaddyTimeMono Nerd Font
// ==============================================================================

#import "palette.typ": *

// ------------------------------------------------------------------------------
// FUENTE PRINCIPAL Y FAMILIAS DE RESPALDO
// ------------------------------------------------------------------------------
#let fontSlide = (
  "DaddyTimeMono Nerd Font",
  "DaddyTimeMono Nerd Font Propo",
  "DaddyTimeMono Nerd Font Mono",
)

// ------------------------------------------------------------------------------
// ESTADO GLOBAL DE METADATOS DE LA PRESENTACIÓN
// ------------------------------------------------------------------------------
#let presMeta = state("pres-meta", (
  title: "Título de la Presentación",
  short-title: none,
  subtitle: none,
  author: "Nombre del Expositor",
  institution: "Universidad Nacional de San Agustín",
  date: "2026",
  event: none,
  logo: "img/logo_episunsa.png",
))

// Función para inicializar los metadatos globales
#let setup-presentation(
  title: "Título de la Presentación",
  short-title: none,
  subtitle: none,
  author: "Nombre del Expositor",
  institution: "Universidad Nacional de San Agustín",
  date: "2026",
  event: none,
  logo: "img/logo_episunsa.png",
) = {
  presMeta.update((
    title: title,
    short-title: if short-title != none { short-title } else { title },
    subtitle: subtitle,
    author: author,
    institution: institution,
    date: date,
    event: event,
    logo: logo,
  ))
}

// ------------------------------------------------------------------------------
// ESTILOS GLOBALES DE TEXTO Y ELEMENTOS
// ------------------------------------------------------------------------------
#let apply-slide-styles(body) = {
  set text(
    font: fontSlide,
    size: 12.5pt,
    fill: latte.text,
    lang: "es",
  )

  set par(
    leading: 0.65em,
    justify: false,
  )

  // Marcadores de listas con acento Lavender
  set list(
    marker: text(fill: latte.lavender, size: 8.5pt)[],
    spacing: 1.1em,
  )

  // Enumeraciones con acento Mauve
  set enum(
    numbering: n => text(fill: latte.mauve, weight: "bold")[#n.],
    spacing: 1.1em,
  )

  // Resaltado de código inline
  show raw.where(block: false): it => box(
    fill: latte.mantle,
    inset: (x: 5pt, y: 1.5pt),
    outset: (y: 2pt),
    radius: 3.5pt,
    stroke: 0.5pt + latte.surface0,
    text(fill: latte.maroon, weight: "bold", size: 0.9em, it)
  )

  // Enlaces con acento Blue
  show link: it => underline(stroke: 0.8pt + latte.blue)[#text(fill: latte.blue)[#it]]

  body
}

// ------------------------------------------------------------------------------
// 1. DIAPOSITIVA DE PORTADA (TITLE SLIDE)
// ------------------------------------------------------------------------------
#let title-slide(
  title: none,
  subtitle: none,
  author: none,
  institution: none,
  date: none,
  event: none,
  logo: auto,
  tags: (),
) = context {
  let meta = presMeta.get()
  let tTitle = if title != none { title } else { meta.title }
  let tSubtitle = if subtitle != none { subtitle } else { meta.subtitle }
  let tAuthor = if author != none { author } else { meta.author }
  let tInst = if institution != none { institution } else { meta.institution }
  let tDate = if date != none { date } else { meta.date }
  let tEvent = if event != none { event } else { meta.event }
  let tLogo = if logo != auto { logo } else { meta.logo }

  page(
    paper: "presentation-16-9",
    fill: latte.base,
    margin: (top: 1.6cm, bottom: 1.4cm, left: 2.2cm, right: 2.2cm),
    header: none,
    footer: none,
  )[
    #show: apply-slide-styles

    // Barra decorativa superior de acento tricolor Catppuccin
    #place(top + left, dy: -0.9cm)[
      #grid(
        columns: (40pt, 40pt, 40pt),
        gutter: 4pt,
        rect(width: 100%, height: 4pt, fill: latte.lavender, radius: 2pt),
        rect(width: 100%, height: 4pt, fill: latte.sapphire, radius: 2pt),
        rect(width: 100%, height: 4pt, fill: latte.teal, radius: 2pt),
      )
    ]

    #align(horizon)[
      #grid(
        columns: (1fr, if tLogo != none { auto } else { 0pt }),
        gutter: 20pt,
        align: (left + horizon, right + horizon),
        [
          // Subtítulo superior o Evento
          #if tEvent != none [
            #box(
              fill: latte.mantle,
              radius: 4pt,
              inset: (x: 8pt, y: 4pt),
              stroke: 0.8pt + latte.surface0,
              text(fill: latte.mauve, size: 9pt, weight: "bold")[
                󰑴 #upper(tEvent)
              ]
            )
            #v(10pt)
          ]

          // Título Principal
          #text(
            font: fontSlide,
            size: 26pt,
            weight: "bold",
            fill: latte.lavender,
          )[#tTitle]

          #if tSubtitle != none [
            #v(6pt)
            #text(
              font: fontSlide,
              size: 14pt,
              fill: latte.subtext1,
            )[#tSubtitle]
          ]

          #v(20pt)

          // Tarjeta de Metadatos del Expositor
          #box(
            fill: latte.mantle,
            stroke: 1pt + latte.surface0,
            radius: 8pt,
            inset: (x: 16pt, y: 12pt),
            [
              #grid(
                columns: (auto, auto),
                gutter: 18pt,
                align: horizon,
                [
                  #text(fill: latte.text, weight: "bold", size: 12pt)[ #tAuthor] \
                  #v(2pt)
                  #text(fill: latte.subtext0, size: 9.5pt)[󰘥 #tInst]
                ],
                [
                  #text(fill: latte.subtext0, size: 9.5pt)[󰃭 #tDate]
                ]
              )
            ]
          )

          // Tags opcionales
          #if tags.len() > 0 [
            #v(10pt)
            #grid(
              columns: tags.map(_ => auto),
              gutter: 6pt,
              ..tags.map(tag => box(
                fill: latte.crust,
                radius: 3.5pt,
                inset: (x: 6pt, y: 3pt),
                stroke: 0.5pt + latte.surface1,
                text(fill: latte.sapphire, size: 8.5pt, weight: "bold")[#tag]
              ))
            )
          ]
        ],
        [
          #if tLogo != none [
            #box(
              fill: latte.mantle,
              stroke: 1pt + latte.surface0,
              radius: 12pt,
              inset: 16pt,
              image(tLogo, width: 3.8cm)
            )
          ]
        ]
      )
    ]
  ]
}

// ------------------------------------------------------------------------------
// 2. DIAPOSITIVA ESTÁNDAR DE CONTENIDO (SLIDE)
// ------------------------------------------------------------------------------
#let slide(
  title: none,
  subtitle: none,
  section: none,
  align-content: top,
  body,
) = context {
  let meta = presMeta.get()

  page(
    paper: "presentation-16-9",
    fill: latte.base,
    margin: (top: 2.3cm, bottom: 1.5cm, left: 2.0cm, right: 2.0cm),
    header: context {
      set text(font: fontSlide, size: 9pt, fill: latte.subtext0)
      place(top, dy: 0.6cm)[
        #grid(
          columns: (1fr, auto),
          align: (left + horizon, right + horizon),
          [
            #if section != none [
              #box(
                fill: latte.mantle,
                radius: 3.5pt,
                inset: (x: 6pt, y: 3pt),
                stroke: 0.6pt + latte.surface0,
                text(fill: latte.mauve, weight: "bold", size: 8.5pt)[
                  󰒋 #upper(section)
                ]
              )
              #h(8pt)
            ]
            #if title != none [
              #text(fill: latte.text, weight: "bold", size: 15pt)[#title]
            ]
            #if subtitle != none [
              #text(fill: latte.subtext0, size: 10.5pt)[ — #subtitle]
            ]
          ],
          [
            // Puntos decorativos estilo Catppuccin
            #box(
              grid(
                columns: (auto, auto, auto),
                gutter: 4pt,
                align: horizon,
                circle(radius: 3pt, fill: latte.lavender),
                circle(radius: 3pt, fill: latte.sapphire),
                circle(radius: 3pt, fill: latte.teal),
              )
            )
          ]
        )
        #v(5pt)
        #line(length: 100%, stroke: 0.8pt + latte.surface0)
      ]
    },
    footer: context {
      set text(font: fontSlide, size: 8.5pt, fill: latte.subtext0)
      place(bottom, dy: -0.5cm)[
        #line(length: 100%, stroke: 0.6pt + latte.surface0)
        #v(5pt)
        #grid(
          columns: (1fr, 1fr, auto),
          align: (left + horizon, center + horizon, right + horizon),
          [
            #text(weight: "bold", fill: latte.text)[#meta.short-title]
            #if meta.author != none [ · #meta.author]
          ],
          [
            #if meta.event != none [ #meta.event · ] #meta.date
          ],
          [
            #box(
              fill: latte.mantle,
              radius: 4pt,
              inset: (x: 7pt, y: 2.5pt),
              stroke: 0.6pt + latte.surface0,
              text(fill: latte.lavender, weight: "bold", size: 8.5pt)[
                #counter(page).display("1 / 1", both: true)
              ]
            )
          ]
        )
      ]
    },
  )[
    #show: apply-slide-styles
    #align(align-content)[#body]
  ]
}

// ------------------------------------------------------------------------------
// 3. DIAPOSITIVA DE SECCIÓN / DIVISIÓN (SECTION SLIDE)
// ------------------------------------------------------------------------------
#let section-slide(
  number: none,
  title: none,
  subtitle: none,
  body: none,
) = context {
  page(
    paper: "presentation-16-9",
    fill: latte.crust,
    margin: (top: 2.0cm, bottom: 1.8cm, left: 2.4cm, right: 2.4cm),
    header: none,
    footer: none,
  )[
    #show: apply-slide-styles

    #align(horizon)[
      #box(
        width: 100%,
        fill: latte.base,
        stroke: 1.2pt + latte.surface0,
        radius: 12pt,
        inset: (x: 28pt, y: 24pt),
        [
          #grid(
            columns: (if number != none { auto } else { 0pt }, 1fr),
            gutter: 24pt,
            align: horizon,
            [
              #if number != none [
                #box(
                  fill: latte.mantle,
                  stroke: 1.5pt + latte.lavender,
                  radius: 10pt,
                  inset: (x: 18pt, y: 12pt),
                  align(center + horizon)[
                    #text(size: 34pt, weight: "bold", fill: latte.lavender)[#number]
                  ]
                )
              ]
            ],
            [
              #box(
                fill: latte.mantle,
                radius: 4pt,
                inset: (x: 7pt, y: 3pt),
                text(size: 9pt, weight: "bold", fill: latte.mauve)[󰑴 SECCIÓN / CAPÍTULO]
              )
              #v(6pt)
              #text(size: 22pt, weight: "bold", fill: latte.text)[#title]
              #if subtitle != none [
                #v(4pt)
                #text(size: 13pt, fill: latte.subtext0)[#subtitle]
              ]
            ]
          )

          #if body != none [
            #v(14pt)
            #line(length: 100%, stroke: 0.8pt + latte.surface0)
            #v(10pt)
            #body
          ]
        ]
      )
    ]
  ]
}

// ------------------------------------------------------------------------------
// 4. DIAPOSITIVA DE ENFOQUE / CITA (FOCUS SLIDE)
// ------------------------------------------------------------------------------
#let focus-slide(
  quote: none,
  author: none,
  role: none,
  body: none,
) = context {
  page(
    paper: "presentation-16-9",
    fill: latte.mantle,
    margin: 2.5cm,
    header: none,
    footer: none,
  )[
    #show: apply-slide-styles

    #align(center + horizon)[
      #box(
        width: 88%,
        fill: latte.base,
        stroke: 1.2pt + latte.lavender,
        radius: 12pt,
        inset: 28pt,
        [
          #text(size: 40pt, fill: latte.lavender, weight: "bold")[“]
          #v(-14pt)
          #if quote != none [
            #text(size: 18pt, weight: "bold", fill: latte.text, style: "italic")[
              #quote
            ]
          ] else [
            #body
          ]
          #v(12pt)
          #if author != none [
            #line(length: 30%, stroke: 1pt + latte.lavender)
            #v(6pt)
            #text(size: 12pt, weight: "bold", fill: latte.mauve)[— #author]
            #if role != none [
              #text(size: 10pt, fill: latte.subtext0)[ (#role)]
            ]
          ]
        ]
      )
    ]
  ]
}

// ------------------------------------------------------------------------------
// 5. DIAPOSITIVA EN BLANCO (CANVAS / MEDIA SLIDE)
// ------------------------------------------------------------------------------
#let blank-slide(title: none, body) = context {
  page(
    paper: "presentation-16-9",
    fill: latte.base,
    margin: 1.5cm,
    header: if title != none {
      align(left)[
        #text(font: fontSlide, size: 14pt, weight: "bold", fill: latte.text)[#title]
        #v(4pt)
        #line(length: 100%, stroke: 0.8pt + latte.surface0)
      ]
    } else { none },
    footer: none,
  )[
    #show: apply-slide-styles
    #align(center + horizon)[#body]
  ]
}

// ==============================================================================
// COMPONENTES Y BLOQUES VISUALES ESTILIZADOS
// ==============================================================================

// ------------------------------------------------------------------------------
// CALLOUT GENÉRICO
// ------------------------------------------------------------------------------
#let callout(
  title: none,
  icon: none,
  fill: latte.mantle,
  stroke: latte.lavender,
  text-color: latte.text,
  body,
) = {
  block(
    width: 100%,
    fill: fill,
    stroke: (left: 4pt + stroke, rest: 0.8pt + latte.surface0),
    radius: (right: 6pt),
    inset: (x: 14pt, y: 10pt),
    [
      #if title != none [
        #block(below: 6pt)[
          #if icon != none [
            #text(fill: stroke, weight: "bold", size: 11.5pt)[#icon]
            #h(6pt)
          ]
          #text(fill: stroke, weight: "bold", size: 11pt)[#upper(title)]
        ]
      ]
      #set text(fill: text-color, size: 11pt)
      #body
    ]
  )
}

// Cajas semánticas predefinidas
#let info-box(title: "INFORMACIÓN", icon: "󰋽", body) = callout(
  title: title,
  icon: icon,
  fill: rgb("#f0f6fe"), // Tinte suave de Blue
  stroke: latte.blue,
  body
)

#let tip-box(title: "CONSEJO / BUENA PRÁCTICA", icon: "󰌠", body) = callout(
  title: title,
  icon: icon,
  fill: rgb("#f0f8f4"), // Tinte suave de Green
  stroke: latte.green,
  body
)

#let warning-box(title: "ADVERTENCIA", icon: "󰀦", body) = callout(
  title: title,
  icon: icon,
  fill: rgb("#fff9f0"), // Tinte suave de Yellow
  stroke: latte.yellow,
  body
)

#let alert-box(title: "PELIGRO / ERROR CRÍTICO", icon: "󰅚", body) = callout(
  title: title,
  icon: icon,
  fill: rgb("#fef3f4"), // Tinte suave de Red
  stroke: latte.red,
  body
)

#let note-box(title: "NOTA TÉCNICA", icon: "󰈙", body) = callout(
  title: title,
  icon: icon,
  fill: latte.mantle,
  stroke: latte.lavender,
  body
)

// ------------------------------------------------------------------------------
// TARJETAS DE MÉTRICAS (STAT CARDS)
// ------------------------------------------------------------------------------
#let stat-card(
  value: "0.0",
  label: "Métrica",
  icon: none,
  color: latte.lavender,
  description: none,
) = {
  block(
    width: 100%,
    fill: latte.mantle,
    stroke: 1pt + latte.surface0,
    radius: 8pt,
    inset: (x: 14pt, y: 12pt),
    [
      #grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        [
          #text(size: 26pt, weight: "bold", fill: color)[#value]
        ],
        [
          #if icon != none [
            #box(
              fill: latte.base,
              radius: 6pt,
              inset: 6pt,
              stroke: 0.5pt + latte.surface0,
              text(size: 16pt, fill: color)[#icon]
            )
          ]
        ]
      )
      #v(4pt)
      #text(size: 10.5pt, weight: "bold", fill: latte.text)[#label]
      #if description != none [
        #v(2pt)
        #text(size: 9pt, fill: latte.subtext0)[#description]
      ]
    ]
  )
}

// ------------------------------------------------------------------------------
// TARJETA DE CONTENIDO GENÉRICA (CARD)
// ------------------------------------------------------------------------------
#let card(
  title: none,
  icon: none,
  accent: latte.lavender,
  body,
) = {
  block(
    width: 100%,
    fill: latte.mantle,
    stroke: 1pt + latte.surface0,
    radius: 8pt,
    inset: 14pt,
    [
      #if title != none [
        #grid(
          columns: (if icon != none { auto } else { 0pt }, 1fr),
          gutter: 6pt,
          align: horizon,
          [#if icon != none { text(fill: accent, size: 12pt, weight: "bold")[#icon] }],
          [#text(fill: accent, weight: "bold", size: 11.5pt)[#title]]
        )
        #v(4pt)
        #line(length: 100%, stroke: 0.5pt + latte.surface0)
        #v(6pt)
      ]
      #set text(size: 11pt, fill: latte.text)
      #body
    ]
  )
}

// ------------------------------------------------------------------------------
// BADGES / PILLS DE ESTADO
// ------------------------------------------------------------------------------
#let badge(
  text-label,
  color: latte.lavender,
  icon: none,
) = {
  box(
    fill: latte.mantle,
    radius: 4pt,
    inset: (x: 6pt, y: 2.5pt),
    stroke: 0.8pt + color,
    [
      #if icon != none [
        #text(fill: color, size: 8.5pt, weight: "bold")[#icon]
        #h(4pt)
      ]
      #text(fill: color, size: 8.5pt, weight: "bold")[#text-label]
    ]
  )
}

// ------------------------------------------------------------------------------
// BLOQUE DE CÓDIGO CON CABECERA DE VENTANA (CODE BLOCK)
// ------------------------------------------------------------------------------
#let code-block(
  code,
  lang: none,
  filename: none,
) = {
  block(
    width: 100%,
    stroke: 1pt + latte.surface0,
    radius: 7pt,
    fill: latte.mantle,
    clip: true,
    [
      #block(
        width: 100%,
        fill: latte.crust,
        inset: (x: 10pt, y: 6pt),
        stroke: (bottom: 1pt + latte.surface0),
        [
          #grid(
            columns: (auto, 1fr, auto),
            align: (horizon, center + horizon, horizon),
            gutter: 8pt,
            // Botones de ventana macOS estilo Catppuccin
            box(grid(
              columns: (auto, auto, auto),
              gutter: 4pt,
              circle(radius: 3.5pt, fill: latte.red),
              circle(radius: 3.5pt, fill: latte.yellow),
              circle(radius: 3.5pt, fill: latte.green),
            )),
            if filename != none {
              text(size: 9.5pt, fill: latte.subtext1, weight: "bold")[#filename]
            } else { none },
            if lang != none {
              box(
                fill: latte.base,
                radius: 3pt,
                inset: (x: 5pt, y: 2pt),
                stroke: 0.5pt + latte.surface0,
                text(size: 8.5pt, fill: latte.blue, weight: "bold")[#lang]
              )
            } else { none }
          )
        ]
      )
      #pad(top: 8pt, bottom: 8pt, left: 12pt, right: 12pt)[
        #set text(size: 10.5pt)
        #code
      ]
    ]
  )
}

// ------------------------------------------------------------------------------
// TARJETA DE PROCESO / PASOS SECUENCIALES (STEP CARD)
// ------------------------------------------------------------------------------
#let step-card(
  number: 1,
  title: "Paso",
  desc: none,
  color: latte.lavender,
) = {
  block(
    width: 100%,
    fill: latte.mantle,
    stroke: 1pt + latte.surface0,
    radius: 8pt,
    inset: 12pt,
    [
      #grid(
        columns: (auto, 1fr),
        gutter: 10pt,
        align: horizon,
        box(
          fill: color,
          radius: 6pt,
          inset: (x: 8pt, y: 4pt),
          text(fill: latte.base, weight: "bold", size: 11pt)[#number]
        ),
        [
          #text(weight: "bold", size: 11.5pt, fill: latte.text)[#title]
        ]
      )
      #if desc != none [
        #v(6pt)
        #text(size: 10pt, fill: latte.subtext0)[#desc]
      ]
    ]
  )
}

// ------------------------------------------------------------------------------
// TABLA ESTILIZADA EN FORMATO CATPPUCCIN LATTE
// ------------------------------------------------------------------------------
#let latte-table(
  columns: (1fr, 1fr),
  headers: (),
  rows: (),
) = {
  table(
    columns: columns,
    stroke: 0.6pt + latte.surface1,
    fill: (col, row) => if row == 0 {
      latte.crust
    } else if calc.even(row) {
      latte.mantle
    } else {
      latte.base
    },
    inset: (x: 10pt, y: 8pt),
    align: (col, row) => if row == 0 {
      center + horizon
    } else {
      left + horizon
    },
    ..headers.map(h => text(weight: "bold", fill: latte.lavender, size: 10.5pt)[#h]),
    ..rows.flatten().map(cell => text(size: 10pt, fill: latte.text)[#cell]),
  )
}

// ------------------------------------------------------------------------------
// DISTRIBUCIÓN EN 2 Y 3 COLUMNAS
// ------------------------------------------------------------------------------
#let columns-2(left, right, ratio: (1fr, 1fr), gutter: 18pt) = {
  grid(
    columns: ratio,
    gutter: gutter,
    left,
    right,
  )
}

#let columns-3(col1, col2, col3, gutter: 14pt) = {
  grid(
    columns: (1fr, 1fr, 1fr),
    gutter: gutter,
    col1,
    col2,
    col3,
  )
}

// ------------------------------------------------------------------------------
// COMPARATIVA PROS Y CONTRAS
// ------------------------------------------------------------------------------
#let pro-con(pros: (), cons: ()) = {
  columns-2(
    block(
      width: 100%,
      fill: rgb("#f0f8f4"),
      stroke: (left: 3.5pt + latte.green, rest: 0.8pt + latte.surface0),
      radius: (right: 6pt),
      inset: 12pt,
      [
        #text(fill: latte.green, weight: "bold", size: 11pt)[󰄳 VENTAJAS]
        #v(6pt)
        #list(..pros.map(p => text(size: 10.5pt, fill: latte.text)[#p]))
      ]
    ),
    block(
      width: 100%,
      fill: rgb("#fef3f4"),
      stroke: (left: 3.5pt + latte.red, rest: 0.8pt + latte.surface0),
      radius: (right: 6pt),
      inset: 12pt,
      [
        #text(fill: latte.red, weight: "bold", size: 11pt)[󰅚 DESVENTAJAS]
        #v(6pt)
        #list(..cons.map(c => text(size: 10.5pt, fill: latte.text)[#c]))
      ]
    ),
  )
}
