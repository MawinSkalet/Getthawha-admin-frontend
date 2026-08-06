FROM oven/bun:1 AS builder
WORKDIR /app
COPY package*.json ./
COPY bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN rm -rf .next
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=builder /app ./
CMD ["bun", "start"]