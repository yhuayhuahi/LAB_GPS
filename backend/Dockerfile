# ==============================================================================
# DOCKERFILE MULTI-STAGE: BACKEND API EDITORIAL QSY
# Base: Node.js 26 sobre Linux Alpine (Ultra ligero)
# ==============================================================================

# STAGE 1: Compilación de TypeScript
FROM node:26-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json* ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm install

# Copiar código fuente y configuración de TypeScript
COPY tsconfig.json ./
COPY src/ ./src/

# Compilar TypeScript a JavaScript en dist/
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: Imagen final de Producción
FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Crear usuario sin privilegios para seguridad en contenedor
RUN addgroup -S qsygroup && adduser -S qsyuser -G qsygroup

# Copiar manifiesto e instalar únicamente dependencias de producción
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Copiar script SQL para inicialización de base de datos
COPY src/db/schema.sql ./dist/db/schema.sql

# Crear carpeta de datos local para SQLite con permisos apropiados
RUN mkdir -p /app/data && chown -R qsyuser:qsygroup /app

USER qsyuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
