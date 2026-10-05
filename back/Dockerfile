# syntax=docker/dockerfile:1

# ---- build : compile TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- deps : dépendances de production uniquement ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime ----
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/uploads
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# db/migrations/ est lu par dist/scripts/migrate.js
COPY db ./db
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["node", "dist/server.js"]
