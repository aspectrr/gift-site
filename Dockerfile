FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM base AS run
ENV NODE_ENV=production DB_PATH=/data/gifts.db PORT=3000
COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
