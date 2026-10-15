#!/bin/bash
# Crear la carpeta build si no existe
mkdir -p build

# Compilar dirigiendo todos los archivos auxiliares y el PDF a build/ usando XeLaTeX
LC_ALL=C xelatex -interaction=nonstopmode -output-directory=build main.tex
