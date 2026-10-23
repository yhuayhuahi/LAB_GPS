#!/bin/bash
# Crear la carpeta build si no existe
mkdir -p build

# Compilar main.typ dirigiendo la salida a build/main.pdf
typst compile main.typ build/main.pdf
