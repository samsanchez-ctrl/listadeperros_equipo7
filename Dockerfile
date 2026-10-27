# ————————————————————————————————————————
# Dockerfile — Lista de Perros 🐶 (Equipo 7)
# Build multi-stage:
#   1) "calidad": instala dependencias de desarrollo y corre lint + tests.
#      Si algo falla, la imagen NO se construye.
#   2) "produccion": Nginx sin privilegios (usuario no-root) que solo
#      contiene los archivos estáticos. Sin Node ni node_modules.
# ————————————————————————————————————————

# ---------- Etapa 1: calidad (lint + tests) ----------
FROM node:22-alpine AS calidad
WORKDIR /app

# Copiamos primero los manifiestos para aprovechar la caché de capas
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run lint && npm test -- --ci

# Solo los archivos que se publican pasan a la siguiente etapa
RUN mkdir /dist && cp index.html index.js logica.js style.css /dist/

# ---------- Etapa 2: producción ----------
# Imagen oficial de Nginx que corre como usuario no-root (uid 101) en el puerto 8080
FROM nginxinc/nginx-unprivileged:1.29-alpine AS produccion

LABEL org.opencontainers.image.title="listadeperros" \
      org.opencontainers.image.description="Lista de Perros — Equipo 7 · DOY0101" \
      org.opencontainers.image.source="https://github.com/samsanchez-ctrl/listadeperros_equipo7"

# Actualiza los paquetes del sistema para corregir vulnerabilidades conocidas
# detectadas por Trivy en la imagen base (curl, openssl, expat, pcre2, etc.)
USER root
RUN apk upgrade --no-cache

# Configuración propia: cabeceras de seguridad, caché y endpoint /health
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=calidad --chown=101:101 /dist/ /usr/share/nginx/html/

USER 101
EXPOSE 8080

# Docker revisa periódicamente que el servidor responda
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
