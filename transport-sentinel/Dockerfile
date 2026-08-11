# Transport Sentinel — built from the repository root.
#
# The context moved from ./transport-sentinel to the repo root because the SPA
# now depends on the @cognitex/* workspace packages, which live outside its
# directory. `npm ci` needs the root lockfile to resolve them, so a
# directory-scoped context can no longer install this app at all.
#
# The two-stage shape is unchanged and deliberate: unlike the other five
# consoles this one ships a Node process rather than nginx, because streaming
# Vertex AI responses needs a server that can hold a credential. Stage 2 is
# that server, and it serves the built SPA from ./public.
#
# Build:  docker build -f transport-sentinel/Dockerfile .

# ── Stage 1: build the SPA ───────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo

# Manifests first so a source-only change reuses the install layer.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY transport-sentinel/package.json ./transport-sentinel/

# Only this app's subtree, resolved against the complete root lockfile — the
# other five consoles' dependencies are never downloaded.
RUN npm ci --workspace transport-sentinel --include-workspace-root

COPY transport-sentinel ./transport-sentinel

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# `build` runs `tsc --noEmit && vite build`, so a type error fails the image.
RUN npm run build --workspace transport-sentinel

# ── Stage 2: the API, serving the SPA ────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# The API is its own npm package with its own lockfile: it is not a workspace
# member, because nothing in it is shared and it must install without the
# frontend's dependency tree.
COPY transport-sentinel/api/package.json transport-sentinel/api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Source after install. Dockerfile.dockerignore keeps node_modules out of the
# context, so this cannot overwrite the production install with a dev one —
# which is what used to ship ~91MB of the frontend's modules into the image.
COPY transport-sentinel/api/ ./
COPY --from=build /repo/transport-sentinel/dist ./public

ENV NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "server.js"]
