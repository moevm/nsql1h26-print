FROM node:26-alpine3.23 AS build

RUN npm install -g corepack esbuild && corepack enable

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/

RUN pnpm install --frozen-lockfile --filter @nosql/server

COPY server ./server

RUN esbuild ./server/src/index.js --bundle --platform=node --target=node26 --outfile=./bundle/index.js

FROM node:26-alpine3.23 AS production

WORKDIR /app

COPY --from=build /app/bundle/index.js ./index.js

RUN mkdir -p ./uploads/orders ./uploads/exports && chmod 777 -R ./uploads

USER node

EXPOSE 3000

CMD ["node", "index.js"]