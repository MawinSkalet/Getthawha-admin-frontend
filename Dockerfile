FROM oven/bun:1.3.14 AS production-deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3.14 AS builder

WORKDIR /app

COPY package*.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN rm -rf .next
RUN bun run build

FROM oven/bun:1.3.14 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["bun", "start"]
