# ── Stage 1: build React SPA ────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /build

# Install frontend deps
COPY package*.json vite.config.js tailwind.config.js postcss.config.js ./
RUN npm ci

# Pass Firebase + API keys as build args
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GEMINI_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

COPY index.html .
COPY src/ ./src/
RUN npm run build

# ── Stage 2: Node.js API + serve static ─────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY api/package*.json ./
RUN npm ci --production

COPY api/ .
COPY --from=build /build/dist ./public

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
