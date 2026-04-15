# ============================================================
#  Terra Latitude — Multi-Stage Docker Build
#  Produces a minimal nginx:alpine image (~25 MB)
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias primero (layer cache eficiente)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copiar fuentes y construir
COPY . .
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Borrar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar dist compilado
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
