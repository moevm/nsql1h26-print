FROM node:lts-alpine AS production

RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/

RUN pnpm install --frozen-lockfile --filter @nosql/server --prod

COPY server ./server

RUN mkdir -p ./uploads/orders && chmod 777 ./uploads/orders

USER node

EXPOSE 3000

# Запускаем сервер
CMD ["node", "server/src/index.js"]