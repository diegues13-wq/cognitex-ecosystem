# Industry Sentinel — built from the repository root.
#
# The context moved from ./industry-sentinel to the repo root because the app
# now depends on the @cognitex/* workspace packages, which live outside its
# directory. `npm ci` needs the root lockfile to resolve them, so a
# directory-scoped context can no longer install this app at all.
#
# Build:  docker build -f industry-sentinel/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /repo

# Manifests first so a source-only change reuses the install layer.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY industry-sentinel/package.json ./industry-sentinel/

# Only this app's subtree, resolved against the complete root lockfile — the
# other five consoles' dependencies are never downloaded.
RUN npm ci --workspace industry-sentinel --include-workspace-root

COPY industry-sentinel ./industry-sentinel

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
RUN npm run build --workspace industry-sentinel

FROM nginx:alpine
COPY --from=build /repo/industry-sentinel/dist /usr/share/nginx/html
COPY industry-sentinel/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
