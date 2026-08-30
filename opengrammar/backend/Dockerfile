# ----- Stage 1: Build --------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app/backend

RUN apk add --no-cache python3 make g++

COPY backend/package*.json backend/tsconfig.json ./

RUN npm install

COPY backend/src/ ./src/
COPY backend/server-node.ts ./
COPY shared/ /app/shared/

RUN npx tsc --noEmit || true

# ----- Stage 2: Production ---------------------------------------------------
FROM node:20-alpine

LABEL org.opencontainers.image.title="OpenGrammar Backend"
LABEL org.opencontainers.image.source="https://github.com/swadhinbiswas/opengrammar"
LABEL org.opencontainers.image.version="2.0.0"

WORKDIR /app/backend

RUN apk add --no-cache dumb-init

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/src ./src
COPY --from=builder /app/backend/server-node.ts ./
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/tsconfig.json ./
COPY --from=builder /app/shared /app/shared

RUN addgroup -g 1001 -S opengrammar && \
  adduser -S -u 1001 -G opengrammar opengrammar
USER opengrammar

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--import", "tsx/esm", "server-node.ts"]