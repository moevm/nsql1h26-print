FROM node:lts-alpine AS build

ENV PNPM_HOME="/pnpm"
RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

COPY client/package.json ./client/

RUN pnpm install --frozen-lockfile --filter @nosql/client

COPY client ./client

RUN pnpm --filter @nosql/client run build

FROM nginx:stable-alpine AS production

COPY --from=build /app/client/dist /usr/share/nginx/html

COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

