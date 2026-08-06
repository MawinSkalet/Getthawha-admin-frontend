FROM oven/bun:1 AS builder

WORKDIR /app

COPY package*.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

RUN rm -rf .next
RUN bun run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000

CMD ["bun", "start"]