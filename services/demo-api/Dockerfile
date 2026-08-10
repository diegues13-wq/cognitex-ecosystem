# Single-stage: this service has no build step, only runtime dependencies.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

ENV NODE_ENV=production
# Cloud Run requires the container to listen on 8080.
EXPOSE 8080

# Run unprivileged; the base image already ships a `node` user.
USER node

CMD ["node", "src/server.js"]
