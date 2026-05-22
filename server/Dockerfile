# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# prisma.config.ts reads DATABASE_URL at load time via dotenv.
# A dummy value satisfies the env check — generate never connects to a DB.
ENV DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma

# Generate Prisma client BEFORE nest build so TypeScript resolves @prisma/client types
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

# Copy schema so we can regenerate the client against prod node_modules.
# The builder client embeds absolute paths tied to the builder layer.
COPY --from=builder /app/prisma ./prisma

ENV DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma
RUN npx prisma generate
# Remove the dummy — real DATABASE_URL is injected at runtime by ECS task definition
ENV DATABASE_URL=""

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs
EXPOSE 3001

CMD ["node", "dist/main"]
