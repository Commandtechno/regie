FROM node:24-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
COPY packages/mcp/package.json packages/mcp/

RUN npm ci

COPY tsconfig.json ./
COPY packages/frontend/ packages/frontend/

RUN npm run -w @cu-classes/frontend build

# ── Runtime ──────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
