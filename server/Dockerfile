# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Generate Prisma client BEFORE nest build so TypeScript can resolve @prisma/client types
RUN npx prisma generate
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

# Re-generate Prisma client in the runner stage against the prod node_modules
# (the builder's generated client is tied to that layer's node_modules path)
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs
EXPOSE 3001

CMD ["node", "dist/main"]
