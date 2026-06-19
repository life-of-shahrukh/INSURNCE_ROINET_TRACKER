# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A dummy DATABASE_URL satisfies Prisma's env check at generate/build time.
# The real URL is injected at runtime via ECS task-definition environment vars.
ENV DATABASE_URL="sqlserver://localhost:1433;database=roinet_crm;user=sa;password=x;trustServerCertificate=true"

# Generate Prisma client BEFORE nest build so TypeScript resolves @prisma/client types.
RUN npx prisma generate

# Build the NestJS application.
RUN npm run build

# Compile the Prisma seed scripts into dist/prisma/ so they can be executed
# from the production image without ts-node or TypeScript dev deps.
RUN npx tsc prisma/seed.ts prisma/seed-generators.ts \
      --outDir dist/prisma \
      --module commonjs \
      --target ES2020 \
      --esModuleInterop \
      --resolveJsonModule \
      --skipLibCheck \
      --moduleResolution node

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for the ECS/ALB container health check.
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

# Copy Prisma schema + migrations for migrate deploy, and the compiled seed.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Snapshot files used when USE_EXTERNAL_API_SNAPSHOT=true (avoids VPN dependency in ECS).
COPY --from=builder --chown=nestjs:nodejs /app/data ./data

# Regenerate the Prisma client against the production node_modules.
# The builder client embeds absolute paths tied to the builder layer.
ENV DATABASE_URL="sqlserver://localhost:1433;database=roinet_crm;user=sa;password=x;trustServerCertificate=true"
RUN npx prisma generate
# Remove the dummy — the real DATABASE_URL is injected at runtime.
ENV DATABASE_URL=""

USER nestjs
EXPOSE 3001

# On startup:
#   1. Apply pending Prisma migrations.
#   2. Start NestJS immediately so ALB health checks pass.
#   3. Run idempotent seeds in the background (demo users + Cognitensor sync).
CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/prisma/seed.js && node dist/src/seed/sync-from-snapshots.js &) && exec node dist/src/main"]
