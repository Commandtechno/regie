FROM node:24-slim AS builder
WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
COPY packages/mcp/package.json packages/mcp/

RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY packages/backend/ packages/backend/

# Build TypeScript
RUN npm run -w @cu-classes/backend build

# ── Runtime ──────────────────────────────────────────────────
FROM node:24-slim
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/package.json

EXPOSE 3001
CMD ["node", "packages/backend/dist/index.js"]
