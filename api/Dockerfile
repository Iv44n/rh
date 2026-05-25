# ========== BASE ==========
FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# ========== DEPS ==========
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# ========== BUILDER ==========
FROM base AS builder

ENV CI=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

RUN pnpm prune --prod

# ========== RUNTIME ==========
FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# seguridad
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main.js"]