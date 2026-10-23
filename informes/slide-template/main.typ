// ==============================================================================
// PLANTILLA DE DIAPOSITIVAS Y PRESENTACIONES (TYPST)
// Estilo: Catppuccin Latte · Tipografía: DaddyTimeMono Nerd Font
// Proyecto: Sistema de Gestión Comercial y Control de Existencias · Editorial QSY
// ==============================================================================

#import "palette.typ": *
#import "theme.typ": *

// ------------------------------------------------------------------------------
// VARIABLES GLOBALES DE CONFIGURACIÓN DE LA PRESENTACIÓN
// ------------------------------------------------------------------------------
#let itemTitle       = "Planificación del Sprint Backlog"
#let itemShortTitle  = "Lab 04: Sprint Backlog"
#let itemSubtitle    = "Gestión Comercial y Control de Existencias · Editorial QSY"
#let itemAuthor      = "Yourdyy H. · Leonardo A. · Miguel A. · Dolly M."
#let itemInstitution = "Universidad Nacional de San Agustín de Arequipa"
#let itemFaculty     = "EPIS · Gestión de Proyectos de Software"
#let itemDate        = "2026 - Semestre B"
#let itemEvent       = "Laboratorio 04 · Mg. Diego Iquira B."
#let itemLogo        = "img/logo_episunsa.png"

// Inicialización de metadatos globales en el motor de la plantilla
#setup-presentation(
  title: itemTitle,
  short-title: itemShortTitle,
  subtitle: itemSubtitle,
  author: itemAuthor,
  institution: itemFaculty,
  date: itemDate,
  event: itemEvent,
  logo: itemLogo,
)

// ------------------------------------------------------------------------------
// IMPORTACIÓN DEL CONTENIDO DE LAS DIAPOSITIVAS
// ------------------------------------------------------------------------------
#include "content.typ"
