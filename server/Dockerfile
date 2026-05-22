# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

# Only copy compiled output and production deps
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Prisma client is generated into node_modules — already copied above
# If using a custom output path, copy it explicitly:
# COPY --from=builder /app/generated ./generated

USER nestjs
EXPOSE 3001

CMD ["node", "dist/main"]
