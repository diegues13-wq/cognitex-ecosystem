# syntax=docker/dockerfile:1
#
# Cash Sentinel had no container and no pipeline: it was the one Sentinel that
# never shipped anywhere, which is why BRANDS.cash carries `url: null`.
#
# Build it from the REPOSITORY ROOT, not from ./cash-sentinel:
#
#     docker build -f cash-sentinel/Dockerfile -t cash-sentinel .
#
# The app imports @cognitex/theme, @cognitex/ui and @cognitex/config, which
# live in packages/ and are linked by the npm workspace. Docker cannot COPY
# from outside its build context, so a context of ./cash-sentinel physically
# cannot see them. Only the four paths this file needs are copied in, so the
# root context costs nothing beyond what .dockerignore already excludes.

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo

# Manifests and shared sources first. `npm ci --workspace` tolerates the other
# workspace directories being absent, so industry-, personal-, transport- and
# the rest never enter this image.
COPY package.json package-lock.json ./
COPY packages packages
COPY cash-sentinel/package.json cash-sentinel/package.json
RUN npm ci --workspace cash-sentinel --include-workspace-root

COPY cash-sentinel cash-sentinel
# `build` is `tsc --noEmit && vite build`, so a type error fails the image
# rather than shipping.
RUN npm run build --workspace cash-sentinel

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /repo/cash-sentinel/dist /usr/share/nginx/html
COPY cash-sentinel/nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run routes to $PORT, which is 8080. nginx.conf listens on the same.
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
