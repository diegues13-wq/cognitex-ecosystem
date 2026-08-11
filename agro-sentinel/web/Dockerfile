# Agro Sentinel — built from the repository root.
#
# The context moved from ./agro-sentinel/web to the repo root because the app
# now depends on the @cognitex/* workspace packages, which live outside its
# directory. `npm ci` needs the root lockfile to resolve them, so a
# directory-scoped context can no longer install this app at all.
#
# Build:  docker build -f agro-sentinel/web/Dockerfile .
#
# Two corrections over the image this replaces:
#
#  1. It declared no ARG, and deploy-agro.yaml passed no --build-arg, so
#     VITE_FIREBASE_API_KEY was empty in every image ever built. The deployed
#     console was therefore permanently in demo mode: any credentials were
#     accepted at the login screen and every number on it was generated in the
#     browser. Every other platform passed these six values.
#  2. It did `COPY package*.json ./`, `npm ci`, then `COPY . .` — with no
#     .dockerignore, so the developer's local node_modules was copied straight
#     over the result of the install. Whatever was on the build machine, from
#     whatever branch, is what shipped.

FROM node:22-alpine AS build
WORKDIR /repo

# Manifests first so a source-only change reuses the install layer.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY agro-sentinel/web/package.json ./agro-sentinel/web/

# Only this app's subtree, resolved against the complete root lockfile — the
# other five consoles' dependencies are never downloaded.
RUN npm ci --workspace agro-sentinel-web --include-workspace-root

COPY agro-sentinel/web ./agro-sentinel/web

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# `build` runs `tsc --noEmit && vite build`, so a type error fails the image.
RUN npm run build --workspace agro-sentinel-web

FROM nginx:alpine
COPY --from=build /repo/agro-sentinel/web/dist /usr/share/nginx/html
COPY agro-sentinel/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
